/**
 * Lieux de mobilité des freelances : la France, ses régions et des pays. Liste fixe, sans appel
 * réseau. Partagé par le site (saisie de la mobilité) et le matching, qui doit savoir qu'une
 * mobilité « Île-de-France » couvre une mission à « Paris ».
 * Pas d'API Deno ici (importé via src/lib/locations.ts).
 */

export const FRANCE = "France";

/** Régions françaises, avec leurs anciens noms, sigles, départements et villes principales. */
export const REGIONS: { name: string; aliases: string[] }[] = [
  { name: "Île-de-France", aliases: ["idf", "region parisienne", "paris", "la defense", "boulogne billancourt", "nanterre", "versailles", "saint denis", "creteil", "montreuil", "argenteuil", "issy les moulineaux", "levallois", "neuilly", "massy", "cergy", "evry", "saclay", "essonne", "hauts de seine", "seine saint denis", "val de marne", "yvelines", "val d oise", "seine et marne"] },
  { name: "Auvergne-Rhône-Alpes", aliases: ["rhone alpes", "auvergne", "lyon", "villeurbanne", "grenoble", "saint etienne", "clermont ferrand", "annecy", "chambery", "valence"] },
  { name: "Provence-Alpes-Côte d'Azur", aliases: ["paca", "provence", "cote d azur", "marseille", "nice", "toulon", "aix en provence", "avignon", "cannes", "antibes", "sophia antipolis"] },
  { name: "Occitanie", aliases: ["midi pyrenees", "languedoc", "toulouse", "montpellier", "nimes", "perpignan", "beziers"] },
  { name: "Nouvelle-Aquitaine", aliases: ["aquitaine", "bordeaux", "limoges", "poitiers", "pau", "la rochelle", "bayonne", "biarritz", "merignac"] },
  { name: "Hauts-de-France", aliases: ["nord pas de calais", "picardie", "lille", "amiens", "roubaix", "tourcoing", "villeneuve d ascq", "dunkerque"] },
  { name: "Grand Est", aliases: ["alsace", "lorraine", "champagne", "strasbourg", "reims", "metz", "nancy", "mulhouse", "colmar"] },
  { name: "Pays de la Loire", aliases: ["nantes", "angers", "le mans", "saint nazaire"] },
  { name: "Bretagne", aliases: ["rennes", "brest", "quimper", "vannes", "lorient", "saint malo"] },
  { name: "Normandie", aliases: ["rouen", "caen", "le havre", "cherbourg"] },
  { name: "Bourgogne-Franche-Comté", aliases: ["bourgogne", "franche comte", "dijon", "besancon"] },
  { name: "Centre-Val de Loire", aliases: ["tours", "orleans", "bourges", "chartres", "blois"] },
  { name: "Corse", aliases: ["ajaccio", "bastia"] },
  { name: "Guadeloupe", aliases: ["pointe a pitre"] },
  { name: "Martinique", aliases: ["fort de france"] },
  { name: "Guyane", aliases: ["cayenne"] },
  { name: "La Réunion", aliases: ["reunion"] },
  { name: "Mayotte", aliases: ["mamoudzou"] },
];

/** Pays proposés en plus de la France, par ordre de proximité puis alphabétique. */
export const COUNTRIES = [
  "Belgique", "Suisse", "Luxembourg", "Monaco", "Allemagne", "Espagne", "Italie", "Portugal",
  "Royaume-Uni", "Irlande", "Pays-Bas", "Autriche", "Danemark", "Suède", "Norvège", "Finlande",
  "Pologne", "République tchèque", "Grèce", "Roumanie", "Maroc", "Tunisie", "Algérie", "Sénégal",
  "Côte d'Ivoire", "Canada", "États-Unis", "Mexique", "Brésil", "Émirats arabes unis", "Israël",
  "Inde", "Singapour", "Japon", "Chine", "Australie",
] as const;

/** Toutes les valeurs proposées à la saisie : la France, ses régions, puis les pays. */
export const LOCATION_OPTIONS: { value: string; kind: "Pays" | "Région" }[] = [
  { value: FRANCE, kind: "Pays" },
  ...REGIONS.map((r) => ({ value: r.name, kind: "Région" as const })),
  ...COUNTRIES.map((c) => ({ value: c, kind: "Pays" as const })),
];

/** Sans accents, casse, tirets ni apostrophes : « Val-d'Oise » et « val d oise » se valent. */
export const normalizePlace = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-'’,/;()]/g, " ").replace(/\s+/g, " ").trim();

const hasWord = (text: string, word: string) => ` ${text} `.includes(` ${word} `);

/**
 * Une mobilité couvre-t-elle le lieu de la mission ? Une région couvre ses villes et
 * départements, « France » couvre tout le territoire, et un nom identique suffit pour le reste
 * (pays, anciennes saisies libres).
 */
export function mobilityCovers(mobility: string, location: string): boolean {
  const m = normalizePlace(mobility);
  const loc = normalizePlace(location);
  if (!m || !loc) return false;
  if (hasWord(loc, m)) return true;
  const region = REGIONS.find((r) => normalizePlace(r.name) === m);
  if (region) return region.aliases.some((a) => hasWord(loc, a));
  if (m === normalizePlace(FRANCE)) {
    return REGIONS.some((r) => hasWord(loc, normalizePlace(r.name)) || r.aliases.some((a) => hasWord(loc, a)));
  }
  return false;
}
