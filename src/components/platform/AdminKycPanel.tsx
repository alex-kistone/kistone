import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, ExternalLink, Eye, EyeOff, FolderCheck, Loader2, Search, X, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  type KycDocKind, type KycDocument, type KycDossier, type KycParty, type KycStatus,
} from "@/lib/kyc";
import { PARTY_LABEL, frDate, openPrivateFile } from "./admin/adv";

type ProfileRow = Record<string, string | null>;

interface DossierRow extends KycDossier {
  profile: ProfileRow | null;
  displayName: string;
  companyName: string;
}

const FREELANCE_COLUMNS =
  "user_id, first_name, last_name, email, company_name, legal_form, siren, siret, company_address, tva_number, iban, bic";
const CLIENT_COLUMNS =
  "user_id, first_name, last_name, email, company_name, legal_form, siren, siret, company_address, vat_number, billing_email, representative_name, representative_title";

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

type StatusFilter = "all" | KycStatus;
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "submitted", label: "À vérifier" },
  { value: "incomplete", label: "À compléter" },
  { value: "rejected", label: "À corriger" },
  { value: "approved", label: "Validés" },
  { value: "all", label: "Tous" },
];
const STATUS_ORDER: Record<KycStatus, number> = { submitted: 0, rejected: 1, incomplete: 2, approved: 3 };

const maskIban = (iban: string) => {
  const s = iban.replace(/\s/g, "");
  return `${"•".repeat(Math.max(0, s.length - 4)).replace(/(.{4})/g, "$1 ")}${s.slice(-4)}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const AdminKycPanel = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get("user");

  const [rows, setRows] = useState<DossierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => (selectedUserId ? "all" : "submitted"));
  const [partyFilter, setPartyFilter] = useState<"all" | KycParty>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("kyc_dossiers" as never).select("*");
    if (error) {
      toast({ title: "Dossiers indisponibles", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const dossiers = (data ?? []) as unknown as KycDossier[];
    const freelanceIds = dossiers.filter((d) => d.party === "freelance").map((d) => d.user_id);
    const clientIds = dossiers.filter((d) => d.party === "client").map((d) => d.user_id);

    const [freelances, clients] = await Promise.all([
      freelanceIds.length
        ? supabase.from("recruiter_profiles").select(FREELANCE_COLUMNS as "*").in("user_id", freelanceIds)
        : Promise.resolve({ data: [] }),
      clientIds.length
        ? supabase.from("client_profiles").select(CLIENT_COLUMNS as "*").in("user_id", clientIds)
        : Promise.resolve({ data: [] }),
    ]);
    const byUser = new Map<string, ProfileRow>();
    for (const p of [...((freelances.data ?? []) as unknown[]), ...((clients.data ?? []) as unknown[])]) {
      const row = p as ProfileRow;
      if (row.user_id) byUser.set(row.user_id, row);
    }

    setRows(
      dossiers.map((d) => {
        const profile = byUser.get(d.user_id) ?? null;
        const person = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
        return {
          ...d,
          profile,
          displayName: person || profile?.email || "Compte sans profil",
          companyName: profile?.company_name || "",
        };
      }),
    );
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const select = (userId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (userId) next.set("user", userId);
    else next.delete("user");
    setSearchParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: rows.length, incomplete: 0, submitted: 0, approved: 0, rejected: 0 };
    rows.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => partyFilter === "all" || r.party === partyFilter)
      .filter((r) => !q || `${r.displayName} ${r.companyName}`.toLowerCase().includes(q))
      .sort((a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        || (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""),
      );
  }, [rows, statusFilter, partyFilter, query]);

  const selected = rows.find((r) => r.user_id === selectedUserId) ?? null;

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement des dossiers...</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? "default" : "outline"}
              aria-pressed={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label} ({counts[f.value]})
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex gap-2" role="group" aria-label="Filtrer par partie">
            {(["all", "client", "freelance"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={partyFilter === p ? "secondary" : "ghost"}
                aria-pressed={partyFilter === p}
                onClick={() => setPartyFilter(p)}
              >
                {p === "all" ? "Tous" : p === "client" ? "Clients" : "Freelances"}
              </Button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Label htmlFor="kyc-search" className="sr-only">Rechercher un dossier</Label>
            <Input
              id="kyc-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou société"
              className="pl-9"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <FolderCheck className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun dossier dans cette vue.</p>
            <p className="mt-1 text-xs text-muted-foreground">Un dossier s'ouvre pour chaque partie à la création d'une mission.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((r) => (
              <li key={r.user_id}>
                <button
                  type="button"
                  onClick={() => select(r.user_id)}
                  aria-current={r.user_id === selectedUserId ? "true" : undefined}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    r.user_id === selectedUserId ? "border-primary" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.displayName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {PARTY_LABEL[r.party]}{r.companyName ? ` · ${r.companyName}` : ""}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0", KYC_STATUS[r.status].tone)}>{KYC_STATUS[r.status].label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.submitted_at ? `Envoyé le ${frDate(r.submitted_at)}` : "Pas encore envoyé"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        {selected ? (
          <DossierDetail key={selected.user_id} dossier={selected} onClose={() => select(null)} onChanged={load} />
        ) : selectedUserId ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun dossier ouvert pour ce compte (il s'ouvre à la création d'une mission).
          </CardContent></Card>
        ) : (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            Sélectionnez un dossier pour le vérifier.
          </CardContent></Card>
        )}
      </div>
    </div>
  );
};

interface DetailProps {
  dossier: DossierRow;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

const DossierDetail = ({ dossier, onClose, onChanged }: DetailProps) => {
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
          <span className="font-mono">{showIban ? value : maskIban(value)}</span>
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-lg">{dossier.displayName}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Dossier {PARTY_LABEL[dossier.party].toLowerCase()}{dossier.companyName ? ` · ${dossier.companyName}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className={KYC_STATUS[dossier.status].tone}>{KYC_STATUS[dossier.status].label}</Badge>
            {dossier.submitted_at && <span>Envoyé le {frDate(dossier.submitted_at)}</span>}
            {dossier.reviewed_at && <span>· Revu le {frDate(dossier.reviewed_at)}</span>}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le dossier">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
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
                <dd>{renderValue(f.key)}</dd>
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
                    <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => open(d)}>
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
      </CardContent>

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
    </Card>
  );
};

const ValidityTag = ({ ok, okLabel, koLabel }: { ok: boolean; okLabel: string; koLabel: string }) => (
  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", ok ? "text-[#17663F]" : "text-destructive")}>
    {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
    {ok ? okLabel : koLabel}
  </span>
);

export default AdminKycPanel;
