import { palettes } from "@/lib/palettes";
import { BOOKING_HREF, USE_CASES, type UseCase } from "@/content/studio";
import { Arrow } from "./icons";
import MiniUi from "./MiniUis";

// Cercle décoratif : position propre à chaque carte (maquette).
const CIRCLE: Record<UseCase["kind"], string> = {
  budget: "-left-10 -bottom-[60px] h-40 w-40 md:h-[180px] md:w-[180px] opacity-[0.12]",
  freelances: "-right-[50px] -top-[50px] h-40 w-40 md:h-[180px] md:w-[180px] opacity-[0.14]",
  engagement: "-right-10 -bottom-[70px] h-[170px] w-[170px] md:h-[190px] md:w-[190px] opacity-[0.12]",
};

/** Carte de cas d'usage : teinte douce + mini-interface animée en boucle. */
export default function UseCaseCard({ u }: { u: UseCase }) {
  const p = palettes[u.palette];
  return (
    <article className="ks-uc ks-lift ks-reveal flex flex-col rounded-3xl border border-[rgba(20,19,18,0.06)] bg-white p-2.5 text-left shadow-ks-card md:rounded-[28px] md:p-3">
      <div
        className="relative flex h-[200px] items-center justify-center overflow-hidden rounded-[18px] p-[18px] md:h-[250px] md:rounded-[20px] md:p-6"
        style={{ background: p.tint }}
        aria-hidden="true"
      >
        <div className={`absolute rounded-full ${CIRCLE[u.kind]}`} style={{ background: p.accent }} />
        <div
          className="ks-ui relative w-full max-w-[460px] rounded-[14px] bg-white p-3.5 md:rounded-2xl md:p-[18px]"
          style={{ boxShadow: `0 16px 30px -18px ${p.ink}59` }}
        >
          <MiniUi kind={u.kind} />
        </div>
      </div>
      <div className="flex grow flex-col gap-1.5 px-2.5 pb-2.5 pt-4 md:gap-2 md:px-3 md:pb-3 md:pt-5">
        <div className="flex items-center gap-[7px] font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle md:gap-2">
          <span className="h-[7px] w-[7px] rounded-[2px] md:h-2 md:w-2 md:rounded-[3px]" style={{ background: p.accent }} aria-hidden="true" />
          {u.label}
        </div>
        <h3 className="font-ks-display text-[21px] font-semibold tracking-[-0.02em] md:text-2xl">{u.title}</h3>
        <p className="text-sm leading-normal text-ks-soft md:text-[15px] md:leading-[1.55]">{u.desc}</p>
        <ul className="mt-1.5 hidden flex-wrap gap-1.5 text-xs font-medium md:flex" style={{ color: p.ink }} aria-label="Fonctionnalités">
          {u.tags.map((t) => (
            <li key={t} className="rounded-full px-[11px] py-[5px]" style={{ background: p.soft }}>{t}</li>
          ))}
        </ul>
        <a
          href={BOOKING_HREF}
          className="ks-more mt-auto hidden items-center gap-1.5 pt-2.5 text-sm font-semibold text-ks-ink md:flex"
        >
          {USE_CASES.cta}
          <span className="sr-only"> : {u.title}</span>
          <Arrow className="ks-arrow" />
        </a>
      </div>
    </article>
  );
}
