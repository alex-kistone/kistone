import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_PAGES } from "@/content/roles";
import { palettes } from "@/lib/palettes";
import { rhythmLabel, verticalOf } from "@/lib/verticals";
import { durationLabel } from "@/components/platform/MissionDurationField";
import type { PendingNeed } from "@/lib/pendingNeed";

type Featured = {
  display_name: string; job_title: string | null; years_experience: number | null; specialties: string[] | null;
  weekly_capacity: number | null; available: boolean | null; availability_date: string | null;
};
type Shown = { name: string; job: string; xp: number | null; specialties: string[]; days: number | null; available: boolean; sample: boolean };

const SHOWN = 3;
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/**
 * Aperçu des profils qui correspondent au besoin, avant la création du compte : les derniers
 * profils notés 4-5 étoiles de la famille (anonymisés, classés par spécialités en commun),
 * complétés par les exemples de la fiche de poste, signalés comme tels.
 */
function useMatchingProfiles(need: PendingNeed): { profiles: Shown[]; real: number } {
  const [featured, setFeatured] = useState<Featured[]>([]);
  useEffect(() => {
    let alive = true;
    supabase.rpc("list_featured_freelances" as never, { _vertical: need.vertical, _limit: 12 } as never).then(({ data }) => {
      if (alive && Array.isArray(data)) setFeatured(data as Featured[]);
    });
    return () => { alive = false; };
  }, [need.vertical]);

  return useMemo(() => {
    const wanted = new Set(need.vertical === "rpo" ? need.profile_types : need.specialties);
    const overlap = (s: string[]) => s.filter((x) => wanted.has(x)).length;
    const real: Shown[] = featured
      .map((f) => ({
        name: f.display_name, job: f.job_title || verticalOf(need.vertical).short, xp: f.years_experience,
        specialties: f.specialties ?? [], days: f.weekly_capacity, available: f.available !== false, sample: false,
      }))
      .sort((a, b) => overlap(b.specialties) - overlap(a.specialties))
      .slice(0, SHOWN);
    const samples: Shown[] = (ROLE_PAGES.find((r) => r.vertical === need.vertical)?.samples ?? [])
      .map((s) => ({ ...s, sample: true }));
    return { profiles: [...real, ...samples].slice(0, SHOWN), real: real.length };
  }, [featured, need]);
}

/** Récapitulatif du besoin et aperçu des profils, à gauche du formulaire de compte. */
export default function NeedProfilesPreview({ need }: { need: PendingNeed }) {
  const v = verticalOf(need.vertical);
  const p = palettes[v.palette];
  const { profiles, real } = useMatchingProfiles(need);
  const wanted = new Set(need.vertical === "rpo" ? need.profile_types : need.specialties);

  const facts = [
    need.budget_tjm_min || need.budget_tjm_max
      ? `${need.budget_tjm_min ?? "…"} – ${need.budget_tjm_max ?? "…"} € HT / jour`
      : null,
    rhythmLabel(need.days_per_week),
    need.duration_months ? durationLabel(need.duration_months) : null,
    need.mission_location || null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-5">
      {/* Le besoin */}
      <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm" aria-labelledby="recap-title">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: p.ink }}>{v.short}</p>
            <h2 id="recap-title" className="mt-1 font-heading text-[20px] font-semibold leading-tight tracking-[-0.02em]">{need.job_title || "Votre besoin"}</h2>
          </div>
          <Link to={`/besoin?fonction=${need.vertical}&edit=1`} className="shrink-0 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Modifier
          </Link>
        </div>
        {facts.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{facts.join(" · ")}</p>}
      </section>

      {/* Les profils */}
      <section aria-labelledby="preview-title">
        <h2 id="preview-title" className="font-heading text-[22px] font-semibold leading-tight tracking-[-0.02em]">
          {real > 0 ? "Des profils correspondent à votre besoin" : "Les profils que nous vous proposerons"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {real > 0
            ? "Profils qualifiés et notés par l'équipe Kistone, anonymisés jusqu'à la mise en relation."
            : "Des experts qualifiés en entretien, comme ceux-ci. Vos premiers profils arrivent sous 48 h."}
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {profiles.map((pr) => (
            <li key={pr.name} className="rounded-[20px] border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-heading text-[15px] font-semibold" style={{ background: p.tint, color: p.ink }} aria-hidden="true">
                  {initials(pr.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{pr.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{pr.job}{pr.xp ? ` · ${pr.xp} ans` : ""}</p>
                </div>
                {pr.sample
                  ? <span className="shrink-0 text-xs text-muted-foreground">Exemple</span>
                  : <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#17663F]"><span className="h-1.5 w-1.5 rounded-full bg-[#2F9A63]" aria-hidden="true" />{pr.available ? "Dispo" : "Bientôt dispo"}</span>}
              </div>
              {pr.specialties.length > 0 && (
                <p className="mt-2.5 text-[13px] text-muted-foreground">
                  {pr.specialties.slice(0, 3).map((s, i) => (
                    <span key={s}>
                      {i > 0 && " · "}
                      <span className={wanted.has(s) ? "font-semibold text-foreground" : undefined}>{s}</span>
                    </span>
                  ))}
                  <span> · {rhythmLabel(pr.days)}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
