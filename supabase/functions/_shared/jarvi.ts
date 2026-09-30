/**
 * Correspondance entre le profil freelance de la plateforme et les champs personnalisés de
 * Jarvi (ATS de Kistone). Identifiants relevés dans Jarvi le 2026-09-30 ; les valeurs des
 * champs à choix sont celles de Jarvi, au caractère près.
 *
 * Partagé par le site (listes du formulaire) et la fonction jarvi-sync (écriture dans Jarvi) :
 * pas d'API Deno ici, le front l'importe tel quel via src/lib/jarvi.ts.
 */

/** Projet Jarvi où arrive tout freelance inscrit sur la plateforme. */
export const JARVI_SIGNUP_PROJECT_ID = "a28725c1-24c0-46b4-bb63-afd1854df1d9";

/** Nombre maximum de métiers et de secteurs par profil (limite des champs Jarvi côté Kistone). */
export const MAX_CHOICES = 3;

/** Modèles proposés au freelance ; « Succès » correspond à « Success » dans Jarvi. */
export const MODELS = ["RPO", "Succès"] as const;

export const LANGUAGES = ["Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais", "Néerlandais", "Arabe", "Chinois"];
export const LANGUAGE_LEVELS = ["débutant", "intermédiaire", "avancé", "courant", "natif"] as const;

export const JARVI_FIELDS = {
  specialites: "adc61fa4-ad68-4f12-983b-69afe9c03d4c", // Spécialités RPO (choix multiple)
  modele: "20ac801a-0419-44ae-826b-642e1141d3ee", // Modèle : RPO / Success
  tjm: "ccfc9d69-2aa1-4b9e-be4d-98f375259544", // TjM (nombre)
  dispo: "39d63913-a78d-4259-a91d-f6e4e0cd27ef", // Dispo (oui/non)
  dateDispo: "ae14786c-4121-4d65-b575-6000f3437574", // Date de dispo
  secteurs: "1c36f227-f1f3-40bd-b6e9-cb32107a937c", // Secteurs (choix multiple)
  mobilite: "765ffdbc-4869-4588-9b5f-1629ff229610", // Mobility (villes)
  fullRemote: "5637879c-9bdf-4442-a38f-8529c775e718", // Full remote only (oui/non)
  english: "f9138500-c289-4959-9ee1-ceb3963647e4", // English (note)
  rate: "a652d6b3-d0dd-439a-8b76-2ca7679552a3", // Rate : note admin (1 à 5)
  specialitesTech: "964b658c-fae5-4760-a562-2cd9657b2d13", // Spécialités RPO Tech
  notes: "db48da33-1764-4e07-a354-f2efcc7b7c83", // 🗒️Notes : commentaires admin
  autresLangues: "02ee6c11-edda-4817-986c-22bed97593f7", // Autres langues : « Langue (niveau) »
} as const;

const MODEL_TO_JARVI: Record<string, string> = { RPO: "RPO", "Succès": "Success" };

/** Spécialités tech (fiche admin) : valeurs du champ Jarvi « Spécialités RPO Tech ». */
export const JARVI_TECH_SPECIALTIES = ["Cyber", "Data/AI", "Dev", "Infra", "SAP"];

/** Secteurs de la plateforme → valeurs Jarvi (« Autre » n'a pas d'équivalent). */
const SECTOR_TO_JARVI: Record<string, string> = {
  "Startup/scaleup": "Startup/scaleup",
  "Banque/assurance": "Banque",
  Retail: "Retail",
  ESN: "ESN",
  Industrie: "Industrie",
};

/** Niveau d'anglais → note Jarvi (1 à 5). */
const ENGLISH_RATING: Record<string, number> = { "débutant": 1, "intermédiaire": 2, "avancé": 3, courant: 4, natif: 5 };

export interface PlatformProfileForJarvi {
  skills: string[];
  model: string | null;
  tjm: number | null;
  available: boolean;
  availability_date: string | null;
  sectors: string[];
  mobility: string[];
  remote_preference: string | null;
  languages: { language: string; level: string }[];
  admin_rating?: number | null;
  admin_english_rating?: number | null;
  admin_comments?: string | null;
  tech_specialties?: string[] | null;
}

/** Niveau d'anglais retenu (1 à 5) : la note de l'admin prime sur la déclaration du freelance. */
export function englishLevel(p: Pick<PlatformProfileForJarvi, "languages" | "admin_english_rating">): number | null {
  if (p.admin_english_rating) return p.admin_english_rating;
  const english = (p.languages ?? []).find((l) => l.language === "Anglais");
  return english ? ENGLISH_RATING[english.level] ?? null : null;
}

/** Valeurs Jarvi du champ « Spécialités RPO » : identiques aux métiers de la plateforme. */
export { METIERS as JARVI_SPECIALITES } from "./taxonomy.ts";

/**
 * Valeurs des champs Jarvi pour un profil, par identifiant de champ. Les valeurs sans
 * équivalent Jarvi sont listées dans `unmapped` (à ajouter dans Jarvi ou à ignorer).
 */
export function toJarviFields(p: PlatformProfileForJarvi, jarviSpecialites: readonly string[]) {
  const unmapped: string[] = [];
  const specialites = p.skills.filter((s) => {
    const ok = jarviSpecialites.includes(s);
    if (!ok) unmapped.push(`Métier « ${s} »`);
    return ok;
  });
  const models = (p.model ? p.model.split(",") : []).map((m) => m.trim()).filter(Boolean)
    .map((m) => MODEL_TO_JARVI[m] ?? (unmapped.push(`Modèle « ${m} »`), null)).filter((m): m is string => !!m);
  const secteurs = p.sectors.map((s) => SECTOR_TO_JARVI[s] ?? (unmapped.push(`Secteur « ${s} »`), null)).filter((s): s is string => !!s);
  const autresLangues = p.languages.filter((l) => l.language.trim()).map((l) => `${l.language} (${l.level})`);

  return {
    fields: {
      [JARVI_FIELDS.specialites]: specialites,
      [JARVI_FIELDS.modele]: models,
      [JARVI_FIELDS.tjm]: p.tjm,
      [JARVI_FIELDS.dispo]: p.available,
      [JARVI_FIELDS.dateDispo]: p.available ? null : p.availability_date,
      [JARVI_FIELDS.secteurs]: secteurs,
      [JARVI_FIELDS.mobilite]: p.mobility,
      [JARVI_FIELDS.fullRemote]: p.remote_preference === "full-remote",
      [JARVI_FIELDS.english]: englishLevel(p),
      [JARVI_FIELDS.autresLangues]: autresLangues,
      // Champs admin : envoyés seulement s'ils sont renseignés (jamais effacés par la synchro).
      ...(p.admin_rating ? { [JARVI_FIELDS.rate]: p.admin_rating } : {}),
      ...(p.tech_specialties?.length ? { [JARVI_FIELDS.specialitesTech]: p.tech_specialties.filter((t) => JARVI_TECH_SPECIALTIES.includes(t)) } : {}),
      ...(p.admin_comments?.trim() ? { [JARVI_FIELDS.notes]: p.admin_comments.trim() } : {}),
    },
    unmapped,
  };
}
