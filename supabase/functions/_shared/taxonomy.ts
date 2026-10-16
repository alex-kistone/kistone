/**
 * Référentiel unique des métiers et secteurs, partagé par le site (formulaires,
 * filtres) et les fonctions (matching, analyse des besoins). Pas d'API Deno ici :
 * le front l'importe tel quel via src/lib/taxonomy.ts.
 */

// Verticales (départements) : configuration complète dans verticals.ts.
export { VERTICALS, DEFAULT_VERTICAL, type Vertical } from "./verticals.ts";

/**
 * Métiers recrutés (verticale RPO, recentrée Tech / Data / IA le 2026-10-16) : cochés par le
 * freelance (skills) et par le client (profile_types). Synchronisés avec le champ Jarvi
 * « Spécialités RPO » (adc61fa4-ad68-4f12-983b-69afe9c03d4c), les valeurs manquantes y sont créées.
 */
export const METIERS = [
  "Data/AI",
  "Dev",
  "Infra",
  "Product",
  "GTM",
  "Autre", // un métier hors de cette liste (le freelance le précise dans sa présentation)
] as const;

/** Secteurs d'activité / environnements. */
export const SECTEURS = ["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie", "Autre"] as const;

/**
 * Familles de métiers proches : un recruteur Dev sait souvent recruter en Data/AI ou en Infra.
 * Le matching leur accorde un crédit partiel.
 */
export const METIER_FAMILIES: readonly (readonly string[])[] = [
  ["Data/AI", "Dev", "Infra", "Product"],
  ["GTM"],
];

/** Anciennes valeurs encore possibles dans des profils ou besoins existants. */
export const METIER_ALIASES: Record<string, string> = {
  Tech: "Dev",
  Data: "Data/AI",
  IA: "Data/AI",
  Sales: "GTM",
  "Digital & Marketing": "GTM",
};
