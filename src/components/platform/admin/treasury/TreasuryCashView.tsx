import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { eur } from "@/lib/invoices";
import { frDate } from "@/components/platform/admin/adv";
import {
  backfillBalances, fixedCostOccurrences, fixedCostsByMonth, localIso, monthKeyOf, monthLabel, monthShortLabel,
  monthsEndingAt, monthsFrom, overdueDays, projectBalance, receiptsByMonth, sumByMonth, unpaidInvoices,
  FIXED_COST_CATEGORIES,
} from "@/lib/treasury";
import type { TreasuryData } from "./useTreasuryData";
import { Amount, Cell, EmptyState, KpiCard, Section, StatusPill } from "./shared";
import { TreasuryCashChart, type CashChartRow } from "./TreasuryCashChart";
import { TreasuryProjection } from "./TreasuryProjection";
import { TreasuryVat } from "./TreasuryVat";
import { parseAmount, usePersistentInput } from "./usePersistentInput";

/** Trésorerie : flux réalisés et prévus, à encaisser / à décaisser, projection et TVA. */

const DueStatus = ({ late, due }: { late: number; due: string | null }) =>
  late > 0 ? <StatusPill tone="warning">En retard de {late} j</StatusPill>
    : due ? <StatusPill tone="neutral">Échéance {frDate(due)}</StatusPill>
    : <StatusPill tone="neutral">Sans échéance</StatusPill>;

export const TreasuryCashView = ({ data }: { data: TreasuryData }) => {
  const today = localIso();
  const current = monthKeyOf(today);
  const [cash, setCash] = usePersistentInput("kistone.treasury.startingCash");
  const [threshold, setThreshold] = usePersistentInput("kistone.treasury.alertThreshold");
  const cashValue = parseAmount(cash);
  const thresholdValue = parseAmount(threshold);

  // Réalisé : 6 derniers mois, mois en cours à date
  const flows = useMemo(() => {
    const months = monthsEndingAt(current, 6);
    const receipts = receiptsByMonth(data.clientInvoices, months);
    const freelances = sumByMonth(data.freelanceInvoices.filter((i) => i.paid_at), months, (i) => i.paid_at, (i) => Number(i.amount_ttc));
    const fixed = fixedCostsByMonth(data.fixedCosts, months, { to: today });
    return months.map((m) => {
      const out = freelances[m] + fixed[m].ttc;
      return { month: m, receipts: receipts[m], freelances: freelances[m], fixed: fixed[m].ttc, out, net: receipts[m] - out };
    });
  }, [data, current, today]);

  const receivables = useMemo(() =>
    unpaidInvoices(data.clientInvoices)
      .map((i) => ({ ...i, late: overdueDays(i.due_date, today), amount: Number(i.total_ttc) - Number(i.paid_amount ?? 0) }))
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")), [data, today]);
  const receivableTotal = receivables.reduce((s, i) => s + i.amount, 0);
  const overdueTotal = receivables.filter((i) => i.late > 0).reduce((s, i) => s + i.amount, 0);

  // À venir : factures freelance validées et frais fixes non échus des 3 prochains mois
  const payables = useMemo(() => {
    const months = monthsFrom(current, 3);
    const freelances = data.freelanceInvoices
      .filter((i) => i.status === "approved" && !i.paid_at)
      .map((i) => ({ key: i.id, label: i.freelance_name, detail: `Facture ${i.invoice_number}`, due: i.due_date, amount: Number(i.amount_ttc), fixed: false }));
    const fixed = data.fixedCosts.flatMap((c) =>
      fixedCostOccurrences(c, months[0], months[months.length - 1])
        .filter((o) => o.date >= today)
        .map((o) => ({ key: `${c.id}-${o.date}`, label: c.label, detail: FIXED_COST_CATEGORIES[c.category] ?? "Frais fixe", due: o.date, amount: Number(c.amount_ht) + Number(c.vat_amount), fixed: true })));
    return { months, freelances, fixed, all: [...freelances, ...fixed].sort((a, b) => (a.due ?? "").localeCompare(b.due ?? "")) };
  }, [data, current, today]);
  const payableFreelances = payables.freelances.reduce((s, i) => s + i.amount, 0);
  const payableFixed = payables.fixed.reduce((s, i) => s + i.amount, 0);

  const projection = useMemo(() => projectBalance({
    start: cashValue ?? 0,
    months: payables.months,
    receipts: receivables.map((i) => ({ due: i.due_date, amount: i.amount })),
    payments: payables.all.map((p) => ({ due: p.due, amount: p.amount })),
  }), [cashValue, payables, receivables]);

  const chartRows = useMemo<CashChartRow[]>(() => {
    const past = backfillBalances(cashValue ?? 0, flows.map((f) => f.net));
    const rows: CashChartRow[] = flows.map((f, i) => ({
      label: monthShortLabel(f.month), inDone: f.receipts, outDone: f.out, inForecast: 0, outForecast: 0, balance: past[i],
    }));
    const now = rows[rows.length - 1];
    now.inForecast = projection[0]?.receipts ?? 0;
    now.outForecast = projection[0]?.payments ?? 0;
    now.balance = projection[0]?.closing ?? now.balance;
    for (const p of projection.slice(1)) {
      rows.push({ label: monthShortLabel(p.month), inDone: 0, outDone: 0, inForecast: p.receipts, outForecast: p.payments, balance: p.closing });
    }
    return rows;
  }, [flows, projection, cashValue]);

  return (
    <div className="space-y-4">
      <Section
        title="Flux de trésorerie"
        description="Réalisé sur 6 mois (barres pleines) puis prévu sur les 3 prochains (hachuré). Encaissements : factures client payées ; décaissements : factures freelance payées et frais fixes TTC échus."
      >
        <TreasuryCashChart rows={chartRows} threshold={cashValue != null ? thresholdValue : null} showBalance={cashValue != null} />
        {cashValue == null && <p className="mt-2 text-xs text-muted-foreground">Saisissez la trésorerie actuelle (projection ci-dessous) pour tracer le solde.</p>}

        <div aria-hidden="true" className="mt-4 hidden gap-3 border-b border-border px-2 pb-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-5">
          <span>Mois</span><span className="text-right">Encaissements</span><span className="text-right">Freelances</span><span className="text-right">Frais fixes</span><span className="text-right">Net</span>
        </div>
        <ul className="mt-4 divide-y divide-border md:mt-0">
          {flows.map((f) => {
            const isCurrent = f.month === current;
            return (
              <li key={f.month} className={`grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg px-2 py-3 md:grid-cols-5 md:items-center md:py-2 ${isCurrent ? "bg-muted/50" : ""}`}>
                <Cell label="Mois" className="col-span-2 md:col-span-1">
                  <span className="font-medium">{monthLabel(f.month)}</span>
                  {isCurrent && <span className="block text-xs text-muted-foreground">À date</span>}
                </Cell>
                <Cell label="Encaissements" className="md:text-right"><Amount value={f.receipts} /></Cell>
                <Cell label="Freelances" className="md:text-right"><Amount value={f.freelances} outflow /></Cell>
                <Cell label="Frais fixes" className="md:text-right"><Amount value={f.fixed} outflow /></Cell>
                <Cell label="Net" className="md:text-right"><span className="font-semibold"><Amount value={f.net} /></span></Cell>
              </li>
            );
          })}
        </ul>
        {data.fixedCostsError && <p className="mt-2 text-xs text-muted-foreground">Frais fixes non comptés : table indisponible (migration à appliquer).</p>}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="À encaisser" description="Factures client émises non réglées, par échéance.">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <KpiCard label="Total TTC" value={eur(receivableTotal)} icon={ArrowDownLeft} />
            <KpiCard label="Dont en retard" value={eur(overdueTotal)} tone={overdueTotal > 0 ? "danger" : undefined} />
          </div>
          {receivables.length === 0 ? (
            <EmptyState icon={CheckCircle2}>Aucune facture en attente de paiement.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {receivables.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{(i.buyer?.company_name as string | undefined) || "Client"}</p>
                    <p className="text-xs text-muted-foreground">{i.number ?? "Sans numéro"}</p>
                    <DueStatus late={i.late} due={i.due_date} />
                  </div>
                  <span className="shrink-0 text-sm"><Amount value={i.amount} status={i.late > 0 ? "late" : i.due_date ? "expected" : "paid"} /></span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="À décaisser" description="Factures freelance validées non payées et frais fixes des 3 prochains mois.">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <KpiCard label="Freelances TTC" value={eur(payableFreelances)} icon={ArrowUpRight} />
            <KpiCard label="Frais fixes TTC" value={eur(payableFixed)} />
          </div>
          {payables.all.length === 0 ? (
            <EmptyState icon={CheckCircle2}>Rien à régler pour le moment.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {payables.all.map((p) => {
                const late = overdueDays(p.due, today);
                return (
                  <li key={p.key} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.detail}</p>
                      <DueStatus late={late} due={p.due} />
                    </div>
                    <span className="shrink-0 text-sm"><Amount value={p.amount} outflow status={late > 0 ? "late" : p.fixed ? "forecast" : "expected"} /></span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <TreasuryProjection
        rows={projection}
        cash={cash}
        onCashChange={setCash}
        threshold={threshold}
        onThresholdChange={setThreshold}
        thresholdValue={thresholdValue}
      />
      <TreasuryVat data={data} today={today} />
    </div>
  );
};
