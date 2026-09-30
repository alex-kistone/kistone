/**
 * Matching besoin ⇄ freelance — étage déterministe.
 *
 * Cet étage tourne toujours, même sans clé IA : il filtre les profils
 * inéligibles, calcule un score explicable et ne transmet que les meilleurs
 * candidats à Claude. Objectif : réduire le coût et l'aléa du LLM, et garder
 * un résultat exploitable si l'appel IA échoue.
 */

import { englishLevel } from "./jarvi.ts";
import { METIER_ALIASES, METIER_FAMILIES } from "./taxonomy.ts";

/** Marge Gotam ajoutée au TJM recruteur pour obtenir le prix client. */
export const MARGIN_EUR = 100;

/** Tolérance de dépassement du budget max client avant exclusion. */
const BUDGET_TOLERANCE = 0.1;

/** Vocabulaire de la base (cf. REMOTE_OPTIONS dans ClientNewNeed.tsx / Profile.tsx). */
export type RemotePolicy = "on-site" | "hybrid" | "full-remote" | "flexible";

export interface Need {
  id: string;
  job_title: string;
  description: string | null;
  persona: string;
  profile_types: string[];
  sectors: string[];
  mission_location: string;
  remote_policy: RemotePolicy;
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
}

export interface Recruiter {
  id: string;
  first_name: string;
  job_title: string | null;
  skills: string[];
  sectors: string[];
  tech_specialties: string[];
  mobility: string[];
  clients: string[];
  languages: unknown;
  remote_preference: RemotePolicy;
  tjm: number | null;
  model: string | null;
  available: boolean;
  availability_date: string | null;
  admin_rating: number | null;
  /** Note d'anglais de l'admin (1-5) : prime sur le niveau déclaré dans `languages`. */
  admin_english_rating?: number | null;
  /** Avis interne : transmis au classement IA, jamais montré au client. */
  admin_comments?: string | null;
  super_tam: boolean;
  intro_text: string | null;
  missions: unknown;
  has_linkedin_license: boolean;
}

export interface ScoreBreakdown {
  budget: number;
  availability: number;
  remote: number;
  skills: number;
  sectors: number;
  location: number;
  quality: number;
  english: number;
}

export interface ScoredRecruiter {
  recruiter: Recruiter;
  score: number;
  breakdown: ScoreBreakdown;
  /** Motifs factuels, réutilisés si l'IA est indisponible. */
  notes: string[];
  currentlyOnMission: boolean;
}

// La spécialité métier est la promesse centrale : c'est le critère le plus lourd.
const MAX = { budget: 25, availability: 20, remote: 15, skills: 35, sectors: 10, location: 10, quality: 25, english: 10 };

/**
 * Part du critère qualité selon la note admin : 5 = top profil prioritaire, 4 = top profil,
 * 3 = pas mal, 2 = pas ouf ; 1 = ne matche jamais (exclu plus haut) ; 0 = non noté.
 */
const RATING_WEIGHT: Record<number, number> = { 0: 0.45, 2: 0.15, 3: 0.55, 4: 0.8, 5: 1 };

/** Le besoin demande-t-il de l'anglais ? */
const ENGLISH_HINT = /\b(anglais|english|bilingues?|internationa(?:l|le|les|ux)|anglophones?)\b/i;

/** Critère anglais : neutre si le besoin n'en parle pas, sinon selon le niveau retenu. */
function scoreEnglish(needText: string, r: Recruiter): { pts: number; note: string | null } {
  if (!ENGLISH_HINT.test(needText)) return { pts: MAX.english, note: null };
  const languages = Array.isArray(r.languages) ? (r.languages as { language: string; level: string }[]) : [];
  const level = englishLevel({ languages, admin_english_rating: r.admin_english_rating ?? null });
  if (level == null) return { pts: MAX.english * 0.4, note: null };
  if (level >= 4) return { pts: MAX.english, note: "Anglais courant" };
  if (level === 3) return { pts: MAX.english * 0.6, note: "Bon niveau d'anglais" };
  return { pts: 0, note: "Anglais limité" };
}

/** Score plafond d'un profil qui ne recrute sur aucun métier du besoin, même voisin. */
const NO_METIER_CAP = 45;
/** Crédit accordé à un métier voisin (même famille) plutôt qu'identique. */
const FAMILY_CREDIT = 0.5;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const canon = (s: string) => METIER_ALIASES[s] ?? s;
const familyOf = (m: string) => METIER_FAMILIES.findIndex((f) => f.some((x) => norm(x) === norm(canon(m))));

/**
 * Métiers du besoin couverts par le profil : identiques (crédit 1) ou voisins (crédit partiel).
 * Retourne le ratio et les libellés, pour des raisons concrètes.
 */
function metierMatch(profileMetiers: string[], needMetiers: string[]) {
  const exact: string[] = [];
  const near: string[] = [];
  const mine = (profileMetiers ?? []).map(canon);
  for (const m of (needMetiers ?? []).map(canon)) {
    if (mine.some((x) => norm(x) === norm(m))) exact.push(m);
    else if (familyOf(m) >= 0 && mine.some((x) => familyOf(x) === familyOf(m))) near.push(m);
  }
  const total = needMetiers?.length ?? 0;
  const ratio = total ? (exact.length + FAMILY_CREDIT * near.length) / total : 0;
  return { ratio, exact, near };
}

/** Recouvrement de deux listes de tags, insensible à la casse et aux accents. */
function overlap(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const setB = new Set(b.map(norm));
  const hits = a.filter((x) => setB.has(norm(x))).length;
  return hits / Math.min(a.length, b.length);
}

/** Recouvrement "souple" : un tag compte s'il apparaît dans le texte libre. */
function mentionedIn(tags: string[], haystack: string): number {
  if (!tags?.length || !haystack) return 0;
  const h = norm(haystack);
  return tags.filter((t) => h.includes(norm(t))).length / tags.length;
}

/**
 * Compatibilité TJM. Le budget du besoin est un prix CLIENT (marge incluse),
 * le TJM du profil est le tarif recruteur : on compare tjm + MARGIN au budget.
 */
function scoreBudget(need: Need, r: Recruiter): { pts: number; note: string | null; excluded: boolean } {
  if (r.tjm == null) return { pts: MAX.budget * 0.3, note: "TJM non renseigné", excluded: false };
  const clientPrice = r.tjm + MARGIN_EUR;
  const min = need.budget_tjm_min ?? 0;
  const max = need.budget_tjm_max ?? Number.POSITIVE_INFINITY;

  if (clientPrice > max * (1 + BUDGET_TOLERANCE)) {
    return { pts: 0, note: `${clientPrice} €/j client, au-delà du budget (${max} €/j)`, excluded: true };
  }
  if (clientPrice > max) {
    return { pts: MAX.budget * 0.5, note: `${clientPrice} €/j client, légèrement au-dessus du budget`, excluded: false };
  }
  if (clientPrice < min) {
    // Sous le budget : bon pour la marge, mais peut signaler un profil trop junior.
    return { pts: MAX.budget * 0.8, note: `${clientPrice} €/j client, sous le budget annoncé`, excluded: false };
  }
  return { pts: MAX.budget, note: `${clientPrice} €/j client, dans le budget`, excluded: false };
}

function scoreAvailability(r: Recruiter, onMission: boolean): { pts: number; note: string | null; excluded: boolean } {
  const isTopProfile = (r.admin_rating ?? 0) >= 4 || r.super_tam;
  const daysUntil = r.availability_date
    ? Math.ceil((new Date(r.availability_date).getTime() - Date.now()) / 86_400_000)
    : null;

  if (r.available && !onMission) return { pts: MAX.availability, note: "Disponible immédiatement", excluded: false };

  if (daysUntil == null) {
    // Indisponible et sans date : on ne le propose que si c'est un profil rare.
    return { pts: 0, note: "Indisponible, aucune date communiquée", excluded: !isTopProfile };
  }
  if (daysUntil <= 0) return { pts: MAX.availability * 0.9, note: "Date de disponibilité atteinte", excluded: false };
  if (daysUntil <= 30) return { pts: MAX.availability * 0.7, note: `Disponible dans ${daysUntil} j`, excluded: false };
  if (daysUntil <= 90) return { pts: MAX.availability * 0.4, note: `Disponible dans ${daysUntil} j`, excluded: false };
  return { pts: MAX.availability * 0.1, note: `Disponible seulement dans ${daysUntil} j`, excluded: !isTopProfile };
}

/** Un full-remote sur un besoin sur site (et l'inverse) est un mauvais match. */
function scoreRemote(need: Need, r: Recruiter): { pts: number; note: string | null } {
  const pref = r.remote_preference ?? "flexible";
  if (pref === "flexible") return { pts: MAX.remote * 0.85, note: null };
  if (pref === need.remote_policy) return { pts: MAX.remote, note: `Préférence remote alignée (${pref})` };
  const opposed = (pref === "full-remote" && need.remote_policy === "on-site") ||
                  (pref === "on-site" && need.remote_policy === "full-remote");
  if (opposed) return { pts: 0, note: `Incompatibilité remote (profil ${pref} / besoin ${need.remote_policy})` };
  return { pts: MAX.remote * 0.5, note: null };
}

export function scoreRecruiter(need: Need, r: Recruiter, onMission: boolean): ScoredRecruiter | null {
  // Note admin 1 = profil grillé, jamais suggéré.
  if ((r.admin_rating ?? 0) === 1) return null;

  const budget = scoreBudget(need, r);
  const availability = scoreAvailability(r, onMission);
  if (budget.excluded || availability.excluded) return null;

  const remote = scoreRemote(need, r);

  // Métiers : on croise les métiers recrutés par le profil avec ceux du besoin
  // (identiques ou voisins), puis ses spécialités avec l'intitulé et la description.
  const needText = `${need.job_title} ${need.description ?? ""}`;
  const metiers = metierMatch(r.skills ?? [], need.profile_types);
  const specialtiesInText = mentionedIn(r.tech_specialties ?? [], needText);
  const skillsRatio = need.profile_types?.length
    ? Math.min(1, metiers.ratio + 0.25 * specialtiesInText)
    : mentionedIn([...(r.skills ?? []), ...(r.tech_specialties ?? [])], needText);
  const noMetierInCommon = (need.profile_types?.length ?? 0) > 0 && metiers.exact.length === 0 && metiers.near.length === 0;
  const sectorsRatio = overlap(r.sectors ?? [], need.sectors);
  const locationRatio = need.remote_policy === "full-remote"
    ? 1
    : Math.max(overlap(r.mobility ?? [], [need.mission_location]), mentionedIn(r.mobility ?? [], need.mission_location));

  const rating = r.admin_rating ?? 0;
  const quality = MAX.quality * (RATING_WEIGHT[rating] ?? RATING_WEIGHT[0]) * 0.8 + (r.super_tam ? MAX.quality * 0.2 : 0);
  const english = scoreEnglish(needText, r);

  const breakdown: ScoreBreakdown = {
    budget: budget.pts,
    availability: availability.pts,
    remote: remote.pts,
    skills: skillsRatio * MAX.skills,
    sectors: sectorsRatio * MAX.sectors,
    location: locationRatio * MAX.location,
    quality: Math.min(quality, MAX.quality),
    english: english.pts,
  };

  // Motifs lus par le client, du plus décisif au plus secondaire : le métier
  // d'abord (c'est ce qui distingue les profils), puis secteur, budget, dispo, remote.
  const commonSectors = (r.sectors ?? []).filter((x) => (need.sectors ?? []).some((y) => norm(x) === norm(y)));
  const notes: string[] = [];
  if (noMetierInCommon) notes.push(`Recrute surtout en ${(r.skills ?? []).join(", ") || "autre métier"}, pas en ${need.profile_types.join(", ")}`);
  else if (metiers.exact.length) notes.push(`Recrute déjà des profils ${metiers.exact.join(", ")}`);
  else notes.push(`Recrute sur un métier voisin (${(r.skills ?? []).join(", ")})`);
  if (commonSectors.length) notes.push(`Expérience ${commonSectors.join(", ")}`);
  if (r.super_tam) notes.push("Badge Super TAM");
  // Motifs impersonnels : jamais de mention d'une note, d'un avis ou de qui a évalué le profil.
  for (const n of [english.note, budget.note, availability.note, remote.note]) if (n) notes.push(n);
  if (onMission) notes.push("Actuellement en mission");

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const maxTotal = Object.values(MAX).reduce((a, b) => a + b, 0);
  const raw = Math.round((total / maxTotal) * 100);

  return {
    recruiter: r,
    // Sans aucun métier commun, le profil reste visible mais ne peut pas passer devant un vrai spécialiste
    score: noMetierInCommon ? Math.min(raw, NO_METIER_CAP) : raw,
    breakdown,
    notes,
    currentlyOnMission: onMission,
  };
}

/** Filtre + trie tous les profils, et ne garde que les `limit` meilleurs. */
export function prefilter(need: Need, recruiters: Recruiter[], busyIds: Set<string>, limit = 12): ScoredRecruiter[] {
  return recruiters
    .map((r) => scoreRecruiter(need, r, busyIds.has(r.id)))
    .filter((s): s is ScoredRecruiter => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
