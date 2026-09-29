import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { eur } from "@/lib/invoices";
import {
  cashInItems, cashOutItems, fixedCostOccurrences, flowsByParty, lateFlows, monthDiff, monthKeyOf, monthShortLabel,
  monthsFrom, shiftMonth, type FlowItem, type MonthKey,
} from "@/lib/treasury";
import type { ClientInvoice } from "@/lib/invoices";
import type { FreelanceInvoiceWithName, TreasuryData } from "./useTreasuryData";
import { EmptyState, Section } from "./shared";

/**
 * Détail des flux (repris d'ADV-Freelance) : tableau partie × mois pour le cash in (clients),
 * le cash out (freelances + charges internes) et les retards. Défilement horizontal dans la carte.
 */

type Mode = "in" | "out" | "late";
const CURRENT_TINT = "bg-[#f1f7e6]";
const clientName = (i: ClientInvoice) => (i.buyer?.company_name as string | undefined) || "Client";

const Money = ({ value, outflow = false }: { value: number; outflow?: boolean }) =>
  Math.abs(value) < 0.005
    ? <span className="text-muted-foreground">—</span>
    : <span className="whitespace-nowrap tabular-nums">{outflow || value < 0 ? "− " : ""}{eur(Math.abs(value))}</span>;

interface Row { key: string; party: string; detail?: string; cells: Record<MonthKey, number>; total: number; outflow?: boolean }
interface TotalRow { label: string; cells: Record<MonthKey, number>; total: number; outflow?: boolean }
interface Table { months: MonthKey[]; clamped: boolean; rows: Row[]; totals: TotalRow[] }

export const TreasuryFlowDetail = ({ data, today }: { data: TreasuryData; today: string }) => {
  const [mode, setMode] = useState<Mode>("in");
  const current = monthKeyOf(today);
  const months = useMemo(() => monthsFrom(shiftMonth(current, -2), 14), [current]);

  const late = useMemo(() => lateFlows<ClientInvoice, FreelanceInvoiceWithName>(data.clientInvoices, data.freelanceInvoices, today), [data, today]);

  const table = useMemo((): Table => {
    if (mode === "in") {
      const t = flowsByParty(cashInItems(data.clientInvoices, clientName), months);
      return { months, clamped: false, rows: t.rows.map((r): Row => ({ key: r.party, ...r })), totals: [{ label: "Total", cells: t.totals, total: t.total }] };
    }
    if (mode === "out") {
      const freelances = flowsByParty(cashOutItems(data.freelanceInvoices, (i) => i.freelance_name), months);
      const fixedItems: FlowItem[] = data.fixedCosts.flatMap((c) =>
        fixedCostOccurrences(c, months[0], months[months.length - 1]).map((o) => ({ party: "Charges internes", date: o.date, amount: Number(c.amount_ht) + Number(c.vat_amount) })));
      const fixed = flowsByParty(fixedItems, months);
      const rows: Row[] = [
        ...freelances.rows.map((r) => ({ key: r.party, ...r, outflow: true })),
        ...fixed.rows.map((r) => ({ key: "__fixed", ...r, detail: "Frais fixes TTC", outflow: true })),
      ];
      const cells = Object.fromEntries(months.map((m) => [m, freelances.totals[m] + fixed.totals[m]])) as Record<MonthKey, number>;
      return { months, clamped: false, rows, totals: [{ label: "Total", cells, total: freelances.total + fixed.total, outflow: true }] };
    }
    // Retards : du plus ancien mois d'échéance (12 mois au plus) au mois en cours
    const earliest = late.reduce<MonthKey>((min, l) => (monthDiff(monthKeyOf(l.due), min) > 0 ? monthKeyOf(l.due) : min), current);
    const span = Math.min(12, monthDiff(earliest, current) + 1);
    const lateMonths = monthsFrom(shiftMonth(current, -(span - 1)), span);
    const toRow = (source: "client" | "freelance") => {
      const items = late.filter((l) => l.source === source);
      return items.map((l): Row => {
        const inv = l.invoice;
        const isClient = source === "client";
        const number = isClient ? (inv as ClientInvoice).number ?? "Sans numéro" : (inv as FreelanceInvoiceWithName).invoice_number;
        const party = isClient ? clientName(inv as ClientInvoice) : (inv as FreelanceInvoiceWithName).freelance_name;
        const t = flowsByParty([{ party, date: l.due, amount: l.amount }], lateMonths, { clampEarlier: true });
        return {
          key: `${source}-${number}-${l.due}`,
          party: `${number} · ${party}`,
          detail: `${isClient ? "À encaisser" : "À payer"} · en retard de ${l.daysLate} j`,
          cells: t.totals,
          total: t.total,
          outflow: !isClient,
        };
      });
    };
    const inRows = toRow("client");
    const outRows = toRow("freelance");
    const sum = (rows: Row[]) => ({
      cells: Object.fromEntries(lateMonths.map((m) => [m, rows.reduce((s, r) => s + r.cells[m], 0)])) as Record<MonthKey, number>,
      total: rows.reduce((s, r) => s + r.total, 0),
    });
    const totals: TotalRow[] = [
      ...(inRows.length ? [{ label: "Total à encaisser", ...sum(inRows) }] : []),
      ...(outRows.length ? [{ label: "Total à payer", ...sum(outRows), outflow: true }] : []),
    ];
    const clamped = late.some((l) => monthDiff(monthKeyOf(l.due), lateMonths[0]) > 0);
    return { months: lateMonths, clamped, rows: [...inRows, ...outRows], totals };
  }, [mode, data, months, late, current]);

  const TABS: { key: Mode; label: string }[] = [
    { key: "in", label: "Cash in (par client)" },
    { key: "out", label: "Cash out (par freelance)" },
    { key: "late", label: `Retards (${late.length})` },
  ];
  const caption = mode === "in"
    ? "Factures client : payées au mois du paiement, à régler au mois de l'échéance (TTC)."
    : mode === "out"
      ? "Factures freelance : payées au mois du paiement, reçues ou validées au mois de l'échéance ; charges internes TTC."
      : "Factures client échues non réglées et factures freelance validées échues non payées, au mois de l'échéance.";

  return (
    <Section title="Détail des flux" description={caption}>
      <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1 sm:w-fit" role="group" aria-label="Type de flux">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={mode === t.key}
            onClick={() => setMode(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {table.rows.length === 0 ? (
        <EmptyState icon={CheckCircle2}>
          {mode === "late" ? "Aucun retard de paiement." : "Aucun flux sur la période."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tableau des flux par mois, défilable horizontalement">
          <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="sticky left-0 z-10 min-w-[11rem] max-w-[16rem] border-b border-border bg-card py-2 pr-3 text-left font-medium">Partie</th>
                {table.months.map((m, i) => (
                  <th
                    key={m}
                    scope="col"
                    className={`whitespace-nowrap border-b border-border px-3 py-2 text-right font-medium ${m === current ? `${CURRENT_TINT} text-foreground` : ""}`}
                    aria-current={m === current ? "date" : undefined}
                  >
                    {i === 0 && table.clamped ? "≤ " : ""}{monthShortLabel(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="sticky left-0 z-10 max-w-[16rem] border-b border-border bg-card py-2 pr-3 text-left font-normal">
                    <span className="block truncate font-medium" title={r.party}>{r.party}</span>
                    {r.detail && <span className="block truncate text-xs text-muted-foreground">{r.detail}</span>}
                  </th>
                  {table.months.map((m) => (
                    <td key={m} className={`border-b border-border px-3 py-2 text-right ${m === current ? CURRENT_TINT : ""}`}>
                      <Money value={r.cells[m]} outflow={r.outflow} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              {table.totals.map((t) => (
                <tr key={t.label} className="font-semibold">
                  <th scope="row" className="sticky left-0 z-10 bg-card py-2 pr-3 text-left">
                    {t.label}
                    <span className="block text-xs font-normal text-muted-foreground tabular-nums">{t.outflow ? "− " : ""}{eur(t.total)}</span>
                  </th>
                  {table.months.map((m) => (
                    <td key={m} className={`px-3 py-2 text-right ${m === current ? CURRENT_TINT : ""}`}>
                      <Money value={t.cells[m]} outflow={t.outflow} />
                    </td>
                  ))}
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      )}
    </Section>
  );
};
