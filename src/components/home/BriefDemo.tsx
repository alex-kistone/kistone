import { useEffect, useRef, useState } from "react";
import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { BRIEFS, RECRUITERS } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { cn } from "@/lib/utils";

const TYPE_MS = 24; // vitesse de frappe, par caractère
const HOLD_MS = 5200; // durée d'affichage du résultat avant l'exemple suivant

type Phase = "typing" | "criteria" | "matches";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
    </svg>
  );
}

/**
 * Démo du produit : un besoin se tape tout seul, l'IA en extrait les critères, puis les
 * recruteurs correspondants apparaissent avec leur score. Un onglet par métier ; la démo
 * enchaîne les exemples tant que le visiteur ne choisit pas lui-même.
 */
export default function BriefDemo() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [visible, setVisible] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const brief = BRIEFS[index];

  // La démo démarre quand elle entre à l'écran
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Frappe, puis critères, puis profils
  useEffect(() => {
    if (!visible) return;
    if (reducedMotion()) {
      setTyped(brief.text.length);
      setPhase("matches");
      return;
    }
    setTyped(0);
    setPhase("typing");
    let n = 0;
    const timers: number[] = [];
    const tick = window.setInterval(() => {
      n += 1;
      setTyped(n);
      if (n >= brief.text.length) {
        window.clearInterval(tick);
        timers.push(window.setTimeout(() => setPhase("criteria"), 350));
        timers.push(window.setTimeout(() => setPhase("matches"), 1300));
        if (!pinned) timers.push(window.setTimeout(() => setIndex((i) => (i + 1) % BRIEFS.length), 1300 + HOLD_MS));
      }
    }, TYPE_MS);
    return () => {
      window.clearInterval(tick);
      timers.forEach(window.clearTimeout);
    };
  }, [index, visible, pinned, brief.text.length]);

  const choose = (i: number) => {
    setPinned(true);
    setIndex(i);
  };

  const showCriteria = phase !== "typing";
  const showMatches = phase === "matches";

  return (
    <div className="px-5 md:px-8">
      <section
        ref={ref}
        id="marketplace"
        aria-labelledby="marketplace-title"
        className="ks-reveal mx-auto mt-16 max-w-ks scroll-mt-24 overflow-hidden rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white shadow-ks-window md:mt-20 md:rounded-[36px]"
      >
        <div className="flex h-11 items-center gap-[7px] border-b border-[rgba(20,19,18,0.06)] px-5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E6E0D6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E6E0D6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E6E0D6]" />
          <span className="mx-auto flex h-[26px] items-center rounded-full bg-ks-bg px-4 text-xs text-ks-subtle">kistone.fr/client · nouveau besoin</span>
        </div>

        <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:p-10">
          {/* Le besoin */}
          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <h2 id="marketplace-title" className="font-ks-display text-[26px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[34px]">
                Décrivez votre besoin.
                <br />
                <span className="text-ks-subtle">On trouve le recruteur.</span>
              </h2>
            </div>

            <div role="tablist" aria-label="Exemples de besoins" className="flex gap-1.5 self-start overflow-x-auto rounded-full bg-ks-bg p-1">
              {BRIEFS.map((b, i) => (
                <button
                  key={b.domain}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  onClick={() => choose(i)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                    i === index ? "bg-ks-dark text-ks-dark-fg" : "text-ks-ink-2 hover:bg-[rgba(20,19,18,0.05)]",
                  )}
                >
                  {b.domain}
                </button>
              ))}
            </div>

            <div className="rounded-[20px] border border-[rgba(20,19,18,0.08)] bg-ks-bg p-4 sm:p-5">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">Votre besoin</span>
              {/* Texte complet pour les lecteurs d'écran ; la frappe n'est qu'un effet visuel */}
              <p className="sr-only">{brief.text}</p>
              <p className="mt-2 min-h-[78px] text-[16px] leading-[1.55] text-ks-ink sm:text-[17px]" aria-hidden="true">
                {brief.text.slice(0, typed)}
                {phase === "typing" && <span className="ks-caret ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-ks-pink" />}
              </p>
            </div>

            <div aria-live="polite">
              <p className={cn("flex items-center gap-2 text-sm font-medium transition-opacity duration-300", showCriteria ? "text-ks-ink" : "text-ks-subtle")}>
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", showCriteria ? "bg-ks-pink-100 text-ks-pink-ink" : "bg-ks-muted")}>
                  <SparkIcon />
                </span>
                {showCriteria ? "Critères extraits par l'IA" : "Analyse du besoin…"}
              </p>
              <ul className="mt-3 flex min-h-[34px] flex-wrap gap-2" aria-label="Critères">
                {showCriteria &&
                  brief.criteria.map((c, i) => (
                    <li
                      key={`${brief.domain}-${c}`}
                      className="ks-pop-in rounded-full border border-[rgba(20,19,18,0.1)] bg-white px-3 py-1.5 text-[13px] font-medium"
                      style={{ animationDelay: `${i * 90}ms` }}
                    >
                      {c}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Les profils proposés */}
          <div className="flex min-w-0 flex-col rounded-[24px] bg-ks-muted p-3 sm:p-4">
            <div className="flex items-center justify-between px-2 pb-3 pt-1">
              <span className="whitespace-nowrap font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">Profils proposés</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ks-subtle">
                <span className={cn("h-1.5 w-1.5 rounded-full", showMatches ? "bg-ks-success" : "bg-[#CFC8BC]")} aria-hidden="true" />
                {showMatches ? <>3<span className="hidden sm:inline"> recruteurs</span> disponibles</> : "En attente"}
              </span>
            </div>
            <ul className="flex flex-1 flex-col gap-2.5" aria-live="polite">
              {brief.matches.map((m, i) => {
                const r = RECRUITERS.find((x) => x.name === m.name)!;
                const p = palettes[r.palette];
                return (
                  <li
                    key={`${brief.domain}-${m.name}`}
                    className={cn(
                      "flex items-center gap-3.5 rounded-[18px] bg-white p-3.5 shadow-[0_1px_2px_rgba(20,19,18,0.04)] transition-all duration-500 sm:p-4",
                      showMatches ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                    )}
                    style={{ transitionDelay: showMatches ? `${i * 140}ms` : "0ms" }}
                    aria-hidden={!showMatches}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-ks-display text-[15px] font-semibold"
                      style={{ background: p.tint, color: p.ink }}
                      aria-hidden="true"
                    >
                      {r.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold">{r.name}</span>
                        <span className="hidden h-5 shrink-0 items-center gap-1 rounded-full bg-[#E8F5EE] px-2 text-[11px] font-medium text-[#17663F] sm:flex">
                          <span className="h-1.5 w-1.5 rounded-full bg-ks-success" aria-hidden="true" />
                          Dispo
                        </span>
                      </div>
                      <p className="truncate text-[13px] text-ks-subtle">{r.role} · {r.xp}</p>
                      <div className="mt-2 h-[5px] rounded-full bg-ks-secondary" aria-hidden="true">
                        <div
                          className="h-[5px] rounded-full bg-ks-pink transition-[width] duration-700 ease-[cubic-bezier(.2,.7,.2,1)]"
                          style={{ width: showMatches ? `${m.score}%` : "0%", transitionDelay: `${i * 140 + 200}ms` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 font-ks-display text-[22px] font-semibold tracking-[-0.03em]">
                      {m.score}
                      <span className="text-[13px] text-ks-pink">%</span>
                      <span className="sr-only"> de correspondance</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <Cta href={ROUTES.recruit} arrow className="mt-3 w-full justify-center">
              Déposer mon besoin
            </Cta>
          </div>
        </div>
      </section>
    </div>
  );
}
