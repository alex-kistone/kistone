import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { HERO } from "@/content/home";

export default function Hero() {
  return (
    <section className="flex flex-col items-center px-5 pt-14 text-center md:pt-[88px]">
      <div className="ks-reveal flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 rounded-[18px] border border-ks-line bg-white py-1.5 pl-1.5 pr-4 text-sm text-ks-ink-2 shadow-[0_1px_2px_rgba(20,19,18,0.04)] max-sm:pr-1.5 sm:rounded-full">
        <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-ks-dark px-2.5 font-ks-mono text-[11px] uppercase tracking-[0.08em] text-ks-dark-fg">
          <span className="h-[7px] w-[7px] rounded-full bg-ks-pink" aria-hidden="true" />
          {HERO.badge}
        </span>
        <span className="max-sm:pb-0.5">{HERO.badgeText}</span>
      </div>

      <h1 className="ks-reveal mt-8 font-ks-display text-[52px] font-bold leading-[0.98] tracking-[-0.048em] sm:text-[72px] lg:text-[96px]">
        {HERO.titleLine1}
        <br />
        <span className="ks-highlight">{HERO.titleLine2}</span>
      </h1>

      <p className="ks-reveal mt-7 max-w-[760px] text-lg leading-[1.5] text-ks-soft md:text-xl">{HERO.subtitle}</p>

      <div className="ks-reveal mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Cta href={ROUTES.recruit} size="lg" arrow className="shadow-ks-pink">
          {HERO.primary}
        </Cta>
        <Cta href={ROUTES.studio} size="lg" variant="secondary">
          {HERO.secondary}
        </Cta>
      </div>
      <p className="mt-[18px] text-sm text-ks-subtle">{HERO.reassurance}</p>
    </section>
  );
}
