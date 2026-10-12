import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { BRIEFS } from "@/content/home";
import MatchFeed from "./MatchFeed";
import { saveHomeBrief } from "@/lib/homeBrief";
import { detectVertical } from "@/lib/detectVertical";
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
 * Le visiteur peut aussi taper son propre besoin : « Déposer mon besoin » l'emmène sur
 * /besoin avec la fonction choisie et la fiche pré-remplie par l'IA.
 */
export default function BriefDemo() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [visible, setVisible] = useState(false);
  const [pinned, setPinned] = useState(false);
  // Besoin saisi par le visiteur (null tant qu'il n'a pas cliqué dans la zone)
  const [custom, setCustom] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const brief = BRIEFS[index];

  // La démo démarre quand elle entre à l'écran
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Frappe, puis critères, puis profils (arrêtée dès que le visiteur écrit lui-même)
  useEffect(() => {
    if (!visible || custom !== null) return;
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
  }, [index, visible, pinned, brief.text.length, custom]);

  const choose = (i: number) => {
    setPinned(true);
    setIndex(i);
  };

  const startTyping = () => {
    if (custom !== null) return;
    setPinned(true);
    setCustom("");
  };

  // Pendant la frappe, l'onglet suit la fonction citée (« un CTO… ») ; l'IA confirme sur /besoin
  const write = (text: string) => {
    setCustom(text);
    const v = detectVertical(text);
    const i = v ? BRIEFS.findIndex((b) => b.domain.toLowerCase() === v) : -1;
    if (i >= 0 && i !== index) setIndex(i);
  };

  // Avec un besoin tapé : fonction présélectionnée et fiche pré-remplie ; sinon, choix de la fonction
  const needHref = custom?.trim() ? `${ROUTES.recruit}?fonction=${brief.domain.toLowerCase()}` : ROUTES.recruit;
  const keepBrief = () => {
    if (custom?.trim()) saveHomeBrief(custom);
  };
  const submit = () => {
    keepBrief();
    navigate(needHref);
  };

  const own = custom !== null;
  const showCriteria = !own && phase !== "typing";

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
                <span className="text-ks-subtle">On trouve le profil.</span>
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

            <div className="rounded-[20px] border border-[rgba(20,19,18,0.08)] bg-ks-bg p-4 transition-colors focus-within:border-ks-pink sm:p-5">
              <label htmlFor="home-brief" className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">
                Votre besoin{!own && <span className="normal-case tracking-normal"> · cliquez pour écrire le vôtre</span>}
              </label>
              {/* Zone de saisie : d'abord la démo qui se tape seule, puis le texte du visiteur */}
              <textarea
                id="home-brief"
                value={own ? custom : brief.text.slice(0, typed)}
                onFocus={startTyping}
                onChange={(e) => write(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                placeholder={`Ex : ${brief.text}`}
                rows={4}
                className="mt-2 block min-h-[78px] w-full resize-none bg-transparent text-[16px] leading-[1.55] text-ks-ink outline-none placeholder:text-ks-subtle sm:text-[17px]"
              />
            </div>

            <Cta href={needHref} onClick={keepBrief} arrow className="-mt-1 self-start">
              Découvrir les profils
            </Cta>

            <div aria-live="polite">
              <p className={cn("flex items-center gap-2 text-sm font-medium transition-opacity duration-300", showCriteria ? "text-ks-ink" : "text-ks-subtle")}>
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", showCriteria ? "bg-ks-pink-100 text-ks-pink-ink" : "bg-ks-muted")}>
                  <SparkIcon />
                </span>
                {own ? "L'IA extraira les critères à l'étape suivante" : showCriteria ? "Critères extraits par l'IA" : "Analyse du besoin…"}
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

          {/* Matching en continu, indépendant du besoin tapé à gauche */}
          <MatchFeed />
        </div>
      </section>
    </div>
  );
}
