/**
 * Demande de besoin déposée sans compte (parcours public /besoin, 6 étapes) :
 * fonction, modèle, rythme / durée / postes, démarrage, puis l'email.
 * Partagé entre le site (questionnaire, admin) et la fonction need-request (validation, email).
 */
import { isVertical, verticalOf, type Vertical } from "./verticals.ts";

export type Option<T extends string = string> = { value: T; label: string; hint?: string };

export type Engagement = "fractional" | "mission" | "cdi" | "unsure";
export const ENGAGEMENTS: readonly Option<Engagement>[] = [
  { value: "fractional", label: "Fractional", hint: "Quelques jours par semaine, dans la durée" },
  { value: "mission", label: "Intérim / mission", hint: "À temps plein, sur une période définie" },
  { value: "cdi", label: "Recrutement CDI", hint: "Des embauches dans vos équipes" },
  { value: "unsure", label: "Pas encore sûr(e)", hint: "On choisit ensemble pendant l'appel" },
];

export const RHYTHMS: readonly Option[] = [
  { value: "1-day", label: "1 jour / semaine" },
  { value: "2-3-days", label: "2 à 3 jours / semaine" },
  { value: "unsure", label: "Pas encore sûr(e)" },
];

export const DURATIONS: readonly Option[] = [
  { value: "3m", label: "3 mois" },
  { value: "3-6m", label: "3 à 6 mois" },
  { value: "6m+", label: "6 mois et plus" },
  { value: "unsure", label: "Pas encore sûr(e)" },
];

export const STARTS: readonly Option[] = [
  { value: "asap", label: "Dès que possible" },
  { value: "1-2w", label: "Sous 1 à 2 semaines" },
  { value: "1m", label: "Dans un mois" },
  { value: "unsure", label: "Pas encore sûr(e)" },
];

export const OPEN_POSITIONS_MAX = 300;
export const BRIEF_MAX = 4000;

export interface NeedRequest {
  email: string;
  vertical: Vertical;
  engagement: Engagement;
  rhythm: string | null;
  duration: string | null;
  open_positions: string | null;
  start_window: string;
  /** Texte tapé sur l'accueil, s'il y en a un. */
  brief: string | null;
}

const has = (list: readonly Option[], v: unknown) => typeof v === "string" && list.some((o) => o.value === v);
export const labelOf = (list: readonly Option[], v: string | null | undefined) => list.find((o) => o.value === v)?.label ?? null;
export const isEmail = (s: string) => s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

/** Valide et normalise une demande reçue ; renvoie un message d'erreur en cas de problème. */
export function parseNeedRequest(body: Record<string, unknown>): NeedRequest | string {
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!isEmail(email)) return "Adresse email invalide.";
  if (!isVertical(body.vertical)) return "Profil recherché invalide.";
  if (!has(ENGAGEMENTS, body.engagement)) return "Modèle invalide.";
  if (!has(STARTS, body.start_window)) return "Démarrage invalide.";
  const engagement = body.engagement as Engagement;
  const rhythm = engagement === "fractional" && has(RHYTHMS, body.rhythm) ? String(body.rhythm) : null;
  const duration = engagement === "mission" && has(DURATIONS, body.duration) ? String(body.duration) : null;
  const positions = engagement === "cdi" ? String(body.open_positions ?? "").trim().slice(0, OPEN_POSITIONS_MAX) : "";
  if (engagement === "cdi" && !positions) return "Indiquez le nombre de postes ouverts.";
  const brief = String(body.brief ?? "").trim().slice(0, BRIEF_MAX);
  return {
    email,
    vertical: body.vertical,
    engagement,
    rhythm,
    duration,
    open_positions: positions || null,
    start_window: String(body.start_window),
    brief: brief || null,
  };
}

/** Lignes du récapitulatif (questionnaire, admin, email). */
export function needRequestLines(r: Pick<NeedRequest, "vertical" | "engagement" | "rhythm" | "duration" | "open_positions" | "start_window">): { label: string; value: string }[] {
  const lines = [
    { label: "Profil", value: r.vertical === "rpo" ? "Tech Recruiter" : verticalOf(r.vertical).short },
    { label: "Modèle", value: labelOf(ENGAGEMENTS, r.engagement) ?? "" },
  ];
  if (r.engagement === "fractional") lines.push({ label: "Rythme", value: labelOf(RHYTHMS, r.rhythm) ?? "Pas encore sûr(e)" });
  if (r.engagement === "mission") lines.push({ label: "Durée", value: labelOf(DURATIONS, r.duration) ?? "Pas encore sûr(e)" });
  if (r.engagement === "cdi") lines.push({ label: "Postes ouverts", value: r.open_positions ?? "" });
  lines.push({ label: "Démarrage", value: labelOf(STARTS, r.start_window) ?? "" });
  return lines;
}
