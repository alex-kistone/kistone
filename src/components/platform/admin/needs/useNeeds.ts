import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildNeedRow, type ClientNeed, type NeedRow, type ProfileSuggestion, type RecruiterProfile } from "./needsModel";

const SUGGESTION_COLUMNS =
  "id, need_id, anonymous_label, match_score, match_reasons, pipeline_status, recruiter_profile_id, super_tam, created_at, status_updated_at";
const PROFILE_COLUMNS =
  "id, first_name, last_name, job_title, skills, sectors, model, mobility, tjm, admin_rating, available, availability_date, super_tam";

interface Options {
  /** Limite aux besoins d'un compte client (fiche client). */
  clientUserId?: string;
  /** Charge aussi les profils freelances (nécessaire au détail d'un besoin). */
  withProfiles?: boolean;
}

/**
 * Besoins clients, suggestions de profils et missions déjà créées, pour l'administration.
 * Expose l'état brut (le détail le modifie localement) et les lignes calculées de la liste.
 */
export function useNeeds({ clientUserId, withProfiles = false }: Options = {}) {
  const [needs, setNeeds] = useState<ClientNeed[]>([]);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [profiles, setProfiles] = useState<RecruiterProfile[]>([]);
  /** Suggestion → mission créée à partir d'elle. */
  const [missionBySuggestion, setMissionBySuggestion] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const current = ++requestId.current;
    let needsQuery = supabase.from("client_needs").select("*").order("created_at", { ascending: false });
    if (clientUserId) needsQuery = needsQuery.eq("user_id", clientUserId);
    const needsRes = await needsQuery;
    if (current !== requestId.current) return;
    if (needsRes.error) {
      setError(needsRes.error.message);
      setLoading(false);
      return;
    }
    const needRows = needsRes.data ?? [];
    const needIds = needRows.map((n) => n.id);

    let suggestionsQuery = supabase.from("profile_suggestions").select(SUGGESTION_COLUMNS);
    let missionsQuery = supabase.from("missions").select("id, suggestion_id");
    if (clientUserId) {
      // Fiche client : on se limite à ses besoins (liste vide si aucun).
      suggestionsQuery = suggestionsQuery.in("need_id", needIds.length ? needIds : ["00000000-0000-0000-0000-000000000000"]);
      missionsQuery = missionsQuery.in("need_id", needIds.length ? needIds : ["00000000-0000-0000-0000-000000000000"]);
    }
    const [suggestionsRes, missionsRes, profilesRes] = await Promise.all([
      suggestionsQuery,
      missionsQuery,
      withProfiles ? supabase.from("recruiter_profiles").select(PROFILE_COLUMNS) : Promise.resolve(null),
    ]);
    if (current !== requestId.current) return;

    setNeeds(needRows);
    setSuggestions(suggestionsRes.error ? [] : (suggestionsRes.data ?? []));
    setMissionBySuggestion(new Map((missionsRes.data ?? []).map((m) => [m.suggestion_id, m.id])));
    if (profilesRes && !profilesRes.error) setProfiles(profilesRes.data ?? []);
    setError(suggestionsRes.error?.message ?? null);
    setLoading(false);
  }, [clientUserId, withProfiles]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  const missionSuggestionIds = useMemo(() => new Set(missionBySuggestion.keys()), [missionBySuggestion]);

  const rows: NeedRow[] = useMemo(() => {
    const now = Date.now();
    return needs.map((n) => buildNeedRow(n, suggestions, missionSuggestionIds, now));
  }, [needs, suggestions, missionSuggestionIds]);

  return {
    needs, setNeeds,
    suggestions, setSuggestions,
    profiles,
    missionBySuggestion, setMissionBySuggestion,
    rows,
    loading, error,
    reload,
  };
}

export type NeedsData = ReturnType<typeof useNeeds>;
