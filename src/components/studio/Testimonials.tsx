import { TESTIMONIALS } from "@/content/studio";
import SectionHeader, { Section } from "./SectionHeader";
import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  return (
    <Section id="temoignages">
      <SectionHeader tag={TESTIMONIALS.tag} title={TESTIMONIALS.title} />
      <div className="mt-8 grid gap-3.5 md:mt-14 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {TESTIMONIALS.items.map((t, i) => (
          <TestimonialCard key={i} t={t} className={i === 2 ? "md:col-span-2 lg:col-span-1" : ""} />
        ))}
      </div>
    </Section>
  );
}
