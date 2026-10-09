import { supabase } from "@/integrations/supabase/client";

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
  description: string | null;
  sectors: string[];
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
