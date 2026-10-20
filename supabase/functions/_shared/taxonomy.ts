/**
 * Référentiel unique des métiers et secteurs, partagé par le site (formulaires,
 * filtres) et les fonctions (matching, analyse des besoins). Pas d'API Deno ici :
 * le front l'importe tel quel via src/lib/taxonomy.ts.
 */

// Verticales (départements) : configuration complète dans verticals.ts.
export { VERTICALS, DEFAULT_VERTICAL, type Vertical } from "./verticals.ts";

/**
 * Métiers recrutés (verticale RPO, recentrée Tech / Data / IA le 2026-10-16, liste revue par
 * Alex le 2026-10-20) : cochés par le freelance (skills) et par le client (profile_types). Synchronisés avec le champ Jarvi
 * « Spécialités RPO » (adc61fa4-ad68-4f12-983b-69afe9c03d4c), les valeurs manquantes y sont créées.
 */
export const METIERS = [
  "Data/IA",
  "Engineering",
  "Product",
  "Infra/Cloud",
  "Cyber",
  "GTM",
  "Autre", // un métier hors de cette liste (le freelance le précise dans sa présentation)
] as const;

/** Secteurs d'activité / environnements. */
export const SECTEURS = ["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie", "Autre"] as const;

/**
 * Familles de métiers proches : un recruteur Engineering sait souvent recruter en Data/IA ou en
 * Infra/Cloud. Le matching leur accorde un crédit partiel.
 */
export const METIER_FAMILIES: readonly (readonly string[])[] = [
  ["Data/IA", "Engineering", "Infra/Cloud", "Cyber", "Product"],
  ["GTM"],
];

/** Anciennes valeurs encore possibles dans des profils ou besoins existants. */
export const METIER_ALIASES: Record<string, string> = {
  "Data/AI": "Data/IA",
  Dev: "Engineering",
  Infra: "Infra/Cloud",
  Tech: "Engineering",
  Data: "Data/IA",
  IA: "Data/IA",
  Cloud: "Infra/Cloud",
  Cybersécurité: "Cyber",
  Sales: "GTM",
  "Digital & Marketing": "GTM",
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
