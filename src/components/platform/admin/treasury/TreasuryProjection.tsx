import { Input } from "@/components/ui/input";
import { eur } from "@/lib/invoices";
import { monthLabel, type ProjectionRow } from "@/lib/treasury";
import { Amount, Cell, Section } from "./shared";

/** Projection sur 3 mois, enchaînée depuis le solde de départ enregistré (cash_balances). */

const MoneyInput = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center gap-2">
    <label htmlFor={id} className="whitespace-nowrap text-sm text-muted-foreground">{label}</label>
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-[130px] bg-card pr-7 text-right tabular-nums"
        aria-describedby="treasury-inputs-hint"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">€</span>
    </div>
  </div>
);

export const TreasuryProjection = ({ rows, anchored, threshold, onThresholdChange, thresholdValue }: {
  rows: ProjectionRow[];
  /** Un solde réel de référence existe ; sinon le calcul part de 0 € au 1er du mois en cours. */
  anchored: boolean;
  threshold: string;
  onThresholdChange: (v: string) => void;
  thresholdValue: number | null;
}) => {
  const alertAt = thresholdValue ?? 0;
  return (
    <Section
      title="Projection sur 3 mois"
      description="Solde de départ enchaîné + encaissements − décaissements (réalisés du mois, puis factures client à encaisser, factures freelance validées et frais fixes à venir). Les retards comptent sur le mois en cours."
      action={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <MoneyInput id="treasury-threshold" label="Seuil d'alerte" value={threshold} onChange={onThresholdChange} />
          <span id="treasury-inputs-hint" className="sr-only">Seuil mémorisé dans ce navigateur uniquement</span>
        </div>
      }
    >
      <div aria-hidden="true" className="hidden gap-3 border-b border-border px-2 pb-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-5">
        <span>Mois</span><span className="text-right">Ouverture</span><span className="text-right">Encaissements</span><span className="text-right">Décaissements</span><span className="text-right">Solde fin de mois</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r, i) => {
          const alert = r.closing < alertAt;
          return (
            <li key={r.month} className={`grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg px-2 py-3 md:grid-cols-5 md:items-center md:py-2 ${i === 0 ? "bg-muted/50" : ""}`}>
              <Cell label="Mois" className="col-span-2 md:col-span-1">
                <span className="font-medium">{monthLabel(r.month)}</span>
                {i === 0 && <span className="block text-xs text-muted-foreground">Mois en cours</span>}
              </Cell>
              <Cell label="Ouverture" className="md:text-right">
                <Amount value={r.opening} status={i === 0 ? "paid" : "forecast"} alert={r.opening < alertAt} />
              </Cell>
              <Cell label="Encaissements" className="md:text-right"><Amount value={r.receipts} status="forecast" /></Cell>
              <Cell label="Décaissements" className="md:text-right"><Amount value={r.payments} status="forecast" outflow /></Cell>
              <Cell label="Solde fin de mois" className="md:text-right">
                <span className={`whitespace-nowrap font-semibold tabular-nums ${alert ? "text-destructive" : ""}`}>
                  ≈ {r.closing < 0 ? `− ${eur(-r.closing)}` : eur(r.closing)}
                  {alert && <span aria-hidden="true"> ⚠</span>}
                </span>
                {alert && <span className="block text-xs text-destructive">{r.closing < 0 ? "Solde négatif" : "Sous le seuil d'alerte"}</span>}
              </Cell>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        {anchored ? "" : "Sans solde de départ enregistré, le calcul part de 0 € au 1er du mois en cours. "}
        Hors CRA pas encore facturés et hors TVA à reverser. Le seuil d'alerte reste dans ce navigateur.
      </p>
    </Section>
  );
};
