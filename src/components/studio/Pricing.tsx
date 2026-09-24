import { PRICING } from "@/content/studio";
import PricingCard from "./PricingCard";
import SectionHeader, { Section } from "./SectionHeader";

export default function Pricing() {
  return (
    <Section id="tarifs">
      <SectionHeader tag={PRICING.tag} title={PRICING.title} subtitle={PRICING.subtitle} />
      <div className="mx-auto mt-8 grid max-w-[880px] gap-3.5 md:mt-14 md:grid-cols-2 md:gap-5">
        {PRICING.plans.map((plan) => (
          // En mobile, l'offre mise en avant passe en premier.
          <PricingCard key={plan.id} plan={plan} className={plan.featured ? "order-first md:order-none" : undefined} />
        ))}
      </div>
    </Section>
  );
}
