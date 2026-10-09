import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { HERO, HERO_TRUST, RECRUITERS } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { cn } from "@/lib/utils";

const STEP_MS = 2000;

/** Les métiers en toutes lettres ; un trait rose glisse de l'un à l'autre. Rien d'autre ne bouge. */
function FunctionsUnderline({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), STEP_MS);
    return () => window.clearInterval(id);
  }, [words.length]);

  // Position du trait sous le mot actif (recalculée au chargement des polices et au redimensionnement)
  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[index];
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index]);

  return (
    <div className="relative mt-7 inline-block pb-3">
      <ul className="flex items-baseline gap-[14px] font-ks-display text-[19px] font-semibold tracking-[-0.02em] sm:gap-9 sm:text-[28px]" aria-label="Métiers">
        {words.map((w, i) => (
          <li
            key={w}
            ref={(el) => (refs.current[i] = el)}
            className={cn("transition-colors duration-300", i === index ? "text-ks-ink" : "text-[#8F8980]")}
          >
            {w}
          </li>
        ))}
      </ul>
      <span
        className="absolute bottom-0 left-0 h-[3px] rounded-full bg-ks-pink transition-[transform,width] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
        style={bar ? { width: bar.width, transform: `translateX(${bar.left}px)` } : { width: 0 }}
        aria-hidden="true"
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="flex flex-col items-center px-5 pt-12 text-center md:pt-[72px]">
      {/* Badge hero : chip sombre + accroche */}
      <p className="ks-reveal mb-7 inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(20,19,18,0.08)] bg-white pl-1.5 pr-3.5 text-[13px] text-ks-ink-2 sm:gap-2.5 sm:pr-4 sm:text-sm shadow-[0_1px_2px_rgba(20,19,18,0.04)]">
        <span className="flex h-6 items-center gap-1.5 rounded-full bg-ks-dark px-2.5 font-ks-mono text-[10px] uppercase tracking-[0.14em] text-ks-dark-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-ks-pink" aria-hidden="true" />
          {HERO.badgeChip}
        </span>
        {HERO.reassurance}
      </p>
      <h1 className="ks-reveal max-w-[1100px] font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[64px] lg:text-[84px]">
        {HERO.title.split(HERO.titleHighlight).flatMap((part, i) =>
          i === 0
            ? [part]
            : [
                <span key={i} className="bg-[linear-gradient(transparent_62%,#F4AFC2_62%,#F4AFC2_94%,transparent_94%)] bg-no-repeat px-[0.04em] [box-decoration-break:clone]">
                  {HERO.titleHighlight}
                </span>,
                part,
              ],
        )}
        <br />
        <span className="text-[#8F8980]">{HERO.titleSecond}</span>
      </h1>

      <FunctionsUnderline words={HERO.functions} />

      <div className="ks-reveal mt-6 flex max-w-[760px] flex-col gap-3 text-lg leading-[1.5] text-ks-soft md:text-xl">
        {HERO.subtitle.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="ks-reveal mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Cta href={ROUTES.recruit} size="lg" arrow className="shadow-ks-pink">
          {HERO.primary}
        </Cta>
        <Cta href={ROUTES.freelance} size="lg" variant="secondary">
          {HERO.secondary}
        </Cta>
      </div>
      <HeroTrust />
    </section>
  );
}

/** Réassurance : pile d'avatars des recruteurs, communauté, promesses validées. */
function HeroTrust() {
  return (
    <div className="ks-reveal mt-8 flex flex-col items-center gap-3 text-sm text-ks-soft sm:flex-row sm:gap-5">
      <div className="flex items-center gap-3">
        <span className="flex -space-x-2.5" aria-hidden="true">
          {HERO_TRUST.avatars.map((initials) => {
            const r = RECRUITERS.find((x) => x.initials === initials)!;
            const p = palettes[r.palette];
            return (
              <span
                key={initials}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ks-bg font-ks-display text-[12px] font-semibold"
                style={{ background: p.tint, color: p.ink }}
              >
                {initials}
              </span>
            );
          })}
        </span>
        <span className="font-semibold text-ks-ink">{HERO_TRUST.lead}</span>
      </div>
      <ul className="flex items-center gap-4">
        {HERO_TRUST.points.map((pt) => (
          <li key={pt} className="flex items-center gap-1.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF2E6E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {pt}
          </li>
        ))}
      </ul>
    </div>
  );
}
