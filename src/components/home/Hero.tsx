import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { HERO, RECRUITERS, type Recruiter } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Carte profil du bandeau : initiales teintées, poste, famille, rythme et disponibilité. */
function ProfileCard({ r, hidden }: { r: Recruiter; hidden?: boolean }) {
  const p = palettes[r.palette];
  return (
    <div
      aria-hidden={hidden || undefined}
      className="mr-3 flex w-[260px] shrink-0 flex-col gap-3.5 rounded-[22px] border border-[rgba(20,19,18,0.06)] bg-white p-4 text-left shadow-ks-card md:mr-5 md:w-[300px] md:rounded-[26px] md:p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-ks-display text-[15px] font-semibold" style={{ background: p.tint, color: p.ink }}>
          {r.initials}
        </span>
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

/** Accueil : promesse centrée (style du studio), puis un bandeau de profils en boucle. */
export default function Hero() {
  return (
    <>
      <section className="flex flex-col items-center px-5 pt-12 text-center md:px-8 lg:pt-[88px]">
        <p className="ks-reveal font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle md:text-xs">{HERO.eyebrow}</p>
        <h1 className="ks-reveal mt-5 max-w-[1100px] font-ks-display text-[46px] font-bold leading-none tracking-[-0.05em] text-ks-ink md:mt-6 md:text-[64px] md:leading-[0.98] md:tracking-[-0.048em] lg:text-[84px] xl:text-[96px]">
          {HERO.titleLead} <span className="ks-grad-text">{HERO.titleHighlight}</span>
          <br className="hidden sm:block" /> {HERO.titleEnd}
        </h1>

        <p className="ks-reveal mt-5 max-w-[820px] text-[17px] leading-normal text-ks-soft md:mt-7 md:text-xl">{HERO.subtitle}</p>

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
      <div className="ks-marquee mt-11 pb-6 pt-1 md:mt-[72px] md:pb-10 md:pt-2" aria-label="Exemples de profils d'experts IA">
        <div className="ks-track ks-track-slow">
          {RECRUITERS.map((r) => <ProfileCard key={r.name} r={r} />)}
          {RECRUITERS.map((r) => <ProfileCard key={`${r.name}-dup`} r={r} hidden />)}
        </div>
      </div>
    </>
  );
}
