import { normalizeMetiers } from "@/lib/taxonomy";

/** Mission telle que saisie dans le profil freelance. */
export type ProfileMission = { client_name: string; profile_types: string; kpis: string; duration: string; tools?: string[]; tools_input?: string };
export type ProfileLanguage = { language: string; level: string };

/** Réponse de la fonction parse-profile (tout est facultatif). */
export type ImportedProfile = {
  job_title?: string;
  intro_text?: string;
  clients?: string[];
  missions?: Partial<ProfileMission>[];
  languages?: Partial<ProfileLanguage>[];
  metiers?: string[];
  specialties?: string[];
};

export type ProfileDraft = {
  jobTitle: string;
  introText: string;
  clients: string[];
  missions: ProfileMission[];
  languages: ProfileLanguage[];
  skills: string[];
  specialties: string[];
};

const key = (s: string) => s.trim().toLowerCase();
const clean = (s: unknown) => (typeof s === "string" ? s.trim() : "");

/**
 * Complète le profil avec ce que l'import a trouvé, sans jamais écraser une saisie du freelance :
 * les champs vides sont remplis, les listes reçoivent les éléments absents (dédoublonnés), les
 * choix limités (métiers, spécialités) ne sont proposés que s'ils sont encore vides.
 * Renvoie aussi le nombre d'éléments ajoutés, pour le message de confirmation.
 */
export function mergeImportedProfile(
  current: ProfileDraft,
  imported: ImportedProfile,
  limits: { maxSkills: number; maxSpecialties: number; allowedSpecialties: readonly string[] },
): { draft: ProfileDraft; added: number } {
  let added = 0;
  /** Valeur importée seulement si le champ est encore vide. */
  const fill = (mine: string, theirs: unknown) => {
    if (mine.trim() || !clean(theirs)) return mine;
    added++;
    return clean(theirs);
  };
  const jobTitle = fill(current.jobTitle, imported.job_title);
  const introText = fill(current.introText, imported.intro_text);

  const clients = [...current.clients];
  for (const c of imported.clients ?? []) {
    const name = clean(c);
    if (name && !clients.some((x) => key(x) === key(name))) { clients.push(name); added++; }
  }

  const missions = [...current.missions];
  for (const m of imported.missions ?? []) {
    const client = clean(m.client_name);
    if (!client || missions.some((x) => key(x.client_name) === key(client) && key(x.profile_types) === key(clean(m.profile_types)))) continue;
    const tools = (m.tools ?? []).map(clean).filter(Boolean).slice(0, 6);
    missions.push({ client_name: client, profile_types: clean(m.profile_types), kpis: clean(m.kpis), duration: clean(m.duration), tools, tools_input: "" });
    added++;
  }

  const languages = [...current.languages];
  for (const l of imported.languages ?? []) {
    const language = clean(l.language);
    if (language && !languages.some((x) => key(x.language) === key(language))) {
      languages.push({ language, level: clean(l.level) || "courant" });
      added++;
    }
  }

  const skills = current.skills.length ? current.skills : normalizeMetiers(imported.metiers).filter((m) => m !== "Autres").slice(0, limits.maxSkills);
  if (!current.skills.length) added += skills.length ? 1 : 0;
  const specialties = current.specialties.length
    ? current.specialties
    : (imported.specialties ?? []).filter((s) => limits.allowedSpecialties.includes(s)).slice(0, limits.maxSpecialties);
  if (!current.specialties.length) added += specialties.length ? 1 : 0;

  return { draft: { jobTitle, introText, clients, missions, languages, skills, specialties }, added };
}
