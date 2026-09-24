import { palettes } from "@/lib/palettes";
import type { CaseStudy } from "@/content/studio";
import { Clock } from "./icons";

/** Carte de réalisation client, teintée (jamais rose). */
export default function CaseStudyCard({ c }: { c: CaseStudy }) {
  const p = palettes[c.palette];
  return (
    <article className="ks-lift ks-reveal rounded-3xl border border-[rgba(20,19,18,0.06)] bg-white p-2.5 text-left shadow-ks-card md:rounded-[28px] md:p-3">
      <div
        className="relative flex h-[176px] items-end overflow-hidden rounded-[18px] px-[18px] pt-[50px] md:h-[212px] md:rounded-[20px] md:px-6 md:pt-14"
        style={{ background: p.tint }}
      >
        <div
          className="absolute -right-[30px] -top-[30px] h-[120px] w-[120px] rounded-full opacity-[0.14] md:-right-9 md:-top-9 md:h-[150px] md:w-[150px]"
          style={{ background: p.accent }}
          aria-hidden="true"
        />
        <div
          className="absolute left-3.5 top-3.5 flex h-[26px] items-center gap-1.5 rounded-full bg-white/70 px-2.5 text-[11px] font-medium md:left-4 md:top-4 md:h-7 md:gap-[7px] md:px-3 md:text-xs"
          style={{ color: p.ink }}
        >
          <span className="h-1.5 w-1.5 rounded-full md:h-[7px] md:w-[7px]" style={{ background: p.accent }} aria-hidden="true" />
          {c.category}
        </div>
        <div className="relative flex w-full flex-col gap-2.5 rounded-t-[14px] bg-white px-4 pb-[18px] pt-4 md:gap-3 md:rounded-t-2xl md:px-5 md:pb-5 md:pt-[18px]">
          <div className="font-ks-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: p.ink }}>
            Impact mesuré
          </div>
          <div className="font-ks-display text-xl font-semibold leading-[1.15] tracking-[-0.02em] lg:text-[22px]">{c.metric}</div>
          <div className="h-[5px] rounded-full md:h-1.5" style={{ background: p.soft }} aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: c.pct, background: p.accent }} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 px-2.5 pb-2.5 pt-4 md:gap-1.5 md:px-3 md:pb-3 md:pt-5">
        <div className="flex items-center gap-[7px] font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle md:gap-2">
          <span className="h-[7px] w-[7px] rounded-[2px] md:h-2 md:w-2 md:rounded-[3px]" style={{ background: p.accent }} aria-hidden="true" />
          {c.client}
        </div>
        <h3 className="font-ks-display text-[21px] font-semibold tracking-[-0.02em] md:text-2xl">{c.title}</h3>
        <div className="text-sm text-ks-soft md:text-[15px]">{c.meta}</div>
        <div
          className="mt-2 flex h-7 items-center gap-1.5 self-start rounded-full px-[11px] text-xs font-medium md:mt-2.5 md:h-[30px] md:px-3 md:text-[13px]"
          style={{ background: p.soft, color: p.ink }}
        >
          <Clock />
          {c.delay}
        </div>
      </div>
    </article>
  );
}
