import { supabase } from "@/integrations/supabase/client";

/** Statuts d'une mission vus par l'administration (libellé et pastille). */
export const MISSION_STATUS: Record<string, { label: string; color: string }> = {
  onboarding: { label: "En mise en place", color: "bg-[#EDF3FB] text-[#1E4F8F]" },
  active: { label: "En cours", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  completed: { label: "Terminée", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

/** Fin de mission demandée par l'administration (confirmée au préalable). */
export type MissionEndAction = "completed" | "cancelled";

/** Change le statut d'une mission ; renvoie le message d'erreur, ou null si tout s'est bien passé. */
export async function setMissionStatus(missionId: string, status: MissionEndAction): Promise<string | null> {
  const { error } = await supabase.from("missions").update({ status }).eq("id", missionId);
  return error ? error.message : null;
}

/** Paramètre d'URL de l'onglet Missions qui ouvre le détail d'une mission. */
export const MISSION_PARAM = "mission";
