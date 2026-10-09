/**
 * Matching besoin ⇄ freelance — étage déterministe.
 *
 * Cet étage tourne toujours, même sans clé IA : il filtre les profils
 * inéligibles, calcule un score explicable et ne transmet que les meilleurs
 * candidats à Claude. Objectif : réduire le coût et l'aléa du LLM, et garder
 * un résultat exploitable si l'appel IA échoue.
 */

import { englishLevel } from "./jarvi.ts";
import { clientPrice } from "./pricing.ts";
import { METIER_ALIASES, METIER_FAMILIES, type Vertical } from "./taxonomy.ts";
import { FULL_TIME_DAYS, rhythmLabel } from "./verticals.ts";

/** Retard toléré (jours) entre la date d'arrivée souhaitée et la disponibilité du profil. */
export const START_TOLERANCE_DAYS = 30;

/** Tolérance de dépassement du budget max client avant exclusion. */
const BUDGET_TOLERANCE = 0.1;

/** Vocabulaire de la base (cf. REMOTE_OPTIONS dans ClientNewNeed.tsx / Profile.tsx). */
export type RemotePolicy = "on-site" | "hybrid" | "full-remote" | "flexible";

export interface Need {
  id: string;
  /** Verticale du besoin : seuls les profils de la même verticale sont proposés. */
  vertical?: Vertical;
  job_title: string;
  description: string | null;
  persona: string;
  profile_types: string[];
  sectors: string[];
  mission_location: string;
  remote_policy: RemotePolicy;
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
  /** Date d'arrivée souhaitée (AAAA-MM-JJ) ; null = dès que possible. */
  desired_start?: string | null;
  /** Spécialités attendues (départements C-Level). */
  specialties?: string[] | null;
  /** Jours par semaine demandés ; null = temps plein. */
  days_per_week?: number | null;
}

export interface Recruiter {
  id: string;
  vertical?: Vertical;
  /** Spécialités du département (C-Level). */
  specialties?: string[] | null;
  /** Jours disponibles par semaine ; null = temps plein. */
  weekly_capacity?: number | null;
  years_experience?: number | null;
  previous_companies?: string[] | null;
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
 * le TJM du profil est le tarif recruteur : on compare son prix client (TJM + 20 %) au budget.
 */
function scoreBudget(need: Need, r: Recruiter): { pts: number; note: string | null; excluded: boolean } {
  if (r.tjm == null) return { pts: MAX.budget * 0.3, note: "TJM non renseigné", excluded: false };
  const price = clientPrice(r.tjm);
  const min = need.budget_tjm_min ?? 0;
  const max = need.budget_tjm_max ?? Number.POSITIVE_INFINITY;

  if (price > max * (1 + BUDGET_TOLERANCE)) {
    return { pts: 0, note: `Tarif de ${price} €/j, au-delà du budget (${max} €/j)`, excluded: true };
  }
  if (price > max) {
    return { pts: MAX.budget * 0.5, note: `Tarif de ${price} €/j, légèrement au-dessus du budget`, excluded: false };
  }
  if (price < min) {
    // Sous le budget : bon pour la marge, mais peut signaler un profil trop junior.
    return { pts: MAX.budget * 0.8, note: `Tarif de ${price} €/j, sous le budget annoncé`, excluded: false };
  }
  return { pts: MAX.budget, note: `Tarif de ${price} €/j, dans le budget`, excluded: false };
}

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const frDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Disponibilité mesurée par rapport à la date d'arrivée souhaitée (aujourd'hui pour un besoin
 * « dès que possible ») : pleine si le profil est libre à cette date, dégressive jusqu'à
 * START_TOLERANCE_DAYS de retard, exclue au-delà.
 */
function scoreAvailability(need: Need, r: Recruiter, onMission: boolean, now = new Date()): { pts: number; note: string | null; excluded: boolean } {
  const today = startOfDay(now);
  const asap = !need.desired_start;
  const wanted = asap ? today : new Date(Math.max(parseDay(need.desired_start!).getTime(), today.getTime()));
  const isTopProfile = (r.admin_rating ?? 0) >= 4 || r.super_tam;

  // Date à partir de laquelle le profil est libre
  const freeFrom = r.available && !onMission ? today : r.availability_date ? parseDay(r.availability_date) : null;
  if (!freeFrom) {
    // Indisponible et sans date : on ne le propose que si c'est un profil rare.
    return { pts: 0, note: "Indisponible, aucune date communiquée", excluded: !isTopProfile };
  }

  const lateBy = Math.round((freeFrom.getTime() - wanted.getTime()) / DAY_MS);
  if (lateBy <= 0) {
    const note = freeFrom <= today ? "Disponible immédiatement" : asap ? `Disponible dès le ${frDate(freeFrom)}` : `Disponible pour une arrivée le ${frDate(wanted)}`;
    return { pts: MAX.availability, note, excluded: false };
  }
  if (lateBy <= START_TOLERANCE_DAYS) {
    // De 90 % (1 jour de retard) à 50 % (30 jours)
    const pts = MAX.availability * (0.9 - 0.4 * ((lateBy - 1) / (START_TOLERANCE_DAYS - 1)));
    return { pts, note: `Disponible le ${frDate(freeFrom)}, ${lateBy} j après la date souhaitée`, excluded: false };
  }
  return { pts: 0, note: `Disponible le ${frDate(freeFrom)}, trop tard pour la date souhaitée`, excluded: true };
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

/**
 * Capacité fractional : un freelance à temps partiel déjà en mission reste disponible tant
 * qu'il lui reste assez de jours par semaine pour le besoin. `committedDays` = jours déjà pris
 * par ses missions en cours (0 si aucune).
 */
export function capacityFor(need: Need, r: Recruiter, committedDays: number) {
  const capacity = r.weekly_capacity ?? FULL_TIME_DAYS;
  const wanted = need.days_per_week ?? FULL_TIME_DAYS;
  const remaining = Math.max(0, capacity - committedDays);
  return { capacity, wanted, remaining, fits: remaining >= wanted, offersLess: capacity < wanted };
}

export function scoreRecruiter(need: Need, r: Recruiter, onMission: boolean, committedDays = onMission ? FULL_TIME_DAYS : 0): ScoredRecruiter | null {
  // Note admin 1 = profil grillé, jamais suggéré.
  if ((r.admin_rating ?? 0) === 1) return null;
  // Verticales étanches : un profil RPO n'est jamais proposé sur un besoin d'une autre verticale.
  if ((r.vertical ?? "rpo") !== (need.vertical ?? "rpo")) return null;

  const budget = scoreBudget(need, r);
  // En mission, mais avec assez de jours libres dans la semaine : traité comme disponible
  const cap = capacityFor(need, r, committedDays);
  const busy = committedDays > 0 && !cap.fits;
  const availability = scoreAvailability(need, r, busy);
  if (budget.excluded || availability.excluded) return null;

  const remote = scoreRemote(need, r);

  // Métiers : on croise les métiers recrutés par le profil avec ceux du besoin
  // (identiques ou voisins), puis ses spécialités avec l'intitulé et la description.
  const needText = `${need.job_title} ${need.description ?? ""}`;
  const isRpo = (need.vertical ?? "rpo") === "rpo";
  // Départements C-Level : spécialités communes avec le besoin (ou citées dans le texte)
  const mySpecialties = r.specialties ?? [];
  const wantedSpecialties = need.specialties ?? [];
  const commonSpecialties = mySpecialties.filter((x) => wantedSpecialties.some((y) => norm(x) === norm(y)));
  const cLevelRatio = wantedSpecialties.length
    ? Math.min(1, commonSpecialties.length / wantedSpecialties.length + 0.15 * mentionedIn(mySpecialties, needText))
    : Math.max(0.5, mentionedIn(mySpecialties, needText));
  const metiers = metierMatch(r.skills ?? [], need.profile_types);
  const specialtiesInText = mentionedIn(r.tech_specialties ?? [], needText);
  const skillsRatio = !isRpo ? cLevelRatio : need.profile_types?.length
    ? Math.min(1, metiers.ratio + 0.25 * specialtiesInText)
    : mentionedIn([...(r.skills ?? []), ...(r.tech_specialties ?? [])], needText);
  const noMetierInCommon = isRpo && (need.profile_types?.length ?? 0) > 0 && metiers.exact.length === 0 && metiers.near.length === 0;
  const sectorsRatio = overlap(r.sectors ?? [], need.sectors);
  const locationRatio = need.remote_policy === "full-remote"
    ? 1
    : Math.max(overlap(r.mobility ?? [], [need.mission_location]), mentionedIn(r.mobility ?? [], need.mission_location));

  const rating = r.admin_rating ?? 0;
  const quality = MAX.quality * (RATING_WEIGHT[rating] ?? RATING_WEIGHT[0]) * 0.8 + (r.super_tam ? MAX.quality * 0.2 : 0);
  const english = scoreEnglish(needText, r);

  const breakdown: ScoreBreakdown = {
    budget: budget.pts,
    // Le profil propose moins de jours que demandé : disponibilité au prorata
    availability: cap.offersLess ? availability.pts * (cap.capacity / cap.wanted) : availability.pts,
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
  if (!isRpo) {
    if (commonSpecialties.length) notes.push(`Spécialiste ${commonSpecialties.join(", ")}`);
    else if (mySpecialties.length) notes.push(`Expertise ${mySpecialties.slice(0, 3).join(", ")}`);
    if (r.years_experience) notes.push(`${r.years_experience} ans d'expérience${r.previous_companies?.length ? ` · ex-${r.previous_companies.slice(0, 2).join(", ")}` : ""}`);
  } else if (noMetierInCommon) notes.push(`Recrute surtout en ${(r.skills ?? []).join(", ") || "autre métier"}, pas en ${need.profile_types.join(", ")}`);
  else if (metiers.exact.length) notes.push(`Recrute déjà des profils ${metiers.exact.join(", ")}`);
  else notes.push(`Recrute sur un métier voisin (${(r.skills ?? []).join(", ")})`);
  if (commonSectors.length) notes.push(`Expérience ${commonSectors.join(", ")}`);
  if (r.super_tam) notes.push("Badge Super TAM");
  // Motifs impersonnels : jamais de mention d'une note, d'un avis ou de qui a évalué le profil.
  for (const n of [english.note, budget.note, availability.note, remote.note]) if (n) notes.push(n);
  if (cap.offersLess) notes.push(`Disponible ${rhythmLabel(cap.capacity)}, le besoin demande ${rhythmLabel(cap.wanted).toLowerCase()}`);
  else if (committedDays > 0 && cap.fits) notes.push(`Déjà en mission, ${cap.remaining} j/sem encore disponibles`);
  if (busy) notes.push("Actuellement en mission");

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const maxTotal = Object.values(MAX).reduce((a, b) => a + b, 0);
  const raw = Math.round((total / maxTotal) * 100);

  return {
    recruiter: r,
    // Sans aucun métier commun, le profil reste visible mais ne peut pas passer devant un vrai spécialiste
    score: noMetierInCommon ? Math.min(raw, NO_METIER_CAP) : raw,
    breakdown,
    notes,
    currentlyOnMission: busy,
  };
}

/**
 * Filtre + trie tous les profils, et ne garde que les `limit` meilleurs. `busy` : profils en
 * mission (Set) ou jours par semaine déjà engagés par profil (Map, pour le fractional).
 */
export function prefilter(need: Need, recruiters: Recruiter[], busy: Set<string> | Map<string, number>, limit = 12): ScoredRecruiter[] {
  const committed = (id: string) => (busy instanceof Map ? busy.get(id) ?? 0 : busy.has(id) ? FULL_TIME_DAYS : 0);
  return recruiters
    .map((r) => scoreRecruiter(need, r, committed(r.id) > 0, committed(r.id)))
    .filter((s): s is ScoredRecruiter => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
