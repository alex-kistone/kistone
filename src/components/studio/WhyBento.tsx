import { WHY, type WhyIcon } from "@/content/studio";
import { Bolt, Layers, Shield, Users } from "./icons";
import SectionHeader, { Section, TwoPartTitle } from "./SectionHeader";
import StrikeList from "./StrikeList";

const ICONS: Record<WhyIcon, typeof Shield> = { shield: Shield, bolt: Bolt, users: Users, layers: Layers };

/** Lueur rose discrète en coin (même rose, qui s'estompe : pas de dégradé de couleurs). */
export function PinkGlow({ className, strength = 0.35 }: { className: string; strength?: number }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(circle, rgba(255,46,110,${strength}), rgba(255,46,110,0) 70%)` }}
      aria-hidden="true"
    />
  );
}

export default function WhyBento() {
  return (
    <Section id="pourquoi">
      <SectionHeader tag={WHY.tag} title={<TwoPartTitle a={WHY.titleA} b={WHY.titleB} />} />
      <div className="mt-8 grid grid-cols-2 gap-3 text-left md:mt-14 md:gap-5 lg:grid-cols-3">
        <article className="ks-lift ks-reveal relative col-span-2 flex flex-col justify-between gap-5 overflow-hidden rounded-3xl bg-ks-dark p-[26px] text-ks-dark-fg shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)] md:min-h-[260px] md:gap-8 md:rounded-[28px] md:p-9">
          <PinkGlow className="-right-[70px] -top-[70px] h-[200px] w-[200px] md:-right-20 md:-top-20 md:h-[280px] md:w-[280px]" />
          <div className="relative flex flex-col gap-5 md:gap-3.5">
            <div className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">{WHY.lead.label}</div>
            <h3 className="max-w-[560px] font-ks-display text-[27px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-4xl md:leading-[1.08]">
              {WHY.lead.title}
            </h3>
          </div>
          <ul className="relative flex flex-wrap gap-1.5 text-xs md:gap-2 md:text-[13px]">
            {WHY.lead.roles.map((r) => (
              <li key={r} className="rounded-full border border-[rgba(245,241,234,0.2)] px-3 py-1.5 md:px-3.5 md:py-[7px]">{r}</li>
            ))}
          </ul>
        </article>

        {WHY.items.map((w) => {
          const Icon = ICONS[w.icon];
          return (
            <article
              key={w.title}
              className="ks-lift ks-reveal flex flex-col justify-between gap-8 rounded-[22px] border border-[rgba(20,19,18,0.06)] bg-white p-[18px] shadow-ks-card md:min-h-[240px] md:rounded-[28px] md:p-8 lg:[&:nth-child(2)]:min-h-[260px]"
            >
              <span
                className={`flex h-[38px] w-[38px] items-center justify-center rounded-xl md:h-11 md:w-11 md:rounded-[14px] ${w.highlight ? "bg-ks-pink-100" : "bg-ks-muted"}`}
                aria-hidden="true"
              >
                <span className="font-ks-mono text-xs md:hidden">{w.num}</span>
                <Icon className="hidden md:block" />
              </span>
              <div>
                <h3 className="font-ks-display text-lg font-semibold leading-[1.15] tracking-[-0.02em] md:text-[22px]">{w.title}</h3>
                <p className="mt-1.5 text-[13px] leading-normal text-ks-soft md:mt-2 md:text-[15px] md:leading-[1.55]">
                  <span className="md:hidden">{w.descMobile}</span>
                  <span className="hidden md:inline">{w.desc}</span>
                </p>
              </div>
            </article>
          );
        })}
      </div>
      <StrikeList />
    </Section>
  );
}
