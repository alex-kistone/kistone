/**
 * Référentiel unique des métiers et secteurs, partagé par le site (formulaires,
 * filtres) et les fonctions (matching, analyse des besoins). Pas d'API Deno ici :
 * le front l'importe tel quel via src/lib/taxonomy.ts.
 */

/**
 * Métiers recrutés : cochés par le freelance (skills) et par le client (profile_types).
 * Même liste, au caractère près, que le champ Jarvi « Spécialités RPO »
 * (adc61fa4-ad68-4f12-983b-69afe9c03d4c) : la synchro est 1 pour 1.
 */
export const METIERS = [
  "Tech",
  "Data",
  "Product",
  "GTM",
  "Finance",
  "Corporate",
  "Immobilier",
] as const;

/** Secteurs d'activité / environnements. */
export const SECTEURS = ["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie", "Autre"] as const;

/**
 * Familles de métiers proches : un recruteur Tech sait souvent recruter en Data,
 * un recruteur Finance sur les fonctions Corporate. Le matching leur accorde un crédit partiel.
 */
export const METIER_FAMILIES: readonly (readonly string[])[] = [
  ["Tech", "Data", "Product"],
  ["Finance", "Corporate"],
];

/** Anciennes valeurs encore possibles dans des profils ou besoins existants. */
export const METIER_ALIASES: Record<string, string> = {
  CFO: "Finance",
  Sales: "GTM",
  "Digital & Marketing": "GTM",
  "Fonctions support": "Corporate",
  "Fonctions supports": "Corporate",
};
