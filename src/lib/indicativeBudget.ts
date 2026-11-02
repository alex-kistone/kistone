import type { Vertical } from "@/lib/verticals";

/**
 * Budget client indicatif par famille (€ HT / jour, marge Kistone comprise), validé par Alex le
 * 2026-10-16. Proposé dans le dépôt de besoin quand le texte du client ne donne pas de budget, et
 * affiché sur « Les besoins les plus fréquents » de l'accueil (source unique).
 */
export const INDICATIVE_BUDGET: Record<Vertical, [number, number]> = {
  engineer: [600, 1000],
  product: [500, 800],
  leader: [1000, 1600],
  rpo: [500, 600],
};

/** Budget client indicatif d'un Head of TA (€ HT / jour), validé par Alex le 2026-10-31. */
export const HEAD_OF_TA_BUDGET: [number, number] = [800, 1000];
