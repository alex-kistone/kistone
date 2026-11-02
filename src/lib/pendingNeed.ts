import { supabase } from "@/integrations/supabase/client";
import { BUDGETS, NEED_METIERS, labelOf, type NeedRequest } from "@/lib/needRequest";

/**
 * Besoin qualifié avant la création du compte (parcours public « Partager un besoin ») :
 * gardé dans le navigateur, puis enregistré automatiquement dès que le client a un compte
 * et ses coordonnées (onboarding). Rien n'est stocké côté serveur avant l'inscription.
 */
const KEY = "kistone-pending-need";

export interface PendingNeed {
  job_title: string;
  vertical: string;
  profile_types: string[];
  specialties: string[];
  days_per_week: number | null;
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
  mission_location: string;
  remote_policy: string;
  desired_start: string | null;
  /** Durée de mission en mois (1 à 12), null = à définir. */
  duration_months?: number | null;
  /** Niveau d'anglais requis (1 à 5), null = non requis. */
  english_level?: number | null;
  description: string | null;
  sectors: string[];
}

/** Mois de mission retenus pour chaque durée de /besoin (null = à définir). */
const DURATION_MONTHS: Record<string, number | null> = { "3m": 3, "3-6m": 6, "6m+": 12, unsure: null };
/** Jours avant le démarrage pour chaque réponse de /besoin (null = dès que possible ou à définir). */
const START_IN_DAYS: Record<string, number | null> = { asap: null, "1-2w": 14, "1m": 30, unsure: null };

/**
 * Besoin de /besoin repris par le parcours avec compte (« Voir les profils ») : le recruteur du
 * métier choisi, sa durée, son démarrage et son budget. Le lieu et le télétravail restent à
 * préciser (flexible).
 */
export function pendingNeedFromRequest(r: Pick<NeedRequest, "metier" | "duration" | "start_window" | "budget" | "brief">, today = new Date()): PendingNeed {
  const metier = r.metier ?? "Autres";
  const label = labelOf(NEED_METIERS, metier) ?? metier;
  const budget = BUDGETS.find((b) => b.value === r.budget);
  const days = START_IN_DAYS[r.start_window] ?? null;
  const start = days == null ? null : new Date(today.getTime() + days * 86_400_000);
  return {
    job_title: metier === "Head of TA" ? "Head of TA" : metier === "Autres" ? "Recruteur" : `Recruteur ${label}`,
    vertical: "rpo",
    profile_types: [metier],
    specialties: [],
    days_per_week: null,
    budget_tjm_min: budget?.min ?? null,
    budget_tjm_max: budget?.max ?? null,
    mission_location: "",
    remote_policy: "flexible",
    desired_start: start ? start.toISOString().slice(0, 10) : null,
    duration_months: r.duration ? DURATION_MONTHS[r.duration] ?? null : null,
    english_level: null,
    description: r.brief,
    sectors: [],
  };
}

export function savePendingNeed(need: PendingNeed) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...need, saved_at: Date.now() })); } catch { /* stockage indisponible */ }
}

export function loadPendingNeed(): PendingNeed | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingNeed & { saved_at?: number };
    // Un brouillon de plus de 30 jours est oublié
    if (parsed.saved_at && Date.now() - parsed.saved_at > 30 * 86_400_000) {
      clearPendingNeed();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingNeed() {
  try { localStorage.removeItem(KEY); } catch { /* stockage indisponible */ }
}

/**
 * Enregistre le besoin en attente pour ce client (entreprise et contact repris de son profil).
 * Renvoie true si un besoin a été créé. Sans brouillon, ne fait rien.
 */
export async function submitPendingNeed(userId: string, email: string): Promise<boolean> {
  const draft = loadPendingNeed();
  if (!draft) return false;
  const { data: profile } = await supabase
    .from("client_profiles" as never)
    .select("company_name, first_name, last_name, email")
    .eq("user_id", userId)
    .maybeSingle();
  const p = profile as { company_name?: string; first_name?: string; last_name?: string; email?: string } | null;
  const { saved_at: _ignored, ...need } = draft as PendingNeed & { saved_at?: number };
  const { error } = await supabase.from("client_needs" as never).insert({
    ...need,
    user_id: userId,
    company_name: p?.company_name ?? "",
    contact_name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim(),
    contact_email: p?.email || email,
  } as never);
  if (error) return false;
  clearPendingNeed();
  return true;
}
