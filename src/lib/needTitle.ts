import { supabase } from "@/integrations/supabase/client";
import { verticalOf, type Vertical } from "@/lib/verticals";
import { remoteLabel } from "@/components/platform/admin/needs/needsModel";

export type NeedTitleInput = {
  vertical: Vertical;
  profileTypes: string[];
  specialties: string[];
  days: number | null;
  location: string;
  remotePolicy: string;
  durationMonths: number | null;
  description: string | null;
};

/** Intitulé de secours, sans IA : « RPO Tech », « Fractional CFO », « CTO temps plein ». */
export function fallbackNeedTitle(n: Pick<NeedTitleInput, "vertical" | "profileTypes" | "days">): string {
  const v = verticalOf(n.vertical);
  if (v.id === "rpo") return n.profileTypes.length ? `RPO ${n.profileTypes.slice(0, 2).join(" & ")}` : "RPO";
  return n.days && n.days < 5 ? `Fractional ${v.short}` : `${v.short} temps plein`;
}

/**
 * Intitulé du besoin rédigé par l'IA à partir du formulaire (le client ne le saisit plus) ;
 * l'admin le retrouve tel quel. Repli sur un intitulé calculé si l'IA ne répond pas.
 */
export async function generateNeedTitle(n: NeedTitleInput): Promise<string> {
  const v = verticalOf(n.vertical);
  const brief = [
    `Fonction recherchée : ${v.short} (${v.roles}).`,
    v.id === "rpo" ? `Métiers à recruter : ${n.profileTypes.join(", ") || "non précisés"}.` : `Spécialités attendues : ${n.specialties.join(", ") || "non précisées"}.`,
    `Rythme : ${n.days && n.days < 5 ? `${n.days} jours par semaine` : "temps plein"}.`,
    n.location ? `Lieu : ${n.location} (${remoteLabel(n.remotePolicy)}).` : "",
    n.durationMonths ? `Durée : ${n.durationMonths} mois.` : "",
    n.description ? `Contexte : ${n.description}` : "",
  ].filter(Boolean).join("\n");
  try {
    const { data, error } = await supabase.functions.invoke("parse-need", { body: { freeText: brief } });
    const title = !error && typeof data?.job_title === "string" ? data.job_title.trim() : "";
    return title || fallbackNeedTitle(n);
  } catch {
    return fallbackNeedTitle(n);
  }
}
