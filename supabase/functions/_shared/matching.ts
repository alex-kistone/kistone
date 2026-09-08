/**
 * Matching besoin ⇄ freelance — étage déterministe.
 *
 * Cet étage tourne toujours, même sans clé IA : il filtre les profils
 * inéligibles, calcule un score explicable et ne transmet que les meilleurs
 * candidats à Claude. Objectif : réduire le coût et l'aléa du LLM, et garder
 * un résultat exploitable si l'appel IA échoue.
 */

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
}

export interface ScoredRecruiter {
  recruiter: Recruiter;
  score: number;
  breakdown: ScoreBreakdown;
  /** Motifs factuels, réutilisés si l'IA est indisponible. */
  notes: string[];
  currentlyOnMission: boolean;
}

const MAX = { budget: 25, availability: 20, remote: 15, skills: 20, sectors: 10, location: 10, quality: 15 };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

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

  const notes: string[] = [];
  const budget = scoreBudget(need, r);
  const availability = scoreAvailability(r, onMission);
  if (budget.excluded || availability.excluded) return null;

  const remote = scoreRemote(need, r);

  // Compétences : on croise les tags du profil avec les typologies demandées ET
  // l'intitulé/description du besoin, qui portent souvent le vrai signal.
  const needText = `${need.job_title} ${need.description ?? ""}`;
  const profileTags = [...(r.skills ?? []), ...(r.tech_specialties ?? [])];
  const skillsRatio = Math.max(
    overlap(profileTags, need.profile_types),
    mentionedIn(profileTags, needText),
  );
  const sectorsRatio = overlap(r.sectors ?? [], need.sectors);
  const locationRatio = need.remote_policy === "full-remote"
    ? 1
    : Math.max(overlap(r.mobility ?? [], [need.mission_location]), mentionedIn(r.mobility ?? [], need.mission_location));

  const rating = r.admin_rating ?? 0;
  const quality = (rating > 0 ? (rating / 5) * MAX.quality * 0.7 : MAX.quality * 0.3) + (r.super_tam ? MAX.quality * 0.3 : 0);

  const breakdown: ScoreBreakdown = {
    budget: budget.pts,
    availability: availability.pts,
    remote: remote.pts,
    skills: skillsRatio * MAX.skills,
    sectors: sectorsRatio * MAX.sectors,
    location: locationRatio * MAX.location,
    quality: Math.min(quality, MAX.quality),
  };

  for (const n of [budget.note, availability.note, remote.note]) if (n) notes.push(n);
  if (skillsRatio > 0.5) notes.push("Compétences alignées avec le poste");
  if (sectorsRatio > 0) notes.push("Expérience sectorielle commune");
  if (r.super_tam) notes.push("Badge Super TAM");
  if (onMission) notes.push("Actuellement en mission");

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const maxTotal = Object.values(MAX).reduce((a, b) => a + b, 0);

  return {
    recruiter: r,
    score: Math.round((total / maxTotal) * 100),
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
