import { useMemo, useState } from "react";
import { eur } from "@/lib/invoices";
import { fixedCostsByMonth, monthKeyOf, sumByMonth, vatCollectedByMonth, type MonthKey } from "@/lib/treasury";
import type { TreasuryData } from "./useTreasuryData";
import { MonthSelect, Section } from "./shared";

/** Estimation de la TVA à reverser sur un mois. */

export const TreasuryVat = ({ data, today }: { data: TreasuryData; today: string }) => {
  const current = monthKeyOf(today);
  const [month, setMonth] = useState<MonthKey>(current);

  const vat = useMemo(() => {
    const months = [month];
    const collected = vatCollectedByMonth(data.clientInvoices, months)[month];
    const freelances = sumByMonth(data.freelanceInvoices.filter((i) => i.status !== "rejected"), months, (i) => i.invoice_date, (i) => Number(i.vat_amount))[month];
    const fixed = fixedCostsByMonth(data.fixedCosts, months)[month].vat;
    return { collected, freelances, fixed, due: collected - freelances - fixed };
  }, [data, month]);

  return (
    <Section
      title="TVA"
      description="Collectée sur les factures émises du mois, déductible sur les factures freelance et frais fixes du mois."
      action={<MonthSelect id="treasury-vat-month" label="Mois" value={month} onChange={setMonth} last={current} />}
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <dt className="text-muted-foreground">TVA collectée</dt>
          <dd className="text-lg font-semibold tabular-nums">{eur(vat.collected)}</dd>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <dt className="text-muted-foreground">Déductible · freelances</dt>
          <dd className="text-lg font-semibold tabular-nums">−{eur(vat.freelances)}</dd>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <dt className="text-muted-foreground">Déductible · frais fixes</dt>
          <dd className="text-lg font-semibold tabular-nums">−{eur(vat.fixed)}</dd>
        </div>
        <div className="rounded-lg border border-border p-3">
          <dt className="text-muted-foreground">{vat.due < 0 ? "Crédit de TVA" : "TVA à reverser"}</dt>
          <dd className="text-lg font-bold tabular-nums">{eur(Math.abs(vat.due))}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Estimation sur la base des factures ; à valider avec votre comptable (régime des encaissements pour les prestations de services).
      </p>
    </Section>
  );
};
