import Cta from "@/components/site/Cta";
import SectionHeader, { Section, TwoPartTitle } from "@/components/site/SectionHeader";
import { CALENDLY_URL, ROUTES } from "@/content/site";
import { PAIN } from "@/content/home";
import { palettes } from "@/lib/palettes";

/**
 * Les situations qui amènent un client vers Kistone (urgence, expertise pointue, stratégie,
 * recrutements), chacune vers le dépôt de besoin. Un échange de 30 minutes pour qui hésite.
 */
export default function PainSituations() {
  return (
    <Section id="situations">
      <SectionHeader title={<TwoPartTitle a={PAIN.titleA} b={PAIN.titleB} />} subtitle={PAIN.subtitle} />
      <ul className="mt-8 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
        {PAIN.cards.map((c) => {
          const p = palettes[c.palette];
          return (
            <li key={c.tag} className="ks-lift ks-reveal flex flex-col gap-4 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-7 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: p.ink }}>{c.tag}</span>
              <h3 className="font-ks-display text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">{c.title}</h3>
              <p className="text-[15px] leading-[1.55] text-ks-soft">{c.desc}</p>
              <Cta href={c.vertical ? `${ROUTES.recruit}?fonction=${c.vertical}` : ROUTES.recruit} variant="secondary" arrow className="mt-auto self-start">
                {c.cta}
              </Cta>
            </li>
          );
        })}
      </ul>
      <p className="ks-reveal mt-8 text-center text-[15px] text-ks-soft md:text-base">
        Vous ne savez pas encore quel profil chercher ?{" "}
        <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-ks-ink underline decoration-[rgba(177,77,245,0.55)] decoration-2 underline-offset-4">
          Évaluons votre situation en 30 minutes
        </a>
      </p>
    </Section>
  );
}
