import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { MONTH_NAMES } from "@/lib/cra";
import { clientInvoiceState, eur, type ClientInvoice } from "@/lib/invoices";
import KycStatusPill from "./KycStatusPill";
import { useKycStatuses, useOpenDossier } from "./kycDossiers";
import { MISSION_STATUS } from "./missionStatus";
import { PennylanePill } from "./PennylaneInvoiceDialogs";
import NeedsList from "./needs/NeedsList";
import { useNeeds } from "./needs/useNeeds";
import { EMPTY_FILTERS, filterAndSortRows } from "./needs/needsModel";

/** Colonnes ajoutées par les migrations ADV, absentes des types générés. */
type ClientProfile = Tables<"client_profiles"> & {
  siret?: string | null;
  vat_number?: string | null;
  billing_email?: string | null;
};

type MissionRow = Pick<Tables<"missions">, "id" | "title" | "status" | "start_date" | "end_date" | "client_tjm" | "location">;

const InfoCard = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    <div className="mt-1 break-words text-sm font-medium">{children}</div>
  </div>
);

const Section = ({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) => (
  <section aria-labelledby={id} className="mt-8">
    <h3 id={id} className="mb-3 flex items-baseline gap-2 text-base font-semibold">
      {title}
      {count != null && <span className="font-mono text-xs font-normal text-muted-foreground">{count}</span>}
    </h3>
    {children}
  </section>
);

const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>
);

const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{children}</span>
);

const ROW_BUTTON =
  "flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

const shortDate = (d: string) =>
  new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const monthLabel = (m: number | null, y: number | null) => (m && y ? `${MONTH_NAMES[m - 1]} ${y}` : "—");
const muted = (text: string) => <span className="font-normal text-muted-foreground">{text}</span>;

interface Props {
  userId: string;
  onBack: () => void;
  onOpenChat: (userId: string, name: string) => void;
}

/** Fiche d'un client côté administration : coordonnées, dossier, besoins, missions et factures. */
const ClientDetail = ({ userId, onBack, onOpenChat }: Props) => {
  const navigate = useNavigate();
  const openDossier = useOpenDossier();
  const { statuses } = useKycStatuses();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const needsData = useNeeds({ clientUserId: userId });
  const needRows = useMemo(() => filterAndSortRows(needsData.rows, EMPTY_FILTERS), [needsData.rows]);
  const requestId = useRef(0);

  useEffect(() => {
    const current = ++requestId.current;
    setStatus("loading");
    (async () => {
      const [profileRes, needIdsRes, invoicesRes] = await Promise.all([
        supabase.from("client_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("client_needs").select("id").eq("user_id", userId),
        supabase
          .from("client_invoices" as never)
          .select("*")
          .eq("client_user_id" as never, userId as never)
          .order("created_at" as never, { ascending: false }),
      ]);
      const needIds = (needIdsRes.data ?? []).map((n) => n.id);
      const missionsRes = needIds.length
        ? await supabase
            .from("missions")
            .select("id, title, status, start_date, end_date, client_tjm, location")
            .in("need_id", needIds)
            .order("start_date", { ascending: false })
        : null;
      if (current !== requestId.current) return;
      if (profileRes.error) {
        setErrorMessage(profileRes.error.message);
        setStatus("error");
        return;
      }
      setProfile(profileRes.data as ClientProfile | null);
      setMissions(missionsRes?.data ?? []);
      // Table absente des types générés (ou migration non appliquée) : une erreur donne une liste vide.
      setInvoices(invoicesRes.error ? [] : ((invoicesRes.data ?? []) as unknown as ClientInvoice[]));
      setStatus(profileRes.data ? "ready" : "missing");
    })().catch((e: unknown) => {
      if (current !== requestId.current) return;
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setStatus("error");
    });
  }, [userId]);

  const backButton = (
    <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Clients
    </Button>
  );

  if (status === "loading") {
    return (
      <div>
        {backButton}
        <p className="py-8 text-center text-muted-foreground" role="status">Chargement du client…</p>
      </div>
    );
  }
  if (status !== "ready" || !profile) {
    return (
      <div>
        {backButton}
        <EmptyState>
          {status === "missing" ? "Ce client est introuvable. Son compte a peut-être été supprimé." : `Chargement impossible : ${errorMessage}`}
        </EmptyState>
      </div>
    );
  }

  const person = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  const kyc = statuses.get(userId);
  const billingEmail = profile.billing_email?.trim();

  return (
    <div className="min-w-0">
      {backButton}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold sm:text-2xl">{profile.company_name || person || "Client"}</h2>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {[person, profile.job_title].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5 self-start text-xs"
          onClick={() => onOpenChat(userId, person || profile.company_name)}
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Chat
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Contact">
          {person || muted("Non renseigné")}
          {profile.phone && <span className="block text-xs font-normal text-muted-foreground">{profile.phone}</span>}
        </InfoCard>
        <InfoCard label="Email / facturation">
          <a href={`mailto:${profile.email}`} className="break-all underline decoration-border underline-offset-4 hover:decoration-foreground">
            {profile.email}
          </a>
          {billingEmail && billingEmail !== profile.email && (
            <span className="block break-all text-xs font-normal text-muted-foreground">Factures : {billingEmail}</span>
          )}
        </InfoCard>
        <InfoCard label="SIREN / SIRET">
          {profile.siret || profile.siren || muted("Non renseigné")}
          {profile.legal_form && <span className="block text-xs font-normal text-muted-foreground">{profile.legal_form}</span>}
        </InfoCard>
        <InfoCard label="Adresse">{profile.company_address || muted("Non renseignée")}</InfoCard>
        <InfoCard label="Dossier KYC">
          {kyc ? (
            <KycStatusPill userId={userId} status={kyc} name={person || profile.company_name} />
          ) : (
            <button
              type="button"
              onClick={() => openDossier(userId)}
              className="rounded-sm text-left font-normal text-muted-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Pas encore ouvert
            </button>
          )}
        </InfoCard>
        <InfoCard label="Inscrit le">{shortDate(profile.created_at)}</InfoCard>
      </div>

      <Section id="client-needs-title" title="Besoins" count={needRows.length}>
        {needsData.loading ? (
          <p className="py-4 text-sm text-muted-foreground" role="status">Chargement des besoins…</p>
        ) : needRows.length === 0 ? (
          <EmptyState>Ce client n'a déposé aucun besoin.</EmptyState>
        ) : (
          <NeedsList rows={needRows} hideClient onOpen={(id) => navigate(`/dashboard?tab=needs&need=${id}`)} />
        )}
      </Section>

      <Section id="client-missions-title" title="Missions" count={missions.length}>
        {missions.length === 0 ? (
          <EmptyState>Aucune mission pour ce client.</EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {missions.map((m) => {
              const st = MISSION_STATUS[m.status];
              const period = `${shortDate(m.start_date)} → ${m.end_date ? shortDate(m.end_date) : "sans fin"}`;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={ROW_BUTTON}
                    onClick={() => navigate(`/dashboard?tab=missions&mission=${m.id}`)}
                    aria-label={`Mission ${m.title}, ${period}, ${st?.label ?? m.status}. Ouvrir la mission`}
                  >
                    <span className="min-w-[10rem] flex-1">
                      <span className="block break-words font-medium">{m.title}</span>
                      <span className="block text-xs text-muted-foreground">{period}</span>
                    </span>
                    <span className="text-sm">{eur(Number(m.client_tjm))} HT / jour</span>
                    <span className="flex items-center gap-2">
                      <Pill tone={st?.color ?? "bg-muted text-muted-foreground"}>{st?.label ?? m.status}</Pill>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section id="client-invoices-title" title="Factures" count={invoices.length}>
        {invoices.length === 0 ? (
          <EmptyState>Aucune facture pour ce client.</EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {invoices.map((inv) => {
              const st = clientInvoiceState(inv);
              const label = inv.number ?? (inv.kind === "credit_note" ? "Brouillon d'avoir" : "Brouillon");
              return (
                <li key={inv.id}>
                  <button
                    type="button"
                    className={ROW_BUTTON}
                    onClick={() => navigate(`/dashboard?tab=invoices&view=clients&invoice=${inv.id}`)}
                    aria-label={`Facture ${label}, ${monthLabel(inv.period_month, inv.period_year)}, ${eur(inv.total_ttc)} TTC, ${st.label}. Ouvrir dans l'onglet Factures`}
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
        )}
      </Section>
    </div>
  );
};

export default ClientDetail;
