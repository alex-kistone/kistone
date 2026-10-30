import Cta from "@/components/site/Cta";
import { BoltWatermark } from "@/components/brand/Bolt";
import { ROUTES } from "@/content/site";
import { HERO, RECRUITERS, type Recruiter } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";
import PersonAvatar from "./PersonAvatar";

/** Carte profil du bandeau : initiales teintées, poste, famille, rythme et disponibilité. */
function ProfileCard({ r, hidden }: { r: Recruiter; hidden?: boolean }) {
  const p = palettes[r.palette];
  return (
    <div
      aria-hidden={hidden || undefined}
      className="mr-3 flex w-[260px] shrink-0 flex-col gap-3.5 rounded-[22px] border border-[rgba(20,19,18,0.06)] bg-white p-4 text-left shadow-ks-card md:mr-5 md:w-[300px] md:rounded-[26px] md:p-5"
    >
      <div className="flex items-center gap-3">
        <PersonAvatar r={r} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{r.name}</p>
          <p className="truncate text-[13px] text-ks-subtle">{r.role}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(20,19,18,0.06)] pt-3 text-[13px]">
        <span className="font-semibold" style={{ color: p.ink }}>{verticalOf(r.vertical).short}</span>
        <span className="text-ks-soft">{r.xp} · {r.rhythm}</span>
        <span className="flex items-center gap-1.5 font-medium text-[#17663F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2F9A63]" aria-hidden="true" />
          Dispo
        </span>
      </div>
    </div>
  );
}

/** Habillage du hero : halo du dégradé derrière le titre (grands écrans). */
function HeroDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 hidden xl:block" aria-hidden="true">
      {/* Halo du dégradé derrière le titre */}
      <div className="absolute left-1/2 top-[120px] h-[420px] w-[880px] -translate-x-1/2 rounded-full opacity-[0.16] blur-[90px]" style={{ background: "linear-gradient(100deg, #FF2E6E, #B14DF5 55%, #4C7DFF)" }} />
    </div>
  );
}

/** Accueil : promesse centrée (style du studio), puis un bandeau de profils en boucle. */
export default function Hero() {
  return (
    <>
      <section className="relative isolate flex flex-col items-center px-5 pt-12 text-center md:px-8 lg:pt-[88px]">
        {/* Éclair géant en filigrane, qui déborde sur la droite */}
        <BoltWatermark strokeWidth={14} className="-right-40 -top-24 h-[620px] w-auto rotate-[14deg] md:-right-48 md:h-[880px]" />
        <HeroDecor />
        <h1 className="ks-reveal max-w-[1100px] font-ks-display text-[46px] font-bold leading-none tracking-[-0.05em] text-ks-ink md:mt-6 md:text-[64px] md:leading-[0.98] md:tracking-[-0.048em] lg:text-[84px] xl:text-[96px]">
          {HERO.titleLead}
          <br className="hidden sm:block" /> {HERO.titleBefore}<span className="ks-grad-text">{HERO.titleHighlight}</span>
        </h1>

        <p className="ks-reveal mt-5 max-w-[720px] text-[17px] leading-normal text-ks-soft md:mt-7 md:text-xl">
          {HERO.subtitle.split(new RegExp(`(${HERO.subtitleBold.join("|")})`)).map((part, i) =>
            HERO.subtitleBold.includes(part) ? <strong key={i} className="font-semibold text-ks-ink">{part}</strong> : part,
          )}
        </p>

        <div className="ks-reveal mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:gap-3 md:mt-10">
          <Cta href={ROUTES.recruit} variant="studio" size="lg" arrow className="h-[54px] sm:h-14">
            {HERO.primary}
          </Cta>
          <Cta href={ROUTES.freelance} variant="secondary" size="lg" className="h-[54px] shadow-[0_1px_2px_rgba(20,19,18,0.05)] sm:h-14">
            {HERO.secondary}
          </Cta>
        </div>
        <p className="mt-3.5 text-[13px] text-ks-subtle md:mt-[18px] md:text-sm">{HERO.note}</p>
      </section>

      {/* Profils d'illustration en boucle (60 s), pause au survol */}
      <div className="ks-marquee mt-11 pb-6 pt-1 md:mt-[72px] md:pb-10 md:pt-2" aria-label="Exemples de profils d'experts Data & IA">
        <div className="ks-track ks-track-slow">
          {RECRUITERS.map((r) => <ProfileCard key={r.name} r={r} />)}
          {RECRUITERS.map((r) => <ProfileCard key={`${r.name}-dup`} r={r} hidden />)}
        </div>
      </div>
    </>
  );
}
