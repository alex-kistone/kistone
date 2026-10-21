import { useEffect, useState } from "react";
import { RECRUITERS } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";
import PersonAvatar from "./PersonAvatar";

const STEP_MS = 2400; // un nouveau profil toutes les 2,4 s
const VISIBLE = 4;
// Score d'illustration par profil (même ordre que RECRUITERS)
const SCORES = [94, 88, 91, 86, 93, 89, 90, 87, 92, 85, 95, 88];

/**
 * Colonne droite de la démo de l'accueil : un fil de matching en continu, toutes fonctions
 * confondues. Indépendant du besoin tapé à gauche : il montre la plateforme qui travaille.
 */
export default function MatchFeed() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((t) => t + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  // Le plus récent en haut
  const rows = Array.from({ length: VISIBLE }, (_, i) => {
    const n = tick - i + RECRUITERS.length * 100;
    return { key: tick - i, idx: n % RECRUITERS.length, fresh: i === 0 };
  });

  return (
    <div className="flex min-w-0 flex-col rounded-[24px] bg-ks-muted p-3 sm:p-4" aria-hidden="true">
      <div className="flex items-center px-2 pb-3 pt-1">
        <span className="flex items-center gap-2 whitespace-nowrap font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ks-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ks-success" />
          </span>
          Matching en direct
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-2.5 overflow-hidden">
        {rows.map(({ key, idx, fresh }, i) => {
          const r = RECRUITERS[idx];
          const p = palettes[r.palette];
          const score = SCORES[idx % SCORES.length];
          return (
            <li
              key={key}
              className={`flex items-center gap-3.5 rounded-[18px] bg-white p-3.5 shadow-[0_1px_2px_rgba(20,19,18,0.04)] transition-opacity duration-500 sm:p-4 ${fresh ? "ks-pop-in" : ""}`}
              style={{ opacity: 1 - i * 0.16 }}
            >
              <PersonAvatar r={r} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{r.name}</span>
                  <span className="shrink-0 text-[12px] font-semibold" style={{ color: p.ink }}>
                    {verticalOf(r.vertical).short}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-[12px] font-medium text-[#17663F] sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-ks-success" />
                    {r.rhythm}
                  </span>
                </div>
                <p className="truncate text-[13px] text-ks-subtle">{r.role} · {r.xp}</p>
                <div className="mt-2 h-[5px] rounded-full bg-ks-secondary">
                  <div className={`h-[5px] origin-left rounded-full bg-ks-pink ${fresh ? "ks-bar-fill" : ""}`} style={{ width: `${score}%` }} />
                </div>
              </div>
              <span className="shrink-0 font-ks-display text-[22px] font-semibold tracking-[-0.03em]">
                {score}
                <span className="text-[13px] text-ks-pink">%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
