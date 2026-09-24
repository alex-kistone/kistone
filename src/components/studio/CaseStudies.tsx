import { CASES, USE_CASES } from "@/content/studio";
import CaseStudyCard from "./CaseStudyCard";
import SectionHeader, { Section, TwoPartTitle } from "./SectionHeader";
import UseCaseCard from "./UseCaseCard";

/** Réalisations clients + bloc « Et aussi, sur mesure » (cas d'usage). */
export default function CaseStudies() {
  return (
    <Section id="realisations">
      <SectionHeader tag={CASES.tag} title={<TwoPartTitle a={CASES.titleA} b={CASES.titleB} />} subtitle={CASES.subtitle} />
      <div className="mt-8 grid gap-3.5 md:mt-14 md:grid-cols-3 md:gap-4 lg:gap-5">
        {CASES.items.map((c) => (
          <CaseStudyCard key={c.client} c={c} />
        ))}
      </div>

      <div className="ks-reveal mt-12 flex flex-col gap-4 md:mt-20 md:flex-row md:items-end md:justify-between md:gap-10">
        <div>
          <div className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">{USE_CASES.eyebrow}</div>
          <h3 className="mt-2.5 font-ks-display text-[30px] font-bold leading-[1.05] tracking-[-0.04em] md:mt-3 md:text-[36px] md:leading-[1.02] lg:text-[44px]">
            {USE_CASES.title}
          </h3>
        </div>
        <p className="hidden max-w-[380px] text-base leading-[1.55] text-ks-soft md:block">{USE_CASES.intro}</p>
      </div>
      <div className="mt-5 grid gap-3.5 md:mt-8 md:grid-cols-2 md:gap-5 xl:grid-cols-3 md:[&>*:last-child]:col-span-2 xl:[&>*:last-child]:col-span-1">
        {USE_CASES.items.map((u) => (
          <UseCaseCard key={u.kind} u={u} />
        ))}
      </div>
    </Section>
  );
}
