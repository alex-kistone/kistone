import { useState } from "react";
import { HERO_CARDS, type HeroCard } from "@/content/home";
import { palettes, type PaletteName } from "@/lib/palettes";
import { cn } from "@/lib/utils";
import { BoltWatermark } from "@/components/brand/Bolt";

/** Photo d'un profil ; tant que le fichier manque, les initiales sur la teinte du profil. */
export function PersonPhoto({ photo, initials, palette, className, textClass }: {
  photo: string; initials: string; palette: PaletteName; className?: string; textClass?: string;
}) {
  const [missing, setMissing] = useState(false);
  const p = palettes[palette];
  if (missing) {
    return (
      <span className={cn("flex items-center justify-center font-ks-display font-semibold", className, textClass)} style={{ background: p.tint, color: p.ink }}>
        {initials}
      </span>
    );
  }
  return <img src={photo} alt="" loading="lazy" onError={() => setMissing(true)} className={cn("object-cover object-[50%_30%]", className)} />;
}

/** Position de chaque carte dans la pile (de l'arrière vers l'avant). */
const LAYOUT = [
  "left-0 top-0 -rotate-[4deg]",
  "left-[8%] top-[27%] -rotate-[3deg]",
  "left-[1%] top-[54%] -rotate-[2deg]",
];

function Card({ c, className }: { c: HeroCard; className: string }) {
  const p = palettes[c.palette];
  return (
    <article className={cn("absolute flex w-[86%] overflow-hidden rounded-[26px] bg-white shadow-[0_2px_4px_rgba(20,19,18,0.04),0_30px_60px_-28px_rgba(60,40,20,0.35)]", className)}>
      <PersonPhoto photo={c.photo} initials={c.initials} palette={c.palette} className="w-[24%] shrink-0 self-stretch" textClass="text-[26px]" />
      <div className="min-w-0 flex-1 px-5 pb-4 pt-5 text-left">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-semibold" style={{ color: p.ink }}>{c.chip}</span>
          <span className="truncate text-[13px] text-ks-soft">{c.role}</span>
        </div>
        <p className="mt-2.5 font-ks-display text-[26px] font-bold leading-none tracking-[-0.03em]">{c.name}</p>
        <p className="mt-1.5 text-[13px] text-ks-soft">{c.meta}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {c.tags.map((t) => (
            <li key={t} className="rounded-full bg-[#F1ECE5] px-2.5 py-1 text-[12px] text-ks-ink-2">{t}</li>
          ))}
        </ul>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[rgba(20,19,18,0.08)] pt-3">
          <div>
            <p className="text-[12px] text-ks-soft">Capacité</p>
            <p className="font-ks-display text-[17px] font-semibold tracking-[-0.02em]">{c.capacity}</p>
          </div>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-[#17663F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2F9A63]" aria-hidden="true" />
            {c.availability}
          </span>
        </div>
      </div>
    </article>
  );
}

/** Pile de cartes profils à droite du hero : chaque fonction, un expert senior. */
export default function HeroCards() {
  return (
    <div className="relative isolate mx-auto aspect-[564/640] w-full max-w-[520px]" aria-hidden="true">
      <BoltWatermark strokeWidth={14} className="left-1/2 top-1/2 h-[175%] w-auto -translate-x-1/2 -translate-y-1/2 rotate-[14deg] opacity-[0.09]" />
      {HERO_CARDS.map((c, i) => (
        <Card key={c.name} c={c} className={LAYOUT[i]} />
      ))}
    </div>
  );
}
