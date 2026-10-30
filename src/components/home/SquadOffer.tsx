import Cta from "@/components/site/Cta";
import { Section } from "@/components/site/SectionHeader";
import { PinkGlow } from "@/components/site/PinkGlow";
import { BOOKING_URL } from "@/content/site";
import { SQUAD } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Squad IA : un AI Leader, un AI Engineer et un AI Product sur un même projet. */
export default function SquadOffer() {
  return (
    <Section id="squad">
      <div className="ks-reveal relative grid gap-10 overflow-hidden rounded-[28px] bg-ks-dark p-7 text-ks-dark-fg shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)] md:rounded-[36px] md:p-12 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:p-14">
        <PinkGlow className="-right-24 -top-24 h-[340px] w-[340px]" strength={0.4} />
        <div className="relative">
          <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">{SQUAD.label}</p>
          <h2 className="mt-4 font-ks-display text-[34px] font-bold leading-[1.02] tracking-[-0.045em] md:text-[48px]">{SQUAD.title}</h2>
          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.55] text-ks-dark-muted">{SQUAD.text}</p>
          <ul className="mt-7 flex flex-col gap-2.5 text-[15px]">
            {SQUAD.points.map((pt) => (
              <li key={pt} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md ks-grad-bg" aria-hidden="true">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                {pt}
              </li>
            ))}
          </ul>
          <Cta href={BOOKING_URL} variant="studio" size="lg" arrow className="mt-9">Composer ma squad en 30 minutes</Cta>
        </div>

        {/* La squad : trois membres, un projet */}
        <div className="relative flex flex-col justify-center gap-3" aria-label="Exemple de squad IA">
          {SQUAD.members.map((m, i) => {
            const v = verticalOf(m.vertical);
            const p = palettes[v.palette];
            return (
              <div
                key={m.vertical}
                className="flex items-center gap-4 rounded-[20px] border border-[rgba(245,241,234,0.1)] bg-[rgba(245,241,234,0.05)] p-4 md:p-5"
                style={{ marginLeft: `${i * 6}%` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-ks-display text-[13px] font-semibold" style={{ background: p.tint, color: p.ink }}>
                  {v.short.split(" ").map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-ks-display text-[18px] font-semibold tracking-[-0.02em]">{v.short}</p>
                  <p className="text-[13px] text-ks-dark-muted">{m.role}</p>
                </div>
                <span className="shrink-0 text-[13px] font-medium text-ks-dark-muted">{m.rhythm}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
