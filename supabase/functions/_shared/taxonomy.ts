/**
 * Référentiel unique des métiers et secteurs, partagé par le site (formulaires,
 * filtres) et les fonctions (matching, analyse des besoins). Pas d'API Deno ici :
 * le front l'importe tel quel via src/lib/taxonomy.ts.
 */

/** Métiers recrutés : cochés par le freelance (skills) et par le client (profile_types). */
export const METIERS = [
  "Tech",
  "Data",
  "Product",
  "GTM",
  "Sales",
  "Digital & Marketing",
  "Finance",
  "Industrie",
  "Énergie",
  "Fonctions support",
] as const;

/** Secteurs d'activité / environnements. */
export const SECTEURS = ["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie", "Autre"] as const;

/**
 * Familles de métiers proches : un recruteur Tech sait souvent recruter en Data,
 * un recruteur Sales en GTM. Le matching leur accorde un crédit partiel.
 */
export const METIER_FAMILIES: readonly (readonly string[])[] = [
  ["Tech", "Data", "Product"],
  ["GTM", "Sales", "Digital & Marketing"],
  ["Finance", "Fonctions support"],
  ["Industrie", "Énergie"],
];

/** Anciennes valeurs encore présentes dans des profils ou besoins existants. */
export const METIER_ALIASES: Record<string, string> = {
  CFO: "Finance",
  Energies: "Énergie",
  Energie: "Énergie",
  "Fonctions supports": "Fonctions support",
};
