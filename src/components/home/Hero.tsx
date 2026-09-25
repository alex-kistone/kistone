import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { HERO } from "@/content/home";
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
      <ul className="flex items-baseline gap-6 font-ks-display text-[22px] font-semibold tracking-[-0.02em] sm:gap-9 sm:text-[28px]" aria-label="Métiers">
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
    <section className="flex flex-col items-center px-5 pt-14 text-center md:pt-[88px]">
      <h1 className="ks-reveal max-w-[1100px] font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[64px] lg:text-[84px]">
        {HERO.title}
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
        <Cta href={ROUTES.studio} size="lg" variant="secondary">
          {HERO.secondary}
        </Cta>
      </div>
      <p className="mt-[18px] text-sm text-ks-subtle">{HERO.reassurance}</p>
    </section>
  );
}
