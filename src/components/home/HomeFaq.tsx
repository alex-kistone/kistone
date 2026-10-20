import SectionHeader, { Section } from "@/components/studio/SectionHeader";
import { HOME_FAQ } from "@/content/home";

/**
 * Questions fréquentes de l'accueil. En <details> : les réponses restent dans le HTML pré-rendu,
 * lisibles par Google et les moteurs IA même repliées (données FAQPage posées par la page).
 */
export default function HomeFaq() {
  return (
    <Section id="faq">
      <SectionHeader title="Questions fréquentes." />
      <div className="ks-reveal mx-auto mt-8 max-w-[860px] divide-y divide-[rgba(20,19,18,0.08)] rounded-[24px] bg-white px-6 shadow-ks-card md:mt-14 md:px-8">
        {HOME_FAQ.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-ks-display text-[18px] font-semibold tracking-[-0.01em]">
              {f.q}
              <span className="text-ks-pink transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-[15px] leading-[1.6] text-ks-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
