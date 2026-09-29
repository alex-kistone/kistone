import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Loader2, Send, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CompanySearch, { type CompanyData } from "@/components/platform/CompanySearch";
import {
  KYC_STATUS,
  REQUIRED_DOCS,
  isValidIban,
  isValidSiret,
  missingForSubmission,
  type KycDocSpec,
  type KycDocument,
  type KycDossier,
  type KycParty,
} from "@/lib/kyc";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp";

/** Champs société affichés, par partie (colonne → libellé). */
const FIELDS: Record<KycParty, { key: string; label: string; placeholder?: string; type?: string }[]> = {
  freelance: [
    { key: "company_name", label: "Raison sociale" },
    { key: "legal_form", label: "Forme juridique", placeholder: "SASU, EURL, EI…" },
    { key: "siren", label: "SIREN" },
    { key: "siret", label: "SIRET" },
    { key: "company_address", label: "Adresse du siège" },
    { key: "tva_number", label: "N° de TVA intracommunautaire", placeholder: "Si assujetti" },
    { key: "iban", label: "IBAN", placeholder: "FR76 …" },
    { key: "bic", label: "BIC" },
  ],
  client: [
    { key: "company_name", label: "Raison sociale" },
    { key: "legal_form", label: "Forme juridique" },
    { key: "siren", label: "SIREN" },
    { key: "siret", label: "SIRET" },
    { key: "company_address", label: "Adresse du siège" },
    { key: "vat_number", label: "N° de TVA intracommunautaire" },
    { key: "representative_name", label: "Représentant légal (signataire)" },
    { key: "representative_title", label: "Qualité du représentant", placeholder: "Président, Gérant…" },
    { key: "billing_email", label: "Email de facturation", type: "email" },
  ],
};

const TABLE: Record<KycParty, "recruiter_profiles" | "client_profiles"> = {
  freelance: "recruiter_profiles",
  client: "client_profiles",
};

type Fields = Record<string, string>;

function StatusBanner({ dossier }: { dossier: KycDossier | null }) {
  if (!dossier) {
    return (
      <div className="flex gap-3 rounded-2xl border border-border bg-muted/60 p-4 text-sm">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p>
          <span className="font-semibold">Votre dossier vous sera demandé au démarrage de votre première mission.</span>{" "}
          <span className="text-muted-foreground">Vous pouvez le préparer dès maintenant.</span>
        </p>
      </div>
    );
  }
  const s = KYC_STATUS[dossier.status];
  const Icon = dossier.status === "approved" ? CheckCircle2 : dossier.status === "rejected" ? AlertCircle : Clock;
  const text = {
    incomplete: "Complétez vos informations et vos pièces, puis envoyez votre dossier : il conditionne le démarrage de votre mission.",
    submitted: "Votre dossier est en cours de vérification par l'équipe Kistone. Vous serez prévenu dès qu'il sera validé.",
    approved: "Votre dossier est validé. Pour modifier une information, contactez l'équipe Kistone.",
    rejected: `Votre dossier est à corriger${dossier.rejection_reason ? ` : ${dossier.rejection_reason}` : "."}`,
  }[dossier.status];
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", s.tone)}>{s.label}</span>
        <p className="mt-1.5">{text}</p>
      </div>
    </div>
  );
}

function DocumentRow({
  spec, doc, editable, userId, onChanged,
}: { spec: KycDocSpec; doc?: KycDocument; editable: boolean; userId: string; onChanged: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const inputId = `kyc-file-${spec.kind}`;

  const open = async () => {
    if (!doc) return;
    const { data, error } = await supabase.storage.from("admin-documents").createSignedUrl(doc.path, 300);
    if (error || !data) toast({ title: "Ouverture impossible", description: error?.message, variant: "destructive" });
    else window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (silent = false) => {
    if (!doc) return;
    const { error } = await supabase.from("kyc_documents" as never).delete().eq("id", doc.id);
    if (error) { toast({ title: "Suppression impossible", description: error.message, variant: "destructive" }); return false; }
    await supabase.storage.from("admin-documents").remove([doc.path]);
    if (!silent) onChanged();
    return true;
  };

  const upload = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "Fichier trop volumineux", description: "10 Mo maximum.", variant: "destructive" });
      return;
    }
    if (spec.expires && !expiresAt) {
      toast({ title: "Date de validité requise", description: `Indiquez jusqu'à quand « ${spec.label} » est valable.`, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      // Une seule pièce par type : on remplace l'ancienne
      if (doc && !(await remove(true))) return;
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${userId}/${spec.kind}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("admin-documents").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("kyc_documents" as never).insert({
        user_id: userId, kind: spec.kind, path, file_name: file.name, mime: file.type, size: file.size,
        expires_at: spec.expires ? expiresAt : null,
      } as never);
      if (dbErr) {
        await supabase.storage.from("admin-documents").remove([path]);
        throw dbErr;
      }
      toast({ title: "Pièce ajoutée", description: spec.label });
      setExpiresAt("");
      onChanged();
    } catch (err) {
      toast({ title: "Envoi impossible", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const expired = Boolean(doc?.expires_at && doc.expires_at < today);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{spec.label}</p>
        {doc ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {doc.file_name}
            {doc.expires_at ? (
              <span className={cn("ml-1", expired && "font-medium text-destructive")}>
                · valable jusqu'au {new Date(doc.expires_at).toLocaleDateString("fr-FR")}{expired ? " (expiré)" : ""}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">{spec.hint}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {doc ? (
          <Button type="button" variant="outline" size="sm" onClick={open} className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Voir
          </Button>
        ) : null}
        {editable ? (
          <>
            {spec.expires ? (
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`${inputId}-exp`} className="sr-only">Valable jusqu'au</Label>
                <Input
                  id={`${inputId}-exp`}
                  type="date"
                  min={today}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-9 w-40"
                  aria-label={`${spec.label} : valable jusqu'au`}
                />
              </div>
            ) : null}
            <input
              id={inputId}
              type="file"
              accept={ACCEPTED}
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }}
            />
            <Button type="button" size="sm" variant={doc ? "outline" : "default"} disabled={busy} asChild>
              <label htmlFor={inputId} className="cursor-pointer gap-1.5">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
                {doc ? "Remplacer" : "Ajouter"}
              </label>
            </Button>
            {doc ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => remove()} aria-label={`Retirer ${spec.label}`}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </li>
  );
}

/**
 * « Mon dossier » (KYC) du client ou du freelance : informations société, pièces,
 * envoi pour vérification. Modifiable tant que le dossier n'est ni envoyé ni validé.
 */
export default function KycDossierPanel({ party, userId, email }: { party: KycParty; userId: string; email?: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dossier, setDossier] = useState<KycDossier | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [fields, setFields] = useState<Fields>({});
  const [savedFields, setSavedFields] = useState<Fields>({});

  const load = useCallback(async () => {
    const [d, docs, profile] = await Promise.all([
      supabase.from("kyc_dossiers" as never).select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("kyc_documents" as never).select("*").eq("user_id", userId).order("uploaded_at", { ascending: false }),
      supabase.from(TABLE[party] as never).select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setDossier((d.data as KycDossier | null) ?? null);
    setDocuments((docs.data as KycDocument[] | null) ?? []);
    const row = (profile.data ?? {}) as Record<string, unknown>;
    const values = Object.fromEntries(FIELDS[party].map((f) => [f.key, (row[f.key] as string | null) ?? ""]));
    setFields(values);
    setSavedFields(values);
    setLoading(false);
  }, [party, userId]);

  useEffect(() => { load(); }, [load]);

  const editable = !dossier || dossier.status === "incomplete" || dossier.status === "rejected";
  const dirty = FIELDS[party].some((f) => (fields[f.key] ?? "") !== (savedFields[f.key] ?? ""));
  const missing = useMemo(() => missingForSubmission(party, savedFields, documents), [party, savedFields, documents]);

  const set = (key: string, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  const fillFromCompany = (c: CompanyData) => {
    setFields((prev) => ({
      ...prev,
      company_name: c.companyName,
      siren: c.siren,
      siret: c.siret || prev.siret || "",
      legal_form: c.legalForm,
      company_address: c.companyAddress,
      [party === "freelance" ? "tva_number" : "vat_number"]: c.tvaNumber,
    }));
  };

  const save = async () => {
    const clean: Fields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()]));
    if (clean.siret) clean.siret = clean.siret.replace(/\s/g, "");
    if (clean.siret && !isValidSiret(clean.siret)) {
      toast({ title: "SIRET invalide", description: "Vérifiez les 14 chiffres.", variant: "destructive" });
      return;
    }
    if (party === "freelance" && clean.iban) {
      clean.iban = clean.iban.replace(/\s/g, "").toUpperCase();
      if (!isValidIban(clean.iban)) {
        toast({ title: "IBAN invalide", description: "Vérifiez votre IBAN.", variant: "destructive" });
        return;
      }
    }
    if (clean.bic) clean.bic = clean.bic.replace(/\s/g, "").toUpperCase();
    setSaving(true);
    // client_profiles.company_name est NOT NULL (chaîne vide par défaut) : jamais null
    const payload = Object.fromEntries(
      Object.entries(clean).map(([k, v]) => [k, v || (party === "client" && k === "company_name" ? "" : null)]),
    );
    const { error } = party === "client"
      // Le profil client peut ne pas exister encore : création à la volée
      ? await supabase.from("client_profiles" as never).upsert({ user_id: userId, email: email ?? "", ...payload } as never, { onConflict: "user_id" })
      : await supabase.from("recruiter_profiles" as never).update(payload as never).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" });
      return;
    }
    setFields(clean);
    setSavedFields(clean);
    toast({ title: "Informations enregistrées" });
  };

  const submit = async () => {
    if (!dossier || missing.length || dirty) return;
    setSubmitting(true);
    const { error } = await supabase.from("kyc_dossiers" as never).update({ status: "submitted" } as never).eq("user_id", userId);
    setSubmitting(false);
    if (error) {
      toast({ title: "Envoi impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Dossier envoyé", description: "L'équipe Kistone va le vérifier." });
    load();
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement du dossier…</div>;
  }

  return (
    <div className="space-y-8">
      <StatusBanner dossier={dossier} />

      <section aria-labelledby="kyc-company" className="space-y-4">
        <div>
          <h2 id="kyc-company" className="text-xl font-semibold">{party === "client" ? "Votre entreprise" : "Votre société"}</h2>
          <p className="text-sm text-muted-foreground">Ces informations figurent sur les contrats et les factures.</p>
        </div>
        {editable ? <CompanySearch onSelect={fillFromCompany} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS[party].map((f) => (
            <div key={f.key} className={cn("space-y-1.5", f.key === "company_address" && "sm:col-span-2")}>
              <Label htmlFor={`kyc-${f.key}`}>{f.label}</Label>
              <Input
                id={`kyc-${f.key}`}
                type={f.type ?? "text"}
                value={fields[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)}
                readOnly={!editable}
                autoComplete="off"
              />
            </div>
          ))}
        </div>
        {editable ? (
          <Button type="button" onClick={save} disabled={saving || !dirty}>
            {saving ? "Enregistrement…" : "Enregistrer les informations"}
          </Button>
        ) : null}
      </section>

      <section aria-labelledby="kyc-docs" className="space-y-4">
        <div>
          <h2 id="kyc-docs" className="text-xl font-semibold">Pièces justificatives</h2>
          <p className="text-sm text-muted-foreground">PDF, JPG, PNG ou WEBP, 10 Mo maximum par fichier.</p>
        </div>
        <ul className="space-y-3">
          {REQUIRED_DOCS[party].map((spec) => (
            <DocumentRow
              key={spec.kind}
              spec={spec}
              doc={documents.find((d) => d.kind === spec.kind)}
              editable={editable}
              userId={userId}
              onChanged={load}
            />
          ))}
        </ul>
      </section>

      {dossier && editable ? (
        <section aria-labelledby="kyc-submit" className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 id="kyc-submit" className="text-lg font-semibold">Envoyer mon dossier</h2>
          {missing.length || dirty ? (
            <div className="text-sm text-muted-foreground">
              {dirty ? <p>Enregistrez d'abord vos informations.</p> : null}
              {missing.length ? (
                <>
                  <p>Il manque encore :</p>
                  <ul className="mt-1 list-disc pl-5">
                    {missing.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tout est complet : l'équipe Kistone vérifie votre dossier après envoi.</p>
          )}
          <Button type="button" onClick={submit} disabled={submitting || dirty || missing.length > 0} className="gap-2">
            <Send className="h-4 w-4" aria-hidden="true" />
            {submitting ? "Envoi…" : "Envoyer mon dossier"}
          </Button>
        </section>
      ) : null}

      {!editable ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" aria-hidden="true" /> Dossier en lecture seule pendant la vérification et après validation.
        </p>
      ) : null}
    </div>
  );
}
