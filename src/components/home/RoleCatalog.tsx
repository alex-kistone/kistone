import { useNavigate } from "react-router-dom";
import SectionHeader, { Section } from "@/components/site/SectionHeader";
import { ROUTES } from "@/content/site";
import { ROLE_CATALOG } from "@/content/home";
import { saveHomeBrief } from "@/lib/homeBrief";
import { palettes } from "@/lib/palettes";
import { INDICATIVE_BUDGET } from "@/lib/indicativeBudget";

/**
 * Les besoins les plus fréquents : un recruteur par métier en un clic. Le clic ouvre /besoin avec
 * la fiche pré-remplie par l'IA à partir de l'intitulé.
 */
export default function RoleCatalog() {
  const navigate = useNavigate();
  // Budget client indicatif, repris par l'IA dans la fiche
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const [lo, hi] = INDICATIVE_BUDGET.rpo;
  const pick = (role: string) => {
    saveHomeBrief(`Je recherche un ${role}. Budget TJM entre ${lo} et ${hi} € HT par jour.`);
    navigate(ROUTES.recruit);
  };
  return (
    <Section id="besoins">
      <SectionHeader
        title="Les besoins les plus fréquents."
        subtitle="Votre métier en un clic : le formulaire se pré-remplit, budget indicatif compris, vous ajustez en quelques secondes."
      />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-14 lg:grid-cols-3 lg:gap-4">
        {ROLE_CATALOG.map((role) => {
          return (
            <li key={role} className="ks-reveal">
              <button
                type="button"
                onClick={() => pick(role)}
                className="ks-uc group flex w-full items-center justify-between gap-4 rounded-[20px] border border-[rgba(20,19,18,0.06)] bg-white px-5 py-4 text-left shadow-ks-card transition-transform hover:-translate-y-0.5"
              >
                <span className="min-w-0">
                  <span className="block font-ks-display text-[18px] font-semibold tracking-[-0.02em]">{role}</span>
                  <span className="mt-0.5 block text-[13px] font-medium" style={{ color: palettes.sage.ink }}>RPO freelance</span>
                  <span className="mt-2 block text-[13px] text-ks-soft">
                    <span className="font-semibold text-ks-ink">{fmt(lo)} – {fmt(hi)} €</span> HT / jour
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
