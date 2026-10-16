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

/** Habillage du hero : cartes de la plateforme qui flottent de part et d'autre du titre (grands écrans). */
function HeroDecor() {
  const card = "rounded-[20px] border border-[rgba(20,19,18,0.06)] bg-white p-4 text-left shadow-[0_2px_4px_rgba(20,19,18,0.04),0_24px_48px_-24px_rgba(60,40,20,0.3)]";
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 hidden xl:block" aria-hidden="true">
      {/* Halo du dégradé derrière le titre */}
      <div className="absolute left-1/2 top-[120px] h-[420px] w-[880px] -translate-x-1/2 rounded-full opacity-[0.16] blur-[90px]" style={{ background: "linear-gradient(100deg, #8B5CF6, #5B6CFF 55%, #1F4FFF)" }} />

      {/* Le besoin du client */}
      <div className="absolute left-[2.5%] top-[36px] w-[230px] -rotate-[5deg]">
        <div className={`ks-float ${card}`}>
          <p className="font-ks-mono text-[10px] uppercase tracking-[0.14em] text-ks-subtle">Votre besoin</p>
          <p className="mt-1.5 text-[14px] font-semibold leading-snug">AI Engineer pour industrialiser notre RAG</p>
          <p className="mt-2 text-[12px] text-ks-subtle">6 mois · Paris hybride</p>
        </div>
      </div>

      {/* Le profil trouvé */}
      <div className="absolute right-[2.5%] top-[52px] w-[240px] rotate-[4deg]">
        <div className={`ks-float ${card}`} style={{ animationDelay: "-2s" }}>
          <div className="flex items-center gap-3">
            <img src="/people/lina.jpg" alt="" className="h-10 w-10 shrink-0 rounded-full object-cover object-top" style={{ background: "#DDE8F5" }} />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold">Lina N.</p>
              <p className="text-[12px] text-ks-subtle">AI Engineer · RAG</p>
            </div>
            <span className="ml-auto font-ks-display text-[20px] font-bold tracking-[-0.03em] ks-grad-cool-text">95%</span>
          </div>
          <div className="mt-3 h-[5px] rounded-full bg-ks-secondary">
            <div className="h-[5px] w-[95%] rounded-full ks-grad-cool-bg" />
          </div>
        </div>
      </div>

      {/* L'administratif géré */}
      <div className="absolute left-[4%] top-[400px] w-[210px] rotate-[3deg]">
        <div className={`ks-float ${card}`} style={{ animationDelay: "-4s" }}>
          {["Contrat signé", "KYC vérifié", "CRA validé"].map((t) => (
            <p key={t} className="flex items-center gap-2.5 py-1 text-[13px]">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md ks-grad-cool-bg">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              {t}
            </p>
          ))}
        </div>
      </div>

      {/* Le délai */}
      <div className="absolute right-[4.5%] top-[420px] w-[190px] -rotate-[4deg]">
        <div className={`ks-float ${card}`} style={{ animationDelay: "-3s" }}>
          <p className="font-ks-display text-[34px] font-bold leading-none tracking-[-0.05em]">48<span className="text-[18px] ks-grad-cool-text"> h</span></p>
          <p className="mt-1.5 text-[12px] leading-snug text-ks-subtle">pour un premier profil qualifié</p>
        </div>
      </div>
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
        <p className="ks-reveal font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle md:text-xs">{HERO.eyebrow}</p>
        <h1 className="ks-reveal mt-5 max-w-[1100px] font-ks-display text-[46px] font-bold leading-none tracking-[-0.05em] text-ks-ink md:mt-6 md:text-[64px] md:leading-[0.98] md:tracking-[-0.048em] lg:text-[84px] xl:text-[96px]">
          {HERO.titleLead} <span className="ks-grad-cool-text">{HERO.titleHighlight}</span>
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
