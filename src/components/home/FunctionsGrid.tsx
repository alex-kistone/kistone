import SmartLink from "@/components/site/SmartLink";
import SectionHeader, { Section, TwoPartTitle } from "@/components/studio/SectionHeader";
import { ROUTES } from "@/content/site";
import { ROLE_PAGES, rolePath } from "@/content/roles";
import { palettes } from "@/lib/palettes";
import { VERTICALS, type VerticalConfig } from "@/lib/verticals";

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
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-[15px] font-semibold">
          <SmartLink href={`${ROUTES.recruit}?fonction=${v.id}`} className="ks-more flex items-center gap-1.5">
            Je recherche {v.seeking.split(" ").slice(1).join(" ")} <span className="ks-arrow" aria-hidden="true">→</span>
          </SmartLink>
          {page && <SmartLink href={rolePath(page)} className="text-ks-subtle hover:text-ks-ink">Fiche de poste</SmartLink>}
        </div>
      </div>
    </article>
  );
}

/**
 * Les familles de la plateforme : trois familles d'experts IA, puis le Tech recruiter pour
 * internaliser les talents en CDI. Chaque carte ouvre le dépôt de besoin avec la famille choisie.
 */
export default function FunctionsGrid() {
  const ai = VERTICALS.filter((v) => v.group === "AI");
  const rpo = VERTICALS.find((v) => v.id === "rpo")!;
  const rpoPage = pageOf(rpo);
  return (
    <Section id="fonctions">
      <SectionHeader
        title={<TwoPartTitle a="Trois familles d'experts IA." b="Un seul partenaire." />}
        subtitle="Engineering, produit, leadership : le bon expert pour chaque étape de votre projet IA."
      />
      <div className="mt-8 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
        {ai.map((v) => <FamilyCard key={v.id} v={v} />)}
      </div>

      {/* Le RPO : internaliser les talents IA en CDI */}
      <div className="ks-reveal mt-4 flex flex-col gap-5 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-7 shadow-ks-card md:mt-5 md:flex-row md:items-center md:justify-between md:p-9">
        <div className="max-w-[640px]">
          <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: palettes[rpo.palette].ink }}>Recruter en CDI</p>
          <h3 className="mt-3 font-ks-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[30px]">
            Un Tech recruiter pour internaliser vos talents IA.
          </h3>
          <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft md:text-base">{rpo.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 text-[15px] font-semibold">
          <SmartLink href={`${ROUTES.recruit}?fonction=rpo`} className="ks-more flex items-center gap-1.5">
            Je recherche un Tech recruiter <span className="ks-arrow" aria-hidden="true">→</span>
          </SmartLink>
          {rpoPage && <SmartLink href={rolePath(rpoPage)} className="text-ks-subtle hover:text-ks-ink">Fiche de poste</SmartLink>}
        </div>
      </div>
    </Section>
  );
}
