import { Award, CheckCircle2, Circle, Users, type LucideIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export type ClientNeed = Tables<"client_needs">;

export type ProfileSuggestion = Pick<
  Tables<"profile_suggestions">,
  "id" | "need_id" | "anonymous_label" | "match_score" | "match_reasons" | "pipeline_status" | "recruiter_profile_id" | "super_tam" | "created_at" | "status_updated_at"
>;

export type RecruiterProfile = Pick<
  Tables<"recruiter_profiles">,
  "id" | "first_name" | "last_name" | "job_title" | "skills" | "sectors" | "model" | "mobility" | "tjm" | "admin_rating" | "available" | "availability_date" | "super_tam"
>;

export type StageKey = "suggested" | "shortlisted" | "interview" | "accepted";

export interface PipelineStep {
  key: StageKey;
  label: string;
  /** Libellé court au pluriel, pour les compteurs de la liste. */
  counterLabel: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { key: "suggested", label: "Suggéré", counterLabel: "proposés", icon: Circle, color: "text-muted-foreground", bg: "bg-muted/50" },
  { key: "shortlisted", label: "Shortlisté", counterLabel: "présélectionnés", icon: Award, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { key: "interview", label: "Entretien", icon: Users, counterLabel: "en entretien", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "accepted", label: "Accepté", icon: CheckCircle2, counterLabel: "acceptés", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
];

/**
 * Statut affiché d'un besoin. La base ne connaît que pending (défaut), active, staffed
 * (posé à la création de la mission) et closed : « À matcher » / « En cours » se déduisent
 * de la présence de suggestions.
 */
export type NeedDisplayStatus = "to_match" | "in_progress" | "staffed" | "closed";

export const NEED_STATUS: Record<NeedDisplayStatus, { label: string; tone: string }> = {
  to_match: { label: "À matcher", tone: "bg-[#EDF3FB] text-[#1E4F8F]" },
  in_progress: { label: "En cours", tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  staffed: { label: "Pourvu", tone: "bg-[#E6F4EC] text-[#17693D]" },
  closed: { label: "Clos", tone: "bg-muted text-muted-foreground" },
};

export const REMOTE_LABEL: Record<string, string> = {
  "on-site": "Sur site",
  hybrid: "Hybride",
  "full-remote": "Full remote",
  flexible: "Flexible",
};

export const remoteLabel = (v: string | null | undefined) => (v ? REMOTE_LABEL[v] ?? v : "—");

/** Délai sans mouvement au-delà duquel un profil présélectionné ou en entretien est à relancer. */
export const STALE_DAYS = 7;
const DAY_MS = 86_400_000;

export type TodoReason = "to_match" | "mission_to_create" | "to_follow_up";

export const TODO_LABEL: Record<TodoReason, string> = {
  to_match: "À matcher",
  mission_to_create: "Mission à créer",
  to_follow_up: "À relancer",
};

export interface NeedRow {
  need: ClientNeed;
  counts: Record<StageKey, number>;
  status: NeedDisplayStatus;
  /** Raisons « À traiter », de la plus urgente à la moins urgente ; vide si rien à faire. */
  todo: TodoReason[];
}

export function displayStatus(need: Pick<ClientNeed, "status">, suggestionCount: number): NeedDisplayStatus {
  if (need.status === "closed") return "closed";
  if (need.status === "staffed") return "staffed";
  return suggestionCount === 0 ? "to_match" : "in_progress";
}

/** Assemble une ligne de liste : compteurs par étape, statut affiché et raisons « À traiter ». */
export function buildNeedRow(
  need: ClientNeed,
  suggestions: ProfileSuggestion[],
  missionSuggestionIds: ReadonlySet<string>,
  now: number = Date.now(),
): NeedRow {
  const counts: Record<StageKey, number> = { suggested: 0, shortlisted: 0, interview: 0, accepted: 0 };
  let total = 0;
  let missionToCreate = false;
  let followUp = false;
  for (const s of suggestions) {
    if (s.need_id !== need.id) continue;
    if (s.pipeline_status in counts) {
      counts[s.pipeline_status as StageKey] += 1;
      total += 1;
    }
    if (s.pipeline_status === "accepted" && !missionSuggestionIds.has(s.id)) missionToCreate = true;
    if (s.pipeline_status === "shortlisted" || s.pipeline_status === "interview") {
      const since = new Date(s.status_updated_at || s.created_at).getTime();
      if (now - since > STALE_DAYS * DAY_MS) followUp = true;
    }
  }
  const status = displayStatus(need, total);
  const todo: TodoReason[] = [];
  if (status !== "closed") {
    if (missionToCreate) todo.push("mission_to_create");
    if (status === "to_match") todo.push("to_match");
    if (followUp && status !== "staffed") todo.push("to_follow_up");
  }
  return { need, counts, status, todo };
}

export interface NeedFilters {
  q: string;
  status: NeedDisplayStatus | "";
  client: string;
  todo: boolean;
  /** Fonction (rpo, drh, cfo…) ; vide = toutes. */
  vertical: string;
}

export const EMPTY_FILTERS: NeedFilters = { q: "", status: "", client: "", todo: false, vertical: "" };

/** Paramètres d'URL de l'onglet Besoins (les filtres survivent au passage par le détail). */
export const NEED_PARAM = "need";
const FILTER_KEYS = ["q", "status", "client", "todo", "fonction"] as const;

export function filtersFromParams(params: URLSearchParams): NeedFilters {
  const status = params.get("status") ?? "";
  return {
    q: params.get("q") ?? "",
    status: status in NEED_STATUS ? (status as NeedDisplayStatus) : "",
    client: params.get("client") ?? "",
    todo: params.get("todo") === "1",
    vertical: params.get("fonction") ?? "",
  };
}

export function applyFiltersToParams(prev: URLSearchParams, f: NeedFilters): URLSearchParams {
  const next = new URLSearchParams(prev);
  FILTER_KEYS.forEach((k) => next.delete(k));
  if (f.q.trim()) next.set("q", f.q);
  if (f.status) next.set("status", f.status);
  if (f.client) next.set("client", f.client);
  if (f.todo) next.set("todo", "1");
  if (f.vertical) next.set("fonction", f.vertical);
  return next;
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtre puis trie : besoins à traiter d'abord, puis les plus récents. */
export function filterAndSortRows(rows: NeedRow[], f: NeedFilters): NeedRow[] {
  const q = normalize(f.q.trim());
  return rows
    .filter((r) => {
      if (q && !normalize(`${r.need.job_title} ${r.need.company_name}`).includes(q)) return false;
      if (f.status && r.status !== f.status) return false;
      if (f.client && r.need.user_id !== f.client) return false;
      if (f.todo && r.todo.length === 0) return false;
      if (f.vertical && (r.need.vertical ?? "rpo") !== f.vertical) return false;
      return true;
    })
    .sort((a, b) => {
      const urgent = Number(b.todo.length > 0) - Number(a.todo.length > 0);
      if (urgent !== 0) return urgent;
      return new Date(b.need.created_at).getTime() - new Date(a.need.created_at).getTime();
    });
}

/** « aujourd'hui », « il y a 3 j », « il y a 2 mois ». */
export function relativeAge(iso: string, now: number = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  if (days < 1) return "aujourd'hui";
  if (days < 60) return `il y a ${days} j`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

export const budgetLabel = (n: Pick<ClientNeed, "budget_tjm_min" | "budget_tjm_max">) => {
  const { budget_tjm_min: min, budget_tjm_max: max } = n;
  if (min == null && max == null) return "Non précisé";
  if (min != null && max != null) return min === max ? `${min} €/j` : `${min}–${max} €/j`;
  return min != null ? `dès ${min} €/j` : `jusqu'à ${max} €/j`;
};
