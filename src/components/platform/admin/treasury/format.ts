import { eur } from "@/lib/invoices";

/** Formats du pilotage (fr-FR). */

/** Montant arrondi à l'euro (cartes et graphiques). */
export const eur0 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Graduation des axes : « 12,3 k€ » ou « 450 € ». */
export const axisEur = (n: number) => {
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  return a >= 1000
    ? `${sign}${(a / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k€`
    : `${sign}${Math.round(a).toLocaleString("fr-FR")} €`;
};

/** Montant signé avec un vrai signe moins (et jamais « -0,00 € »). */
export const signedEur = (n: number) => (n < -0.004 ? `− ${eur(-n)}` : eur(Math.abs(n)));
