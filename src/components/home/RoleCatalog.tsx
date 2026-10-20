import { useNavigate } from "react-router-dom";
import SectionHeader, { Section } from "@/components/studio/SectionHeader";
import { ROUTES } from "@/content/site";
import { ROLE_CATALOG } from "@/content/home";
import { saveHomeBrief } from "@/lib/homeBrief";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";
import { INDICATIVE_BUDGET } from "@/lib/indicativeBudget";

/**
 * Les besoins les plus fréquents : un rôle précis en un clic. Le clic ouvre /besoin avec la
 * famille choisie et la fiche pré-remplie par l'IA à partir de l'intitulé.
 */
export default function RoleCatalog() {
  const navigate = useNavigate();
  // Budget client indicatif, repris par l'IA dans la fiche
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const pick = (role: string, vertical: string, [lo, hi]: [number, number]) => {
    saveHomeBrief(`Je recherche un ${role}. Budget TJM entre ${lo} et ${hi} € HT par jour.`);
    navigate(`${ROUTES.recruit}?fonction=${vertical}`);
  };
  return (
    <Section id="besoins">
      <SectionHeader
        title="Les besoins les plus fréquents."
        subtitle="Un rôle précis en un clic : le formulaire se pré-remplit, budget indicatif compris, vous ajustez en quelques secondes."
      />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-14 lg:grid-cols-3 lg:gap-4">
        {ROLE_CATALOG.map((r) => {
          const v = verticalOf(r.vertical);
          const p = palettes[v.palette];
          return (
            <li key={r.role} className="ks-reveal">
              <button
                type="button"
                onClick={() => pick(r.role, r.vertical, INDICATIVE_BUDGET[r.vertical])}
                className="ks-uc group flex w-full items-center justify-between gap-4 rounded-[20px] border border-[rgba(20,19,18,0.06)] bg-white px-5 py-4 text-left shadow-ks-card transition-transform hover:-translate-y-0.5"
              >
                <span className="min-w-0">
                  <span className="block font-ks-display text-[18px] font-semibold tracking-[-0.02em]">{r.role}</span>
                  <span className="mt-0.5 block text-[13px] font-medium" style={{ color: p.ink }}>{v.short}</span>
                  <span className="mt-2 block text-[13px] text-ks-soft">
                    <span className="font-semibold text-ks-ink">{fmt(INDICATIVE_BUDGET[r.vertical][0])} – {fmt(INDICATIVE_BUDGET[r.vertical][1])} €</span> HT / jour
                  </span>
                </span>
                <span className="ks-more flex shrink-0 items-center gap-1.5 text-[14px] font-semibold">
                  Je recherche <span className="ks-arrow" aria-hidden="true">→</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
