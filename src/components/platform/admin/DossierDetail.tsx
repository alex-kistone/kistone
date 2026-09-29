import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  KYC_STATUS, REQUIRED_DOCS, REQUIRED_FIELDS, isValidIban, isValidSiret, missingForSubmission,
  type KycDocKind, type KycDocument, type KycParty,
} from "@/lib/kyc";
import { PARTY_LABEL, frDate, openPrivateFile } from "./adv";
import { notifyKycChanged, type DossierRow, type ProfileRow } from "./kycDossiers";

/** Champs affichés dans le détail, dans l'ordre (en plus des champs obligatoires de kyc.ts). */
const DISPLAY_FIELDS: Record<KycParty, { key: string; label: string }[]> = {
  freelance: [
    { key: "company_name", label: "Raison sociale" },
    { key: "legal_form", label: "Forme juridique" },
    { key: "siren", label: "SIREN" },
    { key: "siret", label: "SIRET" },
    { key: "tva_number", label: "TVA intracommunautaire" },
    { key: "company_address", label: "Adresse du siège" },
    { key: "iban", label: "IBAN" },
    { key: "bic", label: "BIC" },
    { key: "email", label: "Email" },
  ],
  client: [
    { key: "company_name", label: "Raison sociale" },
    { key: "legal_form", label: "Forme juridique" },
    { key: "siren", label: "SIREN" },
    { key: "siret", label: "SIRET" },
    { key: "vat_number", label: "TVA intracommunautaire" },
    { key: "company_address", label: "Adresse du siège" },
    { key: "representative_name", label: "Représentant légal" },
    { key: "representative_title", label: "Qualité du représentant" },
    { key: "billing_email", label: "Email de facturation" },
    { key: "email", label: "Email du compte" },
  ],
};

const DOC_LABELS: Record<KycDocKind, string> = {
  ...Object.fromEntries(
    [...REQUIRED_DOCS.client, ...REQUIRED_DOCS.freelance].map((d) => [d.kind, d.label]),
  ),
  other: "Autre document",
} as Record<KycDocKind, string>;

const maskIban = (iban: string) => {
  const s = iban.replace(/\s/g, "");
  return `${"•".repeat(Math.max(0, s.length - 4)).replace(/(.{4})/g, "$1 ")}${s.slice(-4)}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

interface Props {
  dossier: DossierRow;
  onChanged: () => Promise<void> | void;
}

/** Revue d'un dossier KYC (contenu du panneau latéral admin) : informations, pièces, validation ou refus. */
const DossierDetail = ({ dossier, onChanged }: Props) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [showIban, setShowIban] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("kyc_documents" as never)
        .select("*")
        .eq("user_id" as never, dossier.user_id as never)
        .order("uploaded_at" as never, { ascending: false });
      if (!cancelled) {
        setDocuments((data ?? []) as unknown as KycDocument[]);
        setDocsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dossier.user_id]);

  const fields = dossier.profile ?? {};
  const missing = docsLoading ? [] : missingForSubmission(dossier.party, fields, documents);
  const today = todayIso();
  const requiredKeys = new Set(REQUIRED_FIELDS[dossier.party].map((f) => f.key));

  const decide = async (status: "approved" | "rejected") => {
    setSaving(true);
    const { error } = await supabase
      .from("kyc_dossiers" as never)
      .update({ status, rejection_reason: status === "rejected" ? reason.trim() : null } as never)
      .eq("user_id" as never, dossier.user_id as never);
    setSaving(false);
    if (error) {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: status === "approved" ? "Dossier validé" : "Dossier renvoyé en correction",
      description: `${dossier.displayName}${dossier.companyName ? ` · ${dossier.companyName}` : ""}`,
    });
    setConfirmApprove(false);
    setRejectOpen(false);
    setReason("");
    notifyKycChanged();
    await onChanged();
  };

  const open = async (doc: KycDocument) => {
    const err = await openPrivateFile("admin-documents", doc.path);
    if (err) toast({ title: "Ouverture impossible", description: err, variant: "destructive" });
  };

  const renderValue = (key: string) => {
    const value = (fields as ProfileRow)[key];
    if (!value) {
      return <span className={requiredKeys.has(key) ? "text-destructive" : "text-muted-foreground"}>Non renseigné</span>;
    }
    if (key === "iban") {
      const ok = isValidIban(value);
      return (
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-all font-mono">{showIban ? value : maskIban(value)}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setShowIban((v) => !v)}
            aria-label={showIban ? "Masquer l'IBAN" : "Afficher l'IBAN"}
          >
            {showIban ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showIban ? "Masquer" : "Afficher"}
          </Button>
          <ValidityTag ok={ok} okLabel="IBAN valide" koLabel="IBAN invalide" />
        </span>
      );
    }
    if (key === "siret") {
      return (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono">{value}</span>
          <ValidityTag ok={isValidSiret(value)} okLabel="SIRET valide" koLabel="SIRET invalide" />
        </span>
      );
    }
    return <span className="break-words">{value}</span>;
  };

  return (
    <div className="space-y-6">
      <SheetHeader className="space-y-1 pr-8 text-left">
        <SheetTitle className="text-lg">{dossier.displayName}</SheetTitle>
        <SheetDescription>
          Dossier {PARTY_LABEL[dossier.party].toLowerCase()}{dossier.companyName ? ` · ${dossier.companyName}` : ""}
        </SheetDescription>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <Badge className={KYC_STATUS[dossier.status].tone}>{KYC_STATUS[dossier.status].label}</Badge>
          {dossier.submitted_at && <span>Envoyé le {frDate(dossier.submitted_at)}</span>}
          {dossier.reviewed_at && <span>· Revu le {frDate(dossier.reviewed_at)}</span>}
        </div>
      </SheetHeader>

      {dossier.status === "rejected" && dossier.rejection_reason && (
        <div className="rounded-lg border border-[#F5C2D3] bg-[#FFE3EC]/60 p-3 text-sm text-[#8F1747]">
          <span className="font-medium">Motif du refus : </span>{dossier.rejection_reason}
        </div>
      )}

      {!dossier.profile && (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          Aucun profil {dossier.party === "client" ? "client" : "freelance"} relié à ce compte.
        </p>
      )}

      <section aria-labelledby="kyc-company">
        <h3 id="kyc-company" className="mb-2 text-sm font-semibold">Informations société</h3>
        <dl className="divide-y divide-border rounded-lg border border-border text-sm">
          {DISPLAY_FIELDS[dossier.party].map((f) => (
            <div key={f.key} className="grid gap-1 px-3 py-2 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="min-w-0">{renderValue(f.key)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="kyc-docs">
        <h3 id="kyc-docs" className="mb-2 text-sm font-semibold">Pièces justificatives</h3>
        {docsLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune pièce déposée.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {documents.map((d) => {
              const expired = !!d.expires_at && d.expires_at < today;
              return (
                <li key={d.id} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{DOC_LABELS[d.kind] ?? d.kind}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.file_name} · déposé le {frDate(d.uploaded_at)}
                    </p>
                    {d.expires_at && (
                      <p className={cn("text-xs", expired ? "font-medium text-destructive" : "text-muted-foreground")}>
                        {expired ? `Expiré depuis le ${frDate(d.expires_at)}` : `Valable jusqu'au ${frDate(d.expires_at)}`}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1 self-start sm:self-auto" onClick={() => open(d)}>
                    <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                    <span className="sr-only"> {d.file_name} dans un nouvel onglet</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="kyc-missing">
        <h3 id="kyc-missing" className="mb-2 text-sm font-semibold">Reste à fournir</h3>
        {docsLoading ? null : missing.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-[#17663F]"><CheckCircle2 className="h-4 w-4" /> Dossier complet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {missing.map((m) => (
              <li key={m} className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {m}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="gap-1 text-destructive"
          disabled={saving || dossier.status === "rejected"}
          onClick={() => setRejectOpen(true)}
        >
          <XCircle className="h-4 w-4" /> Refuser
        </Button>
        <Button className="gap-1" disabled={saving || dossier.status === "approved"} onClick={() => setConfirmApprove(true)}>
          <CheckCircle2 className="h-4 w-4" /> Valider le dossier
        </Button>
      </div>

      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider le dossier de {dossier.displayName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {missing.length > 0
                ? `Attention, il manque encore : ${missing.join(", ")}. Vous pouvez tout de même le valider.`
                : "Les informations et les pièces ont été vérifiées. Le dossier sera marqué comme validé."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => { e.preventDefault(); decide("approved"); }}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oui, valider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectOpen} onOpenChange={(v) => { if (!saving) setRejectOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le dossier</DialogTitle>
            <DialogDescription>
              Le titulaire verra ce motif et pourra corriger son dossier puis le renvoyer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="kyc-reason">Motif du refus (obligatoire)</Label>
            <Textarea
              id="kyc-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex. : l'attestation URSSAF a plus de 6 mois, merci d'en déposer une récente."
              rows={4}
              aria-required="true"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={saving}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={saving || !reason.trim()}
              onClick={() => decide("rejected")}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refuser le dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ValidityTag = ({ ok, okLabel, koLabel }: { ok: boolean; okLabel: string; koLabel: string }) => (
  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", ok ? "text-[#17663F]" : "text-destructive")}>
    {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
    {ok ? okLabel : koLabel}
  </span>
);

export default DossierDetail;
