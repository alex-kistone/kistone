import Cta from "@/components/site/Cta";
import { BOOKING_HREF, HERO } from "@/content/studio";

export default function Hero() {
  return (
    <section className="flex flex-col items-center px-5 pt-12 text-center md:px-8 lg:pt-[88px]">
      <h1 className="ks-reveal font-ks-display text-[50px] font-bold leading-none tracking-[-0.05em] text-ks-ink md:text-[64px] md:leading-[0.98] md:tracking-[-0.048em] lg:text-[84px] xl:text-[100px]">
        {HERO.titleLine1} <br className="hidden lg:block" />
        {HERO.titleLead} <span className="ks-grad-text">{HERO.titleHighlight}</span>
      </h1>

      <p className="ks-reveal mt-5 max-w-[820px] text-[17px] leading-normal text-ks-soft md:mt-7 md:text-xl">{HERO.subtitle}</p>

      <div className="ks-reveal mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:gap-3 md:mt-10">
        <Cta href={BOOKING_HREF} variant="studio" size="lg" arrow className="h-[54px] sm:h-14">
          {HERO.primary}
        </Cta>
        <Cta href="#realisations" variant="secondary" size="lg" className="h-[54px] shadow-[0_1px_2px_rgba(20,19,18,0.05)] sm:h-14">
          {HERO.secondary}
        </Cta>
      </div>
      <p className="mt-3.5 text-[13px] text-ks-subtle md:mt-[18px] md:text-sm">{HERO.note}</p>
    </section>
  );
}
