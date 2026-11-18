import Cta from "@/components/site/Cta";
import SmartLink from "@/components/site/SmartLink";
import SectionHeader, { Section, TwoPartTitle } from "@/components/site/SectionHeader";
import { PinkGlow } from "@/components/site/PinkGlow";
import { ROUTES } from "@/content/site";
import { METIERS_RPO } from "@/content/home";
import { RPO_ROLE_PAGES, rolePath } from "@/content/roles";
import { INDICATIVE_BUDGET } from "@/lib/indicativeBudget";

/** Le RPO : un recruteur freelance intégré aux équipes du client pour recruter en CDI. */
function RpoTile() {
  const [min, max] = INDICATIVE_BUDGET.rpo;
  return (
    <article className="ks-reveal relative mt-8 grid gap-8 overflow-hidden rounded-[28px] bg-ks-dark p-7 text-ks-dark-fg shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)] md:mt-14 md:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:p-12">
      <PinkGlow className="-left-24 -top-24 h-[340px] w-[340px]" strength={0.35} />
      <div className="relative">
        <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">Recruter en CDI</p>
        <h3 className="mt-4 font-ks-display text-[56px] font-bold leading-[0.95] tracking-[-0.05em] md:text-[80px]">RPO</h3>
        <p className="mt-2 font-ks-display text-[20px] font-semibold tracking-[-0.02em] md:text-[24px]">Un recruteur freelance intégré à vos équipes.</p>
        <p className="mt-4 max-w-[520px] text-[16px] leading-[1.55] text-ks-dark-muted">
          Le Recruitment Process Outsourcing confie tout ou partie de vos recrutements à un recruteur spécialisé de vos métiers, qui travaille au sein de votre équipe, avec vos outils et votre marque employeur. Facturé au jour, sans honoraires au placement : {min} – {max} € HT / jour.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Cta href={ROUTES.recruit} variant="studio-fill" arrow>Je recherche un recruteur</Cta>
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
          <span className="text-ks-dark-muted">Fiches de poste :</span>
          {RPO_ROLE_PAGES.map((r) => (
            <SmartLink key={r.slug} href={rolePath(r)} className="font-medium underline underline-offset-4 hover:text-white">{r.role}</SmartLink>
          ))}
        </p>
      </div>

      {/* Illustration : les métiers recrutés en CDI, en verre sombre sur la tuile */}
      <div className="ks-ui relative overflow-hidden rounded-[20px] border border-[rgba(245,241,234,0.1)] bg-[rgba(245,241,234,0.05)] p-5 md:p-6" aria-hidden="true">
        <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Talents recrutés en CDI</p>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-[14px] sm:grid-cols-3">
          {METIERS_RPO.map((m) => (
            <li key={m} className="flex items-center gap-2.5 rounded-xl border border-[rgba(245,241,234,0.08)] bg-[rgba(245,241,234,0.06)] px-3 py-2.5 font-medium">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full ks-grad-bg" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** Le RPO en tuile sombre : ce que c'est, le budget, et les métiers couverts. */
export default function FunctionsGrid() {
  return (
    <Section id="fonctions">
      <SectionHeader
        title={<TwoPartTitle a="Un recruteur spécialisé." b="Sur chacun de vos métiers." />}
        subtitle="Intégré à vos équipes, pour recruter en CDI."
      />
      <RpoTile />
    </Section>
  );
}
