import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { FINAL_CTA, HERO_CARDS } from "@/content/home";
import { BoltWatermark } from "@/components/brand/Bolt";
import { PersonPhoto } from "@/components/home/HeroCards";
import { palettes } from "@/lib/palettes";

/** Position des mini-cartes profils, de l'arrière vers l'avant. */
const STACK = ["translate-x-6 -rotate-[4deg]", "-translate-x-4 rotate-[2deg]", "translate-x-2 -rotate-[1deg]"];

/** Dernier appel avant le pied de page : bloc noir, éclair rose géant, profils disponibles. */
export default function FinalCTA() {
  return (
    <div className="px-5 md:px-8 xl:px-0">
      <section
        aria-labelledby="final-cta-title"
        className="ks-reveal relative isolate mx-auto mt-24 grid max-w-ks items-center gap-12 overflow-hidden rounded-[28px] bg-ks-dark px-7 py-14 text-ks-dark-fg md:mt-[140px] md:rounded-[36px] md:px-14 md:py-20 lg:grid-cols-[1.25fr_1fr]"
      >
        <BoltWatermark strokeWidth={14} className="-right-24 -top-32 h-[640px] w-auto rotate-[14deg] !text-ks-pink !opacity-[0.16]" />

        <div>
          <h2 id="final-cta-title" className="font-ks-display text-[40px] font-bold leading-[1.02] tracking-[-0.045em] md:text-[60px]">
            {FINAL_CTA.title}
            <br />
            <span className="ks-highlight">{FINAL_CTA.titleEnd}</span>
          </h2>
          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.55] text-ks-dark-muted md:text-lg">{FINAL_CTA.text}</p>
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Cta href={ROUTES.recruit} size="lg" arrow wipeClassName="bg-[#C21252]">
              {FINAL_CTA.primary}
            </Cta>
            <Cta href={ROUTES.freelance} size="lg" variant="ghost-dark">
              {FINAL_CTA.secondary}
            </Cta>
          </div>
        </div>

        {/* Profils disponibles (illustration, mêmes profils que le hero) */}
        <ul className="relative mx-auto flex w-full max-w-[380px] flex-col gap-3" aria-label="Profils disponibles">
          {HERO_CARDS.map((c, i) => {
            const p = palettes[c.palette];
            return (
              <li key={c.name} className={`flex items-center gap-3.5 rounded-[20px] bg-white p-3 pr-4 text-ks-ink shadow-[0_24px_40px_-24px_rgba(0,0,0,0.6)] ${STACK[i] ?? ""}`}>
                <PersonPhoto photo={c.photo} initials={c.initials} palette={c.palette} className="h-14 w-14 shrink-0 rounded-[14px]" textClass="text-[16px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-ks-display text-[17px] font-semibold tracking-[-0.02em]">{c.name}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: p.tint, color: p.ink }}>{c.chip}</span>
                  </div>
                  <p className="truncate text-[13px] text-ks-soft">{c.role}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E8F5EE] px-2.5 py-1 text-[11px] font-medium text-[#17663F]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2F9A63]" aria-hidden="true" />
                  {c.availability}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
