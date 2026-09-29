import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronRight, Download, FileText, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import CraProgress from "@/components/platform/CraProgress";
import ExtendMissionDialog from "@/components/platform/ExtendMissionDialog";
import GenerateContractsDialog from "@/components/platform/GenerateContractsDialog";
import MissionOnboardingChecklist from "./MissionOnboardingChecklist";
import MissionEndDialog from "./MissionEndDialog";
import { PennylanePill } from "./PennylaneInvoiceDialogs";
import type { TimesheetRates } from "./TimesheetValidationSections";
import { CONTRACT_STATUS, PARTY_LABEL, frDate, openPrivateFile, type MissionContract } from "./adv";
import { KYC_CHANGED_EVENT, useOpenDossier } from "./kycDossiers";
import { MISSION_STATUS, setMissionStatus, type MissionEndAction } from "./missionStatus";
import { fetchCompanySettings } from "@/lib/companySettings";
import { ADMIN_TIMESHEET_STATUS, MONTH_NAMES, isValidatedTimesheet } from "@/lib/cra";
import {
  FREELANCE_INVOICE_STATUS, clientInvoiceState, eur, invoiceGap, type ClientInvoice, type FreelanceInvoice,
} from "@/lib/invoices";
import type { KycDossier, KycParty } from "@/lib/kyc";

type MissionRow = Tables<"missions">;

interface TimesheetRow {
  id: string;
  month: number;
  year: number;
  total_days: number;
  status: string;
  rejection_reason: string | null;
}

interface SignatureRow {
  timesheet_id: string;
  method: "otp_email" | "admin";
  signer_name: string;
  signed_at: string;
}

interface Detail {
  mission: MissionRow;
  freelanceName: string;
  freelanceUserId: string | null;
  clientUserId: string | null;
  needDescription: string | null;
  timesheets: TimesheetRow[];
  rates: Record<string, TimesheetRates>;
  signatures: Record<string, SignatureRow>;
  /** Frais HT par CRA : figés à la validation, sinon somme des notes de frais saisies. */
  expensesHt: Record<string, number>;
  clientInvoices: ClientInvoice[];
  freelanceInvoices: FreelanceInvoice[];
  contracts: MissionContract[];
  dossiers: Record<string, KycDossier>;
  yousignEnabled: boolean;
}

const none = Promise.resolve({ data: [] as unknown[] });

/** Filtre « rattaché à la mission » : par mission_id, ou par l'un de ses CRA (anciennes lignes sans mission_id). */
const missionOrTimesheets = (missionId: string, tsIds: string[]) =>
  tsIds.length ? `mission_id.eq.${missionId},timesheet_id.in.(${tsIds.join(",")})` : `mission_id.eq.${missionId}`;

async function loadMissionDetail(missionId: string): Promise<Detail | null> {
  const { data: mission, error } = await supabase.from("missions").select("*").eq("id", missionId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!mission) return null;

  const [profileRes, needRes, tsRes, contractRes, settings] = await Promise.all([
    supabase.from("recruiter_profiles").select("user_id, first_name, last_name").eq("id", mission.recruiter_profile_id).maybeSingle(),
    supabase.from("client_needs").select("user_id, description").eq("id", mission.need_id).maybeSingle(),
    supabase
      .from("timesheets")
      .select("id, month, year, total_days, status, rejection_reason")
      .eq("mission_id", missionId)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase.from("contracts" as never).select("*").eq("mission_id" as never, missionId as never),
    mission.status === "onboarding" ? fetchCompanySettings() : Promise.resolve(null),
  ]);

  const profile = profileRes.data;
  const freelanceUserId = profile?.user_id ?? null;
  const clientUserId = needRes.data?.user_id ?? null;
  const timesheets = (tsRes.data ?? []) as TimesheetRow[];
  const tsIds = timesheets.map((t) => t.id);
  const userIds = [clientUserId, freelanceUserId].filter((u): u is string => !!u);
  const linked = missionOrTimesheets(missionId, tsIds);

  // Tables absentes des types générés (ou migration non appliquée) : une erreur donne une liste vide.
  const [rateRes, sigRes, expenseRes, clientInvRes, freelanceInvRes, dossierRes] = await Promise.all([
    tsIds.length ? supabase.from("timesheet_rates" as never).select("*").in("timesheet_id" as never, tsIds as never) : none,
    tsIds.length
      ? supabase
          .from("timesheet_signatures" as never)
          .select("timesheet_id, method, signer_name, signed_at")
          .in("timesheet_id" as never, tsIds as never)
      : none,
    tsIds.length
      ? supabase.from("timesheet_expenses" as never).select("timesheet_id, amount_ht").in("timesheet_id" as never, tsIds as never)
      : none,
    supabase.from("client_invoices" as never).select("*").or(linked).order("created_at" as never, { ascending: false }),
    supabase.from("freelance_invoices" as never).select("*").or(linked).order("created_at" as never, { ascending: false }),
    userIds.length ? supabase.from("kyc_dossiers" as never).select("*").in("user_id" as never, userIds as never) : none,
  ]);

  const rates: Record<string, TimesheetRates> = {};
  ((rateRes.data ?? []) as unknown as TimesheetRates[]).forEach((r) => { rates[r.timesheet_id] = r; });
  const signatures: Record<string, SignatureRow> = {};
  ((sigRes.data ?? []) as unknown as SignatureRow[]).forEach((s) => { signatures[s.timesheet_id] = s; });
  const expensesHt: Record<string, number> = {};
  ((expenseRes.data ?? []) as unknown as { timesheet_id: string; amount_ht: number }[]).forEach((e) => {
    expensesHt[e.timesheet_id] = (expensesHt[e.timesheet_id] ?? 0) + Number(e.amount_ht);
  });
  Object.values(rates).forEach((r) => { expensesHt[r.timesheet_id] = Number(r.expenses_ht); });
  const dossiers: Record<string, KycDossier> = {};
  ((dossierRes.data ?? []) as unknown as KycDossier[]).forEach((d) => { dossiers[d.user_id] = d; });

  return {
    mission,
    freelanceName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Freelance inconnu",
    freelanceUserId,
    clientUserId,
    needDescription: needRes.data?.description?.trim() || null,
    timesheets,
    rates,
    signatures,
    expensesHt,
    clientInvoices: (clientInvRes.data ?? []) as unknown as ClientInvoice[],
    freelanceInvoices: (freelanceInvRes.data ?? []) as unknown as FreelanceInvoice[],
    contracts: (contractRes.data ?? []) as unknown as MissionContract[],
    dossiers,
    yousignEnabled: settings?.yousignEnabled ?? false,
  };
}

/** « 1 sept. 2026 » ; les dates AAAA-MM-JJ sont lues à midi pour éviter un décalage de fuseau. */
const shortDate = (d: string) =>
  new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const monthLabel = (m: number | null, y: number | null) => (m && y ? `${MONTH_NAMES[m - 1]} ${y}` : "—");
const days = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const SUCCESS_TONE = "bg-[#E6F4EC] text-[#17693D]";

const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{children}</span>
);

const InfoCard = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    <div className="mt-1 break-words text-sm font-medium">{children}</div>
  </div>
);

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section aria-labelledby={id} className="mt-8">
    <h3 id={id} className="mb-3 text-base font-semibold">{title}</h3>
    {children}
  </section>
);

const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>
);

const ROW_BUTTON =
  "flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

interface Props {
  missionId: string;
  /** Retour à la liste des missions (retire le paramètre d'URL). */
  onBack: () => void;
}

/** Détail d'une mission côté administration : conditions, CRA, factures et contrats. */
const MissionDetail = ({ missionId, onBack }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const openDossier = useOpenDossier();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [endAction, setEndAction] = useState<MissionEndAction | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [contractsOpen, setContractsOpen] = useState(false);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const current = ++requestId.current;
    try {
      const d = await loadMissionDetail(missionId);
      if (current !== requestId.current) return;
      setDetail(d);
      setStatus(d ? "ready" : "missing");
    } catch (e) {
      if (current !== requestId.current) return;
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [missionId]);

  useEffect(() => {
    setStatus("loading");
    setDetail(null);
    reload();
  }, [reload]);

  // Un dossier validé ou refusé depuis le panneau latéral met la checklist à jour
  useEffect(() => {
    const onKycChanged = () => { reload(); };
    window.addEventListener(KYC_CHANGED_EVENT, onKycChanged);
    return () => window.removeEventListener(KYC_CHANGED_EVENT, onKycChanged);
  }, [reload]);

  const backButton = (
    <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Missions
    </Button>
  );

  if (status === "loading") {
    return (
      <div>
        {backButton}
        <p className="py-8 text-center text-muted-foreground" role="status">Chargement de la mission…</p>
      </div>
    );
  }
  if (status !== "ready" || !detail) {
    return (
      <div>
        {backButton}
        <EmptyState>
          {status === "missing" ? "Cette mission est introuvable. Elle a peut-être été supprimée." : `Chargement impossible : ${errorMessage}`}
        </EmptyState>
      </div>
    );
  }

  const { mission, timesheets, rates, signatures, expensesHt, clientInvoices, freelanceInvoices, contracts } = detail;
  const clientTjm = Number(mission.client_tjm);
  const freelanceTjm = Number(mission.recruiter_tjm);
  const statusInfo = MISSION_STATUS[mission.status];
  const dialogMission = { ...mission, recruiter_name: detail.freelanceName };

  // Synthèse : montants figés à la validation, sinon TJM de la mission × jours validés.
  const validated = timesheets.filter((t) => isValidatedTimesheet(t.status));
  const validatedDays = validated.reduce((s, t) => s + Number(rates[t.id]?.total_days ?? t.total_days), 0);
  const billed = validated.reduce((s, t) => s + (rates[t.id] ? Number(rates[t.id].client_amount) : Number(t.total_days) * clientTjm), 0);
  const cost = validated.reduce((s, t) => s + (rates[t.id] ? Number(rates[t.id].freelance_amount) : Number(t.total_days) * freelanceTjm), 0);

  const confirmEnd = async (action: MissionEndAction) => {
    setEndAction(null);
    const err = await setMissionStatus(mission.id, action);
    if (err) {
      toast({ title: "Erreur", description: err, variant: "destructive" });
      return;
    }
    toast({ title: "Statut mis à jour" });
    reload();
  };

  const openFile = async (path: string) => {
    const err = await openPrivateFile("contracts", path);
    if (err) toast({ title: "Ouverture impossible", description: err, variant: "destructive" });
  };

  const personLink = (userId: string | null, name: string, kind: "client" | "freelance") =>
    userId ? (
      <button
        type="button"
        onClick={() => openDossier(userId)}
        aria-label={`Voir le dossier ${kind === "client" ? "du client" : "du freelance"} ${name}`}
        className="rounded-sm text-left underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {name}
      </button>
    ) : (
      name
    );

  const renderContract = (party: KycParty) => {
    const c = contracts.find((x) => x.party === party) ?? null;
    return (
      <li key={party} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Contrat {PARTY_LABEL[party].toLowerCase()}</span>
          {c ? (
            <Pill tone={CONTRACT_STATUS[c.status].tone}>{CONTRACT_STATUS[c.status].label}</Pill>
          ) : (
            <Badge variant="secondary">À générer</Badge>
          )}
          {c?.status === "sent" && c.sent_at && <span className="text-xs text-muted-foreground">envoyé le {frDate(c.sent_at)}</span>}
          {c?.status === "signed" && c.signed_at && <span className="text-xs text-muted-foreground">signé le {frDate(c.signed_at)}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {c?.document_path && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openFile(c.document_path as string)}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Télécharger
            </Button>
          )}
          {c?.signed_document_path && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openFile(c.signed_document_path as string)}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Version signée
            </Button>
          )}
        </div>
      </li>
    );
  };

  const canGenerate = mission.status === "onboarding" || mission.status === "active";

  return (
    <div className="min-w-0">
      {backButton}

      {/* En-tête : titre, description du besoin, actions selon le statut */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold sm:text-2xl">{mission.title}</h2>
          <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-sm text-muted-foreground">
            {detail.needDescription ?? [mission.company_name, mission.location].filter(Boolean).join(" · ")}
          </p>
          {mission.need_id && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard?tab=needs&need=${mission.need_id}`)}
              className="mt-1 inline-flex items-center gap-0.5 rounded-sm text-xs font-medium underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Voir le besoin d'origine <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canGenerate && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setContractsOpen(true)}>
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              {mission.status === "onboarding" ? "Générer les contrats" : "Contrats"}
            </Button>
          )}
          {mission.status === "active" && (
            <>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setExtendOpen(true)}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Prolonger
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setEndAction("completed")}>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Terminer
              </Button>
            </>
          )}
          {canGenerate && (
            <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={() => setEndAction("cancelled")}>
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Conditions de la mission */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <InfoCard label="Client">{personLink(detail.clientUserId, mission.company_name || "Client", "client")}</InfoCard>
        <InfoCard label="Freelance">{personLink(detail.freelanceUserId, detail.freelanceName, "freelance")}</InfoCard>
        <InfoCard label="TJ facturé client">{eur(clientTjm)} HT / jour</InfoCard>
        <InfoCard label="TJ payé freelance">
          {eur(freelanceTjm)} HT / jour
          <span className="block text-xs font-normal text-muted-foreground">marge {eur(clientTjm - freelanceTjm)}</span>
        </InfoCard>
        <InfoCard label="Frais">Autorisés, refacturés au réel</InfoCard>
        <InfoCard label="Période">
          {shortDate(mission.start_date)} → {mission.end_date ? shortDate(mission.end_date) : "sans fin"}
        </InfoCard>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge className={statusInfo?.color ?? ""}>{statusInfo?.label ?? mission.status}</Badge>
        <span className="text-sm text-muted-foreground">
          {days(validatedDays)} jour(s) validé(s) · facturé {eur(billed)} · coût {eur(cost)} · marge {eur(billed - cost)}
        </span>
      </div>

      {mission.status === "onboarding" && (
        <MissionOnboardingChecklist
          mission={{ id: mission.id, title: mission.title, client_user_id: detail.clientUserId, freelance_user_id: detail.freelanceUserId }}
          dossiers={detail.dossiers}
          contracts={contracts}
          yousignEnabled={detail.yousignEnabled}
          onGenerate={() => setContractsOpen(true)}
          onChanged={reload}
        />
      )}

      {/* Comptes rendus d'activité */}
      <Section id="mission-cra-title" title="Comptes rendus d'activité">
        {timesheets.length === 0 ? (
          <EmptyState>
            {mission.status === "onboarding"
              ? "Les CRA s'ouvriront au démarrage de la mission."
              : "Aucun CRA pour cette mission."}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {timesheets.map((t) => {
              const st = ADMIN_TIMESHEET_STATUS[t.status];
              const sig = signatures[t.id];
              const exp = expensesHt[t.id] ?? 0;
              const label = monthLabel(t.month, t.year);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={ROW_BUTTON}
                    onClick={() => navigate(`/dashboard?tab=timesheets&ts=${t.id}`)}
                    aria-label={`CRA de ${label}, ${days(Number(t.total_days))} jour(s), ${st?.label ?? t.status}. Ouvrir dans l'onglet CRA`}
                  >
                    <span className="min-w-[7.5rem] flex-1">
                      <span className="block font-medium">{label}</span>
                      {t.status === "client_rejected" && t.rejection_reason && (
                        <span className="block text-xs text-muted-foreground">Motif : {t.rejection_reason}</span>
                      )}
                    </span>
                    <CraProgress status={t.status} />
                    <span className="font-mono text-sm">
                      {days(Number(t.total_days))} j{exp > 0 ? ` · frais ${eur(exp)} HT` : ""}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {sig && (
                        <Pill tone={SUCCESS_TONE}>
                          {sig.method === "admin" ? "Validé par Kistone" : "Signé"}
                        </Pill>
                      )}
                      <Pill tone={st?.color ?? "bg-muted text-muted-foreground"}>{st?.label ?? t.status}</Pill>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Factures client et freelance */}
      <Section id="mission-invoices-title" title="Factures">
        {clientInvoices.length === 0 && freelanceInvoices.length === 0 ? (
          <EmptyState>Aucune facture pour cette mission.</EmptyState>
        ) : (
          <div className="space-y-4">
            {clientInvoices.length > 0 && (
              <div>
                <h4 className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Client</h4>
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {clientInvoices.map((inv) => {
                    const st = clientInvoiceState(inv);
                    const label = inv.number ?? (inv.kind === "credit_note" ? "Brouillon d'avoir" : "Brouillon");
                    return (
                      <li key={inv.id}>
                        <button
                          type="button"
                          className={ROW_BUTTON}
                          onClick={() => navigate(`/dashboard?tab=invoices&view=clients&invoice=${inv.id}`)}
                          aria-label={`Facture client ${label}, ${monthLabel(inv.period_month, inv.period_year)}, ${eur(inv.total_ttc)} TTC, ${st.label}. Ouvrir dans l'onglet Factures`}
                        >
                          <span className="min-w-[7.5rem] flex-1">
                            <span className={inv.number ? "block font-medium" : "block italic text-muted-foreground"}>{label}</span>
                            <span className="block text-xs text-muted-foreground">{monthLabel(inv.period_month, inv.period_year)}</span>
                          </span>
                          {inv.source === "pennylane" && <PennylanePill />}
                          <span className="text-sm font-medium">{eur(inv.total_ttc)} TTC</span>
                          <span className="flex items-center gap-2">
                            <Pill tone={st.tone}>{st.label}</Pill>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {freelanceInvoices.length > 0 && (
              <div>
                <h4 className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Freelance</h4>
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {freelanceInvoices.map((inv) => {
                    const st = FREELANCE_INVOICE_STATUS[inv.status];
                    const gap = invoiceGap(inv);
                    return (
                      <li key={inv.id}>
                        <button
                          type="button"
                          className={ROW_BUTTON}
                          onClick={() => navigate("/dashboard?tab=invoices&view=freelances")}
                          aria-label={`Facture freelance ${inv.invoice_number}, ${eur(inv.amount_ht)} HT, ${st?.label ?? inv.status}. Ouvrir dans l'onglet Factures`}
                        >
                          <span className="min-w-[7.5rem] flex-1">
                            <span className="block font-medium">{inv.invoice_number}</span>
                            <span className="block text-xs text-muted-foreground">du {frDate(inv.invoice_date)}</span>
                          </span>
                          <span className="text-sm">
                            <span className="font-medium">{eur(inv.amount_ht)} HT</span>
                            {inv.expected_ht != null && (
                              <span className={`block text-xs ${gap !== 0 ? "text-[#B3134A]" : "text-muted-foreground"}`}>
                                attendu {eur(inv.expected_ht)}{gap !== 0 ? ` (écart ${gap > 0 ? "+" : ""}${eur(gap)})` : ""}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-2">
                            <Pill tone={st?.tone ?? "bg-muted text-muted-foreground"}>{st?.label ?? inv.status}</Pill>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Contrats */}
      <Section id="mission-contracts-title" title="Contrats">
        {contracts.length === 0 ? (
          <EmptyState>
            <p>Aucun contrat généré pour cette mission.</p>
            {canGenerate && (
              <Button size="sm" variant="outline" className="mt-3 gap-1 text-xs" onClick={() => setContractsOpen(true)}>
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Générer les contrats
              </Button>
            )}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card text-sm">
            {renderContract("client")}
            {renderContract("freelance")}
          </ul>
        )}
      </Section>

      <MissionEndDialog action={endAction} onCancel={() => setEndAction(null)} onConfirm={confirmEnd} />

      {extendOpen && (
        <ExtendMissionDialog open={extendOpen} onClose={() => setExtendOpen(false)} mission={dialogMission} onExtended={reload} />
      )}

      {contractsOpen && (
        <GenerateContractsDialog open={contractsOpen} onClose={() => setContractsOpen(false)} mission={dialogMission} onSaved={reload} />
      )}
    </div>
  );
};

export default MissionDetail;
