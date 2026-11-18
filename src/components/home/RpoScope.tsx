import SectionHeader, { Section, TwoPartTitle } from "@/components/site/SectionHeader";
import { RPO_SCOPE } from "@/content/home";

/** Ce que fait le recruteur : le recrutement de bout en bout, ou seulement une partie. */
export default function RpoScope() {
  return (
    <Section id="mission">
      <SectionHeader title={<TwoPartTitle a={RPO_SCOPE.titleA} b={RPO_SCOPE.titleB} />} subtitle={RPO_SCOPE.subtitle} />
      <ol className="mt-8 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {RPO_SCOPE.steps.map((s, i) => (
          <li key={s.title} className="ks-lift ks-reveal flex flex-col gap-3 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-7 shadow-ks-card">
            <span className="self-start font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">0{i + 1}</span>
            <h3 className="font-ks-display text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">{s.title}</h3>
            <p className="text-[15px] leading-[1.55] text-ks-soft">{s.desc}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
