import SmartLink from "@/components/site/SmartLink";
import SectionHeader, { Section, TwoPartTitle } from "@/components/site/SectionHeader";
import { MODEL_PAGES, modelPath } from "@/content/models";
import { palettes } from "@/lib/palettes";

/** Les trois modèles d'intervention, avec leurs repères (rythme, durée), vers leur page. */
export default function ModelsTeaser() {
  return (
    <Section id="modeles">
      <SectionHeader
        title={<TwoPartTitle a="Mission, fractional ou contract-to-hire." b="Le format qui vous convient." />}
        subtitle="Vous choisissez le rythme et l'engagement ; on gère le contrat et l'administratif."
      />
      <div className="mt-8 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
        {MODEL_PAGES.map((m) => {
          const p = palettes[m.palette];
          return (
            <SmartLink
              key={m.slug}
              href={modelPath(m)}
              className="ks-uc ks-lift ks-reveal flex flex-col gap-6 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-7 shadow-ks-card md:p-8"
            >
              <span className="h-1.5 w-12 rounded-full" style={{ background: p.accent }} aria-hidden="true" />
              <div>
                <h3 className="font-ks-display text-[26px] font-semibold tracking-[-0.02em]">{m.name}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{m.short}</p>
              </div>
              <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-[rgba(20,19,18,0.06)] pt-5 text-[14px]">
                {m.facts.slice(0, 2).map((f) => (
                  <div key={f.label}>
                    <dt className="text-ks-subtle">{f.label}</dt>
                    <dd className="mt-0.5 font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
              <span className="ks-more flex items-center gap-1.5 text-[15px] font-semibold">
                Découvrir le modèle <span className="ks-arrow" aria-hidden="true">→</span>
              </span>
            </SmartLink>
          );
        })}
      </div>
    </Section>
  );
}
