import Cta from "@/components/site/Cta";
import SectionHeader, { Section, TwoPartTitle } from "@/components/studio/SectionHeader";
import { ROUTES } from "@/content/site";
import { ROLE_PAGES, rolePath } from "@/content/roles";
import { PinkGlow } from "@/components/studio/WhyBento";
import { INDICATIVE_BUDGET } from "@/lib/indicativeBudget";
import { palettes } from "@/lib/palettes";
import { METIERS } from "@/lib/taxonomy";
import { VERTICALS, type VerticalConfig } from "@/lib/verticals";

const pageOf = (v: VerticalConfig) => ROLE_PAGES.find((r) => r.vertical === v.id);

const euros = ([min, max]: [number, number]) => `${min.toLocaleString("fr-FR")} – ${max.toLocaleString("fr-FR")} € HT / jour`;

/** Ligne d'une famille d'experts IA : pastille teintée, nom, description, budget, liens. */
function FamilyRow({ v }: { v: VerticalConfig }) {
  const p = palettes[v.palette];
  const page = pageOf(v);
  return (
    <article className="ks-lift ks-reveal group relative flex items-start gap-4 rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-5 shadow-ks-card sm:items-center md:p-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl" style={{ background: p.tint }} aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-ks-display text-[22px] font-semibold leading-tight tracking-[-0.02em]">
          <a href={`${ROUTES.recruit}?fonction=${v.id}`} className="after:absolute after:inset-0 after:rounded-[24px] after:content-['']">{v.short}</a>
        </h3>
        <p className="mt-1 text-[15px] leading-[1.5] text-ks-soft">{v.description}</p>
        <p className="mt-2 text-[13px] font-medium" style={{ color: p.ink }}>{euros(INDICATIVE_BUDGET[v.id])}</p>
        {page && <a href={rolePath(page)} className="relative z-10 mt-2 inline-block text-[13px] font-medium text-ks-soft underline underline-offset-4 hover:text-ks-ink sm:hidden">Fiche de poste</a>}
      </div>
      <div className="relative z-10 hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ks-line-strong transition-colors group-hover:bg-ks-dark group-hover:text-ks-dark-fg" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
        {page && <a href={rolePath(page)} className="text-[13px] font-medium text-ks-soft underline underline-offset-4 hover:text-ks-ink">Fiche de poste</a>}
      </div>
    </article>
  );
}

/**
 * Les familles de la plateforme : à gauche les trois familles d'experts IA en mission, à droite
 * le Tech Recruiter (RPO) en tuile sombre pour recruter en CDI. Chaque entrée ouvre le dépôt de
 * besoin avec la famille choisie.
 */
export default function FunctionsGrid() {
  const ai = VERTICALS.filter((v) => v.group === "AI");
  const rpo = VERTICALS.find((v) => v.id === "rpo")!;
  const rpoPage = pageOf(rpo);
  const metiers = METIERS.filter((m) => m !== "Autre");
  return (
    <Section id="fonctions">
      <SectionHeader
        title={<TwoPartTitle a="Des experts IA pour vos projets." b="Un Tech Recruiter pour bâtir votre équipe." />}
        subtitle="En mission pour avancer vite, ou en CDI pour durer : le bon profil à chaque étape de votre projet IA."
      />
      <div className="mt-8 grid gap-4 md:mt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-5">
        <div className="flex flex-col gap-4">
          <p className="px-1 font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">En mission freelance</p>
          {ai.map((v) => <FamilyRow key={v.id} v={v} />)}
        </div>

        {/* Le RPO : recruter ses talents IA en CDI */}
        <article className="ks-reveal relative flex flex-col overflow-hidden rounded-[28px] bg-ks-dark p-7 text-ks-dark-fg shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)] md:p-9 lg:mt-[31px]">
          <PinkGlow className="-right-24 -top-24 h-[300px] w-[300px]" strength={0.35} />
          <div className="relative flex flex-1 flex-col">
            <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">Recruter en CDI · RPO</p>
            <h3 className="mt-4 font-ks-display text-[34px] font-bold leading-[1.02] tracking-[-0.04em] md:text-[42px]">Tech Recruiter</h3>
            <p className="mt-4 text-[16px] leading-[1.55] text-ks-dark-muted">
              Intégré à vos équipes pour internaliser vos talents IA. Facturé au jour, sans honoraires au placement.
            </p>
            <div className="mt-6 border-t border-[rgba(245,241,234,0.12)] pt-5">
              <p className="text-[13px] text-ks-dark-muted">Les profils recrutés</p>
              <p className="mt-1.5 text-[15px] font-medium">{metiers.join(" · ")}</p>
              <p className="mt-4 text-[13px] text-ks-dark-muted">Budget indicatif</p>
              <p className="mt-1.5 text-[15px] font-medium">{euros(INDICATIVE_BUDGET.rpo)}</p>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-8">
              <Cta href={`${ROUTES.recruit}?fonction=rpo`} variant="studio-fill" arrow>Je recherche un Tech Recruiter</Cta>
              {rpoPage && <Cta href={rolePath(rpoPage)} variant="ghost-dark">Fiche de poste</Cta>}
            </div>
          </div>
        </article>
      </div>
    </Section>
  );
}
