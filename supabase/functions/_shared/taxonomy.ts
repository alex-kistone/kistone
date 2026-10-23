/**
 * Référentiel unique des métiers et secteurs, partagé par le site (formulaires,
 * filtres) et les fonctions (matching, analyse des besoins). Pas d'API Deno ici :
 * le front l'importe tel quel via src/lib/taxonomy.ts.
 */

// Verticales (départements) : configuration complète dans verticals.ts.
export { VERTICALS, DEFAULT_VERTICAL, type Vertical } from "./verticals.ts";

/**
 * Métiers recrutés par un Tech Recruiter (verticale RPO) : grandes familles cochées par le
 * freelance (skills, 3 au maximum) et par le client (profile_types). Synchronisés avec le champ
 * Jarvi « Spécialités RPO » (adc61fa4-ad68-4f12-983b-69afe9c03d4c). Ordre et libellés fixés par
 * Alex le 2026-10-20 ; le détail tech (Cyber, Infra/Cloud, SAP…) est saisi par l'admin dans les
 * spécialités tech (JARVI_TECH_SPECIALTIES, champ « Spécialités RPO Tech »).
 */
export const METIERS = [
  "Tech",
  "Data/AI",
  "Product",
  "GTM",
  "Sales",
  "Autres", // un métier hors de cette liste (le freelance le précise dans sa présentation)
] as const;

/** Secteurs d'activité / environnements. */
export const SECTEURS = ["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie", "Autre"] as const;

/**
 * Familles de métiers proches : un recruteur Tech sait souvent recruter en Data/AI ou en Product,
 * un recruteur GTM en Sales. Le matching leur accorde un crédit partiel.
 */
export const METIER_FAMILIES: readonly (readonly string[])[] = [
  ["Tech", "Data/AI", "Product"],
  ["GTM", "Sales"],
];

/** Anciennes valeurs encore possibles dans des profils ou besoins existants. */
export const METIER_ALIASES: Record<string, string> = {
  "Data/IA": "Data/AI",
  Data: "Data/AI",
  IA: "Data/AI",
  Engineering: "Tech",
  Dev: "Tech",
  "Infra/Cloud": "Tech",
  Infra: "Tech",
  Cloud: "Tech",
  Cyber: "Tech",
  Cybersécurité: "Tech",
  "Digital & Marketing": "GTM",
  Autre: "Autres",
};

/**
 * Métiers d'un profil ou d'un besoin ramenés à la liste actuelle : anciennes valeurs renommées,
 * valeurs inconnues et doublons retirés (sinon elles comptent dans la limite de choix sans
 * apparaître dans le formulaire).
 */
export function normalizeMetiers(values: readonly string[] | null | undefined): string[] {
  const known = new Set<string>(METIERS);
  const out: string[] = [];
  for (const v of values ?? []) {
    const m = METIER_ALIASES[v] ?? v;
    if (known.has(m) && !out.includes(m)) out.push(m);
  }
  return out;
}
