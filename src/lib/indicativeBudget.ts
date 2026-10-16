import type { Vertical } from "@/lib/verticals";

/**
 * Budget client indicatif par famille (€ HT / jour, marge Kistone comprise), proposé dans le
 * dépôt de besoin quand le texte du client ne donne pas de budget. Mêmes ordres de grandeur que
 * « Les besoins les plus fréquents » de l'accueil ; Tech recruiter validé par Alex (500–600 €).
 */
export const INDICATIVE_BUDGET: Record<Vertical, [number, number]> = {
  engineer: [800, 1150],
  product: [650, 1100],
  leader: [1100, 1700],
  rpo: [500, 600],
};
