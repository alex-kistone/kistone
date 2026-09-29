/**
 * Code couleur de la trésorerie, repris du produit ADV-Freelance (validé sur surface blanche).
 * Valeurs locales aux écrans de pilotage : pas de jetons globaux ajoutés.
 */
export const TREASURY_COLORS = {
  /** Encaissements, CA réalisé */
  inflow: "#2a78d6",
  /** Décaissements, marge */
  outflow: "#eb6834",
  /** Solde */
  balance: "#1f2937",
  surface: "#ffffff",
  mutedInk: "#6b6f7b",
  grid: "#e6e7ea",
} as const;

/** Pastilles de statut (fond léger + texte lisible). */
export const PILL_TONES = {
  success: "bg-[#1F9D5B]/10 text-[#17693D]",
  warning: "bg-[#F6C453]/15 text-[#3A2E0B]",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const;
export type PillTone = keyof typeof PILL_TONES;

/** Montant en retard : semi-gras, couleur d'alerte, soulignement ondulé. */
export const LATE_AMOUNT = "font-semibold text-[#8A5A00] underline decoration-[#E0A526] decoration-wavy underline-offset-4";
