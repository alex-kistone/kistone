import Cta from "@/components/site/Cta";
import { BOOKING_HREF, HERO } from "@/content/studio";

export default function Hero() {
  return (
    <section className="flex flex-col items-center px-5 pt-12 text-center md:px-8 lg:pt-[88px]">
      <div className="ks-reveal flex h-8 max-w-full items-center gap-2 rounded-full border border-ks-line bg-white pl-[5px] pr-3 text-[13px] text-ks-ink-2 shadow-[0_1px_2px_rgba(20,19,18,0.04)] md:h-9 md:gap-2.5 md:pl-1.5 md:pr-4 md:text-sm">
        <span className="flex h-[22px] shrink-0 items-center gap-1.5 rounded-full bg-ks-dark px-2 font-ks-mono text-[10px] uppercase tracking-[0.08em] text-ks-dark-fg md:h-6 md:px-2.5 md:text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full ks-grad-dot md:h-[7px] md:w-[7px]" aria-hidden="true" />
          Studio IA
        </span>
        <span className="truncate md:hidden">{HERO.badgeMobile}</span>
        <span className="hidden truncate md:inline">{HERO.badgeDesktop}</span>
      </div>

      <h1 className="ks-reveal mt-6 font-ks-display text-[50px] font-bold leading-none tracking-[-0.05em] text-ks-ink md:mt-8 md:text-[64px] md:leading-[0.98] md:tracking-[-0.048em] lg:text-[84px] xl:text-[100px]">
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
