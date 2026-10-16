import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { FINAL_CTA } from "@/content/home";
import { BoltWatermark } from "@/components/brand/Bolt";

/** Dernier appel avant le pied de page (sombre) : à même le fond crème, deux portes d'entrée. */
export default function FinalCTA() {
  return (
    <div className="px-5 md:px-8 xl:px-0">
      <section
        aria-labelledby="final-cta-title"
        className="isolate ks-reveal relative mx-auto mt-24 max-w-ks overflow-hidden px-6 py-16 text-center md:mt-[140px] md:py-24"
      >
        <BoltWatermark className="-bottom-20 -left-10 h-[360px] w-auto rotate-[-14deg]" />
        <h2 id="final-cta-title" className="relative font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[72px]">
          {FINAL_CTA.title.split("expert IA")[0]}<span className="ks-grad-text">expert IA</span>
          <br />
          {FINAL_CTA.titleEnd}
        </h2>
        <p className="relative mx-auto mt-5 max-w-[520px] text-[17px] leading-[1.55] text-ks-soft md:text-lg">{FINAL_CTA.text}</p>
        <div className="relative mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Cta href={ROUTES.recruit} variant="studio" size="lg" arrow>
            {FINAL_CTA.primary}
          </Cta>
          <Cta href={ROUTES.freelance} size="lg" variant="secondary">
            {FINAL_CTA.secondary}
          </Cta>
        </div>
      </section>
    </div>
  );
}
