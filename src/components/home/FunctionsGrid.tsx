import Cta from "@/components/site/Cta";
import SectionHeader, { Section, TwoPartTitle } from "@/components/studio/SectionHeader";
import { PinkGlow } from "@/components/studio/WhyBento";
import { ROUTES } from "@/content/site";
import { ROLE_PAGES, rolePath } from "@/content/roles";
import { INDICATIVE_BUDGET } from "@/lib/indicativeBudget";
import { palettes } from "@/lib/palettes";
import { VERTICALS, type VerticalConfig } from "@/lib/verticals";

/** Talents recrutés affichés sur la tuile RPO de l'accueil (liste validée par Alex le 2026-10-20). */
const RPO_TALENTS = ["Data/IA", "Engineering", "Product", "Infra/Cloud", "Cyber", "GTM"];

const pageOf = (v: VerticalConfig) => ROLE_PAGES.find((r) => r.vertical === v.id);

/** Carte d'une famille : visuel teinté (rôles et spécialités), titre, description, deux liens. */
function FamilyCard({ v }: { v: VerticalConfig }) {
  const p = palettes[v.palette];
  const page = pageOf(v);
  return (
    <article className="ks-uc ks-lift ks-reveal flex flex-col gap-5 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card">
      <div className="ks-ui relative overflow-hidden rounded-[20px] p-5" style={{ background: p.tint }}>
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.14]" style={{ background: p.accent }} aria-hidden="true" />
        <p className="relative font-ks-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: p.ink }}>{v.roles}</p>
        <ul className="relative mt-4 flex flex-col gap-2 text-[14px]">
          {v.specialties.slice(0, 4).map((s) => (
            <li key={s} className="flex items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2 text-ks-ink-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.accent }} aria-hidden="true" />
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
        <h3 className="font-ks-display text-[24px] font-semibold tracking-[-0.02em]">{v.short}</h3>
        <p className="text-[15px] leading-[1.55] text-ks-soft">{v.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Cta href={`${ROUTES.recruit}?fonction=${v.id}`} variant="studio" arrow>Je recherche {v.seeking}</Cta>
          {page && <Cta href={rolePath(page)} variant="secondary">Fiche de poste</Cta>}
        </div>
      </div>
    </article>
  );
}

/** Le RPO : un Tech Recruiter intégré aux équipes du client pour recruter ses talents IA en CDI. */
function RpoTile() {
  const rpo = VERTICALS.find((v) => v.id === "rpo")!;
  const page = pageOf(rpo);
  const [min, max] = INDICATIVE_BUDGET.rpo;
  return (
    <article className="ks-reveal relative mt-4 grid gap-8 overflow-hidden rounded-[28px] bg-ks-dark p-7 text-ks-dark-fg shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)] md:mt-5 md:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:p-12">
      <PinkGlow className="-left-24 -top-24 h-[340px] w-[340px]" strength={0.35} />
      <div className="relative">
        <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">Recruter en CDI</p>
        <h3 className="mt-4 font-ks-display text-[56px] font-bold leading-[0.95] tracking-[-0.05em] md:text-[80px]">RPO</h3>
        <p className="mt-2 font-ks-display text-[20px] font-semibold tracking-[-0.02em] md:text-[24px]">Un Tech Recruiter intégré à vos équipes.</p>
        <p className="mt-4 max-w-[520px] text-[16px] leading-[1.55] text-ks-dark-muted">
          Le Recruitment Process Outsourcing confie vos recrutements à un recruteur tech et IA qui travaille au sein de votre équipe, avec vos outils et votre marque employeur. Facturé au jour, sans honoraires au placement : {min} – {max} € HT / jour.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Cta href={`${ROUTES.recruit}?fonction=rpo`} variant="studio-fill" arrow>Je recherche un Tech Recruiter</Cta>
          {page && <Cta href={rolePath(page)} variant="ghost-dark">Fiche de poste</Cta>}
        </div>
      </div>

      {/* Illustration : les métiers recrutés en CDI, en verre sombre sur la tuile */}
      <div className="ks-ui relative overflow-hidden rounded-[20px] border border-[rgba(245,241,234,0.1)] bg-[rgba(245,241,234,0.05)] p-5 md:p-6" aria-hidden="true">
        <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Talents recrutés en CDI</p>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-[14px] sm:grid-cols-3">
          {RPO_TALENTS.map((m) => (
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

/**
 * Les familles de la plateforme : trois familles d'experts IA en mission, puis le RPO (un Tech
 * Recruiter pour recruter en CDI) en tuile sombre. Chaque carte ouvre le dépôt de besoin avec la
 * famille choisie.
 */
export default function FunctionsGrid() {
  const ai = VERTICALS.filter((v) => v.group === "AI");
  return (
    <Section id="fonctions">
      <SectionHeader
        title={<TwoPartTitle a="Une expertise IA." b="Une équipe à bâtir." />}
        subtitle="En mission pour avancer vite, en CDI pour durer."
      />
      <div className="mt-8 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
        {ai.map((v) => <FamilyCard key={v.id} v={v} />)}
      </div>
      <RpoTile />
    </Section>
  );
}
