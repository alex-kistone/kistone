import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Download, FilePlus2, FileText, Receipt, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clientInvoiceState, eur, FREELANCE_INVOICE_STATUS, invoiceGap, type ClientInvoice, type FreelanceInvoice } from "@/lib/invoices";
import { frDate } from "@/components/platform/admin/adv";
import type { TimesheetRates } from "@/components/platform/admin/TimesheetValidationSections";
import { ClientInvoiceDetail } from "@/components/platform/admin/ClientInvoiceDetail";
import { FreelanceInvoicesAdmin, type EmailInvoiceCandidate, type FreelanceInvoiceRow } from "@/components/platform/admin/FreelanceInvoicesAdmin";
import { PennylanePill } from "@/components/platform/admin/PennylaneInvoiceDialogs";
import { InvoiceSettingsDialog } from "@/components/platform/admin/InvoiceSettingsDialog";
import { fetchInvoicingSettings, invoicingIncomplete, invoicingModeOf, type InvoicingSettings } from "@/components/platform/admin/invoicingSettings";

/**
 * Facturation (admin) : CRA à facturer, factures client (brouillon → émission → paiement / avoir),
 * factures freelance (vérification, paiement) et export comptable mensuel.
 * Les tables de la phase 3 ne sont pas dans les types générés.
 */

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const monthLabel = (m: number | null, y: number | null) => (m && y ? `${MONTH_NAMES[m - 1]} ${y}` : "—");

interface TimesheetRow {
  id: string;
  month: number;
  year: number;
  total_days: number;
  status: string;
  mission_id: string | null;
  need_id: string;
  recruiter_profile_id: string;
}
interface MissionRow { id: string; title: string; company_name: string }
interface ProfileRow { id: string; user_id: string | null; first_name: string; last_name: string }
interface ClientProfileRow { user_id: string; company_name: string; siren: string | null }
interface NeedRow { id: string; company_name: string | null; job_title: string | null }

interface Data {
  clientInvoices: ClientInvoice[];
  freelanceInvoices: FreelanceInvoice[];
  timesheets: TimesheetRow[];
  rates: Record<string, TimesheetRates>;
  missions: Record<string, MissionRow>;
  profiles: Record<string, ProfileRow>;
  profilesByUser: Record<string, ProfileRow>;
  clients: Record<string, ClientProfileRow>;
  needs: Record<string, NeedRow>;
}

const EMPTY: Data = {
  clientInvoices: [], freelanceInvoices: [], timesheets: [], rates: {},
  missions: {}, profiles: {}, profilesByUser: {}, clients: {}, needs: {},
};

const byKey = <T,>(rows: T[] | null | undefined, key: keyof T) =>
  Object.fromEntries((rows ?? []).map((r) => [String(r[key]), r])) as Record<string, T>;
const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))];

async function loadData(): Promise<Data> {
  const [{ data: ci }, { data: fi }, { data: ts }, { data: rt }] = await Promise.all([
    supabase.from("client_invoices" as never).select("*").order("created_at", { ascending: false }),
    supabase.from("freelance_invoices" as never).select("*").order("created_at", { ascending: false }),
    supabase
      .from("timesheets" as never)
      .select("id, month, year, total_days, status, mission_id, need_id, recruiter_profile_id")
      .in("status", ["client_approved", "admin_invoiced"])
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase.from("timesheet_rates" as never).select("*"),
  ]);
  const clientInvoices = (ci as ClientInvoice[] | null) ?? [];
  const freelanceInvoices = (fi as FreelanceInvoice[] | null) ?? [];
  const timesheets = (ts as TimesheetRow[] | null) ?? [];

  const missionIds = uniq([...timesheets.map((t) => t.mission_id), ...clientInvoices.map((i) => i.mission_id), ...freelanceInvoices.map((i) => i.mission_id)]);
  const profileIds = uniq(timesheets.map((t) => t.recruiter_profile_id));
  const freelanceUserIds = uniq(freelanceInvoices.map((i) => i.freelance_user_id));
  const clientUserIds = uniq(clientInvoices.map((i) => i.client_user_id));
  const needIds = uniq(timesheets.map((t) => t.need_id));

  const none = Promise.resolve({ data: [] as never[] });
  const [{ data: ms }, { data: ps }, { data: pu }, { data: cp }, { data: nd }] = await Promise.all([
    missionIds.length ? supabase.from("missions").select("id, title, company_name").in("id", missionIds) : none,
    profileIds.length ? supabase.from("recruiter_profiles").select("id, user_id, first_name, last_name").in("id", profileIds) : none,
    freelanceUserIds.length ? supabase.from("recruiter_profiles").select("id, user_id, first_name, last_name").in("user_id", freelanceUserIds) : none,
    clientUserIds.length ? supabase.from("client_profiles").select("user_id, company_name, siren").in("user_id", clientUserIds) : none,
    needIds.length ? supabase.from("client_needs" as never).select("id, company_name, job_title").in("id", needIds) : none,
  ]);

  const allProfiles = [...((ps as ProfileRow[] | null) ?? []), ...((pu as ProfileRow[] | null) ?? [])];
  return {
    clientInvoices,
    freelanceInvoices,
    timesheets,
    rates: byKey((rt as TimesheetRates[] | null) ?? [], "timesheet_id"),
    missions: byKey((ms as MissionRow[] | null) ?? [], "id"),
    profiles: byKey(allProfiles, "id"),
    profilesByUser: byKey(allProfiles.filter((p) => p.user_id), "user_id"),
    clients: byKey((cp as ClientProfileRow[] | null) ?? [], "user_id"),
    needs: byKey((nd as NeedRow[] | null) ?? [], "id"),
  };
}

// ── Export CSV (UTF-8 avec BOM, séparateur « ; », décimales à la française) ──
const csvNum = (n: number | null | undefined) => (n == null ? "" : Number(n).toFixed(2).replace(".", ","));
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
const inMonth = (iso: string | null, m: number, y: number) => {
  if (!iso) return false;
  const [yy, mm] = iso.split("-").map(Number);
  return yy === y && mm === m;
};

type View = "to_invoice" | "clients" | "freelances" | "export";
const VIEWS: { key: View; label: string }[] = [
  { key: "to_invoice", label: "À facturer" },
  { key: "clients", label: "Clients" },
  { key: "freelances", label: "Freelances" },
  { key: "export", label: "Export comptable" },
];

type ClientFilter = "all" | "draft" | "due" | "overdue" | "paid" | "cancelled";
const CLIENT_FILTERS: { key: ClientFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "draft", label: "Brouillons" },
  { key: "due", label: "À régler" },
  { key: "overdue", label: "En retard" },
  { key: "paid", label: "Payées" },
  { key: "cancelled", label: "Annulées & avoirs" },
];
const matchesFilter = (inv: ClientInvoice, f: ClientFilter) => {
  const key = clientInvoiceState(inv).key;
  switch (f) {
    case "all": return true;
    case "due": return key === "issued" || key === "overdue";
    case "cancelled": return key === "cancelled" || key === "credit_note";
    default: return key === f;
  }
};

const Cell = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <span className={`block min-w-0 ${className}`}>
    <span className="block text-xs text-muted-foreground md:sr-only">{label}</span>
    <span className="block break-words text-sm">{children}</span>
  </span>
);

const profileName = (p?: ProfileRow) => (p ? `${p.first_name} ${p.last_name}`.trim() : "");

const AdminInvoicesPanel = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view") as View | null;
  const view: View = VIEWS.some((v) => v.key === viewParam) ? (viewParam as View) : "to_invoice";

  const [data, setData] = useState<Data>(EMPTY);
  const [settings, setSettings] = useState<InvoicingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preparing, setPreparing] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<ClientFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = new Date();
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportYear, setExportYear] = useState(now.getFullYear());

  const reload = useCallback(async () => {
    const [d, s] = await Promise.all([loadData(), fetchInvoicingSettings()]);
    setData(d);
    setSettings(s);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Lien profond ?invoice=<id> (depuis le détail d'une mission) : ouvre cette facture client.
  const invoiceParam = searchParams.get("invoice");
  useEffect(() => {
    if (!invoiceParam) return;
    setSelectedId(invoiceParam);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("invoice");
      return next;
    }, { replace: true });
  }, [invoiceParam, setSearchParams]);

  const setView = (v: View) => {
    setSelectedId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view", v);
      return next;
    }, { replace: true });
  };

  // ── Libellés dérivés ──
  const clientNameOf = useCallback((inv: ClientInvoice) =>
    (inv.buyer?.company_name as string | undefined)
      || data.clients[inv.client_user_id]?.company_name
      || (inv.mission_id ? data.missions[inv.mission_id]?.company_name : undefined)
      || "Client", [data]);
  const clientSirenOf = (inv: ClientInvoice) => (inv.buyer?.siren as string | undefined) || data.clients[inv.client_user_id]?.siren || "";

  const liveInvoiceTs = useMemo(
    () => new Set(data.clientInvoices.filter((i) => i.kind === "invoice" && i.status !== "cancelled" && i.timesheet_id).map((i) => i.timesheet_id as string)),
    [data.clientInvoices],
  );
  const toInvoice = useMemo(
    () => data.timesheets.filter((t) => t.status === "client_approved" && !liveInvoiceTs.has(t.id)),
    [data.timesheets, liveInvoiceTs],
  );

  const tsById = useMemo(() => Object.fromEntries(data.timesheets.map((t) => [t.id, t])), [data.timesheets]);
  const freelanceRows: FreelanceInvoiceRow[] = useMemo(() => data.freelanceInvoices.map((fi) => {
    const ts = tsById[fi.timesheet_id];
    const profile = (ts && data.profiles[ts.recruiter_profile_id]) || data.profilesByUser[fi.freelance_user_id];
    const missionId = fi.mission_id ?? ts?.mission_id ?? null;
    return {
      ...fi,
      freelance_name: profileName(profile) || "Freelance",
      mission_title: (missionId && data.missions[missionId]?.title) || "Mission",
      cra_label: ts ? monthLabel(ts.month, ts.year) : "—",
    };
  }), [data, tsById]);

  const numberById = useMemo(() => Object.fromEntries(data.clientInvoices.map((i) => [i.id, i.number])), [data.clientInvoices]);
  const clientList = data.clientInvoices.filter((i) => matchesFilter(i, clientFilter));
  const selected = selectedId ? data.clientInvoices.find((i) => i.id === selectedId) ?? null : null;
  const mode = invoicingModeOf(settings);
  // En mode Pennylane, l'identité de Kistone vit dans Pennylane : pas de blocage ici.
  const incomplete = mode === "platform" && invoicingIncomplete(settings);

  // CRA validés sans facture freelance : dépôt par l'admin d'une facture reçue par mail.
  const emailCandidates: EmailInvoiceCandidate[] = useMemo(() => {
    const invoiced = new Set(data.freelanceInvoices.map((i) => i.timesheet_id));
    return data.timesheets.flatMap((t) => {
      const p = data.profiles[t.recruiter_profile_id];
      if (invoiced.has(t.id) || !p?.user_id) return [];
      const r = data.rates[t.id];
      const m = t.mission_id ? data.missions[t.mission_id] : undefined;
      return [{
        timesheet_id: t.id,
        freelance_user_id: p.user_id,
        mission_id: t.mission_id,
        freelance_name: profileName(p) || "Freelance",
        mission_title: m?.title ?? data.needs[t.need_id]?.job_title ?? "Mission",
        month_label: monthLabel(t.month, t.year),
        expected_ht: r ? Number(r.freelance_amount) + Number(r.expenses_ht) : null,
      }];
    });
  }, [data]);

  // ── Actions « À facturer » ──
  const prepare = async (tsId: string) => {
    const { error } = await supabase.rpc("create_invoice_draft" as never, { _timesheet_id: tsId } as never);
    if (error) throw new Error(error.message);
  };
  const prepareOne = async (t: TimesheetRow) => {
    setPreparing(t.id);
    try {
      await prepare(t.id);
      toast({ title: "Brouillon créé", description: mode === "pennylane" ? "À reporter dans Pennylane depuis l'onglet Clients." : "À vérifier puis émettre depuis l'onglet Clients." });
    } catch (e) {
      toast({ title: "Préparation impossible", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
    setPreparing(null);
    await reload();
  };
  const prepareAll = async () => {
    setPreparing("all");
    let ok = 0;
    const failures: string[] = [];
    for (const t of toInvoice) {
      try { await prepare(t.id); ok++; } catch (e) { failures.push(e instanceof Error ? e.message : String(e)); }
    }
    setPreparing(null);
    toast({
      title: `${ok} brouillon${ok > 1 ? "s" : ""} créé${ok > 1 ? "s" : ""}`,
      description: failures.length ? `${failures.length} échec(s) : ${[...new Set(failures)].join(" ; ")}` : "À vérifier puis émettre depuis l'onglet Clients.",
      variant: failures.length && !ok ? "destructive" : "default",
    });
    await reload();
  };

  // ── Exports ──
  const exportClients = () => {
    const rows = data.clientInvoices
      .filter((i) => i.number && inMonth(i.issue_date, exportMonth, exportYear))
      .sort((a, b) => (a.number ?? "").localeCompare(b.number ?? ""))
      .map((i) => [
        i.number ?? "",
        i.kind === "credit_note" ? "Avoir" : "Facture",
        frDate(i.issue_date),
        i.due_date ? frDate(i.due_date) : "",
        clientNameOf(i),
        clientSirenOf(i),
        csvNum(i.total_ht),
        csvNum(i.total_vat),
        csvNum(i.total_ttc),
        clientInvoiceState(i).label,
        i.paid_at ? frDate(i.paid_at) : "",
      ]);
    if (!rows.length) { toast({ title: "Aucune facture émise ce mois-ci" }); return; }
    downloadCsv(
      `Factures_clients_${exportYear}-${String(exportMonth).padStart(2, "0")}.csv`,
      ["Numéro", "Type", "Date", "Échéance", "Client", "SIREN client", "HT", "TVA", "TTC", "Statut", "Payée le"],
      rows,
    );
  };
  const exportFreelances = () => {
    const rows = freelanceRows
      .filter((i) => inMonth(i.invoice_date, exportMonth, exportYear))
      .sort((a, b) => a.invoice_date.localeCompare(b.invoice_date))
      .map((i) => [
        i.freelance_name,
        i.invoice_number,
        frDate(i.invoice_date),
        csvNum(i.amount_ht),
        csvNum(i.vat_amount),
        csvNum(i.amount_ttc),
        csvNum(i.expected_ht),
        csvNum(invoiceGap(i)),
        FREELANCE_INVOICE_STATUS[i.status].label,
        i.paid_at ? frDate(i.paid_at) : "",
      ]);
    if (!rows.length) { toast({ title: "Aucune facture freelance datée de ce mois-ci" }); return; }
    downloadCsv(
      `Factures_freelances_${exportYear}-${String(exportMonth).padStart(2, "0")}.csv`,
      ["Freelance", "Numéro", "Date", "HT", "TVA", "TTC", "Attendu HT", "Écart", "Statut", "Payée le"],
      rows,
    );
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement des factures…</div>;

  const exportYears = uniq([String(now.getFullYear()), ...data.clientInvoices.map((i) => i.issue_date?.slice(0, 4)), ...data.freelanceInvoices.map((i) => i.invoice_date.slice(0, 4))])
    .map(Number)
    .sort((a, b) => b - a);
  const counts = {
    to_invoice: toInvoice.length,
    clients: data.clientInvoices.filter((i) => i.status === "draft").length,
    freelances: data.freelanceInvoices.filter((i) => i.status === "submitted").length,
  };

  return (
    <div className="min-w-0">
      {incomplete && (
        <div role="alert" className="mb-4 flex flex-col gap-3 rounded-xl border border-[#F5C27A] bg-[#FFF7EB] p-4 text-[#7A4B00] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <span className="font-semibold">Complétez l'identité de Kistone pour émettre des factures</span>
              <span className="block text-xs">SIREN, adresse du siège et IBAN sont obligatoires sur chaque facture.</span>
            </span>
          </p>
          <Button size="sm" variant="outline" className="shrink-0 bg-card" onClick={() => setSettingsOpen(true)}>Compléter</Button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1" role="group" aria-label="Sections de la facturation">
          {VIEWS.map((v) => {
            const n = counts[v.key as keyof typeof counts];
            return (
              <button
                key={v.key}
                aria-pressed={view === v.key}
                onClick={() => setView(v.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {v.label}
                {n ? <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">{n}</span> : null}
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" className="w-fit gap-1.5" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="h-3.5 w-3.5" /> Paramètres
        </Button>
      </div>

      {view === "to_invoice" && (
        <section aria-label="CRA à facturer">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">CRA validés par le client, sans facture en cours. Le brouillon reprend les taux figés à la validation.</p>
            {toInvoice.length > 1 && (
              <Button size="sm" className="w-fit gap-1.5" onClick={prepareAll} disabled={preparing !== null}>
                <FilePlus2 className="h-3.5 w-3.5" /> {preparing === "all" ? "Préparation…" : `Tout préparer (${toInvoice.length})`}
              </Button>
            )}
          </div>
          {toInvoice.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <Receipt className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun CRA en attente de facturation.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card">
              <div aria-hidden="true" className="hidden gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1.3fr_1.3fr_0.8fr_0.5fr_0.8fr_auto]">
                <span>Freelance</span><span>Mission · client</span><span>Mois</span><span className="text-right">Jours</span><span className="text-right">Montant HT</span><span className="w-[170px]" />
              </div>
              <ul className="divide-y divide-border">
                {toInvoice.map((t) => {
                  const m = t.mission_id ? data.missions[t.mission_id] : undefined;
                  const r = data.rates[t.id];
                  const freelance = profileName(data.profiles[t.recruiter_profile_id]) || "Freelance";
                  return (
                    <li key={t.id} className="grid grid-cols-2 gap-3 p-4 md:grid-cols-[1.3fr_1.3fr_0.8fr_0.5fr_0.8fr_auto] md:items-center">
                      <Cell label="Freelance" className="col-span-2 md:col-span-1"><span className="font-semibold">{freelance}</span></Cell>
                      <Cell label="Mission · client" className="col-span-2 md:col-span-1">
                        {m?.title ?? data.needs[t.need_id]?.job_title ?? "Mission"}
                        <span className="block text-xs text-muted-foreground">{m?.company_name ?? data.needs[t.need_id]?.company_name ?? "—"}</span>
                      </Cell>
                      <Cell label="Mois">{monthLabel(t.month, t.year)}</Cell>
                      <Cell label="Jours" className="md:text-right">{Number(r?.total_days ?? t.total_days).toLocaleString("fr-FR")} j</Cell>
                      <Cell label="Montant HT" className="md:text-right">
                        <span className="font-medium">{r ? eur(Number(r.client_amount) + Number(r.expenses_ht)) : "—"}</span>
                        {r && Number(r.expenses_ht) > 0 && <span className="block text-xs text-muted-foreground">dont frais {eur(r.expenses_ht)}</span>}
                        {!r && <span className="block text-xs text-destructive">Taux non figés</span>}
                      </Cell>
                      <div className="col-span-2 md:col-span-1 md:w-[170px] md:text-right">
                        <Button
                          size="sm"
                          className="w-full gap-1.5 md:w-auto"
                          disabled={preparing !== null || !r}
                          onClick={() => prepareOne(t)}
                          aria-label={`Préparer la facture de ${freelance}, ${monthLabel(t.month, t.year)}`}
                        >
                          <FilePlus2 className="h-3.5 w-3.5" /> {preparing === t.id ? "Préparation…" : "Préparer la facture"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      {view === "clients" && selected && (
        <ClientInvoiceDetail
          invoice={selected}
          clientName={clientNameOf(selected)}
          missionTitle={selected.mission_id ? data.missions[selected.mission_id]?.title ?? null : null}
          originalNumber={selected.credit_note_of ? numberById[selected.credit_note_of] ?? null : null}
          settingsIncomplete={incomplete}
          mode={mode}
          paymentTermsDays={settings?.client_payment_terms_days ?? 30}
          onBack={() => setSelectedId(null)}
          onChanged={reload}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {view === "clients" && !selected && (
        <section aria-label="Factures client">
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer les factures client">
            {CLIENT_FILTERS.map((f) => {
              const n = data.clientInvoices.filter((i) => matchesFilter(i, f.key)).length;
              return (
                <Button key={f.key} size="sm" variant={clientFilter === f.key ? "default" : "outline"} aria-pressed={clientFilter === f.key} onClick={() => setClientFilter(f.key)}>
                  {f.label}{n ? ` (${n})` : ""}
                </Button>
              );
            })}
          </div>
          {clientList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune facture{clientFilter === "all" ? " pour l'instant" : " dans cette catégorie"}.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card">
              <div aria-hidden="true" className="hidden gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_1.4fr_0.9fr_0.9fr_0.8fr_0.8fr_auto]">
                <span>Numéro</span><span>Client</span><span>Période</span><span className="text-right">Total TTC</span><span>Émise le</span><span>Échéance</span><span className="w-[96px] text-right">Statut</span>
              </div>
              <ul className="divide-y divide-border">
                {clientList.map((inv) => {
                  const st = clientInvoiceState(inv);
                  const label = inv.number ?? (inv.kind === "credit_note" ? "Brouillon d'avoir" : "Brouillon");
                  return (
                    <li key={inv.id}>
                      <button
                        onClick={() => setSelectedId(inv.id)}
                        aria-label={`${label}, ${clientNameOf(inv)}, ${eur(inv.total_ttc)} TTC, ${st.label}`}
                        className="grid w-full grid-cols-2 gap-3 p-4 text-left transition-colors hover:bg-accent/5 md:grid-cols-[1fr_1.4fr_0.9fr_0.9fr_0.8fr_0.8fr_auto] md:items-center"
                      >
                        <Cell label="Numéro">
                          <span className={inv.number ? "font-semibold" : "italic text-muted-foreground"}>{label}</span>
                          {inv.source === "pennylane" && <span className="mt-1 block"><PennylanePill /></span>}
                        </Cell>
                        <span className="flex justify-end md:hidden">
                          <span className={`h-fit rounded-full px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                        </span>
                        <Cell label="Client" className="col-span-2 md:col-span-1">{clientNameOf(inv)}</Cell>
                        <Cell label="Période">{monthLabel(inv.period_month, inv.period_year)}</Cell>
                        <Cell label="Total TTC" className="md:text-right"><span className="font-medium">{eur(inv.total_ttc)}</span></Cell>
                        <Cell label="Émise le">{frDate(inv.issue_date)}</Cell>
                        <Cell label="Échéance">{frDate(inv.due_date)}</Cell>
                        <span className="hidden w-[96px] justify-end md:flex">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      {view === "freelances" && (
        <FreelanceInvoicesAdmin
          rows={freelanceRows}
          candidates={emailCandidates}
          freelancePaymentTermsDays={settings?.freelance_payment_terms_days ?? 30}
          onChanged={reload}
        />
      )}

      {view === "export" && (
        <section aria-labelledby="export-title" className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 id="export-title" className="text-base font-semibold">Export comptable</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fichiers CSV (séparateur « ; », UTF-8) à transmettre au cabinet comptable : factures et avoirs émis dans le mois,
            factures freelance datées du mois.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select value={String(exportMonth)} onValueChange={(v) => setExportMonth(Number(v))}>
              <SelectTrigger className="h-9 w-[140px]" aria-label="Mois"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(exportYear)} onValueChange={(v) => setExportYear(Number(v))}>
              <SelectTrigger className="h-9 w-[100px]" aria-label="Année"><SelectValue /></SelectTrigger>
              <SelectContent>
                {exportYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-1.5" onClick={exportClients}>
              <Download className="h-4 w-4" /> Factures clients & avoirs
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={exportFreelances}>
              <Download className="h-4 w-4" /> Factures freelances
            </Button>
          </div>
        </section>
      )}

      <InvoiceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onSaved={reload} />
    </div>
  );
};

export default AdminInvoicesPanel;
