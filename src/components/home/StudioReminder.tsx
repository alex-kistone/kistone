import Cta from "@/components/site/Cta";
import SectionTag from "@/components/site/SectionTag";
import { ROUTES } from "@/content/site";
import { STUDIO_TILES } from "@/content/home";
import { palettes } from "@/lib/palettes";

export default function StudioReminder() {
  return (
    <div className="px-5 md:px-8 xl:px-0">
      <section
        id="studio"
        aria-labelledby="studio-title"
        className="ks-reveal relative mx-auto mt-20 grid max-w-ks scroll-mt-24 items-center gap-10 overflow-hidden rounded-[28px] bg-ks-dark p-6 text-ks-dark-fg sm:p-10 md:mt-[120px] md:rounded-[36px] lg:grid-cols-2 lg:gap-14 lg:p-14"
      >
        <div
          className="pointer-events-none absolute -bottom-40 -left-[120px] h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(177,77,245,0.3), rgba(255,46,110,0.1) 45%, rgba(76,125,255,0) 72%)" }}
          aria-hidden="true"
        />
        <div className="relative">
          <SectionTag dark studio>We are AI-first</SectionTag>
          <h2 id="studio-title" className="mt-5 font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[60px]">
            Vos outils RH sur mesure. Livrés en 30 jours.
          </h2>
          <p className="mt-[18px] max-w-[480px] text-[17px] leading-[1.55] text-ks-dark-muted md:text-lg">
            Onboarding, assistant RH, tri de candidatures, budget, engagement. Un produit IA conçu pour vos équipes, sans DSI débordée.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Cta href={`${ROUTES.studio}#rdv`} variant="studio-fill" size="lg" arrow>
              Créer mon outil RH sur mesure
            </Cta>
            <Cta href={ROUTES.studio} size="lg" variant="ghost-dark">
              Découvrir le studio
            </Cta>
          </div>
        </div>
        <ul className="relative grid grid-cols-2 gap-3.5">
          {STUDIO_TILES.map((t) => {
            const p = palettes[t.palette];
            return (
              <li key={t.title} className="flex flex-col gap-[22px] rounded-[20px] p-[18px] text-ks-ink" style={{ background: p.tint }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/70" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.accent }} />
                </span>
                <div>
                  <h3 className="font-ks-display text-lg font-semibold tracking-[-0.02em]">{t.title}</h3>
                  <p className="mt-1 text-[13px]" style={{ color: p.ink }}>{t.desc}</p>
                </div>
                <div className="h-[5px] rounded-full bg-white/60" aria-hidden="true">
                  <div className="h-[5px] rounded-full" style={{ width: t.pct, background: p.accent }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
