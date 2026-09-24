import { useState } from "react";
import SmartLink from "@/components/site/SmartLink";
import { ROUTES } from "@/content/site";
import { FILTERS, RECRUITERS, type Filter, type Recruiter } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { cn } from "@/lib/utils";

function RecruiterCard({ r, className }: { r: Recruiter; className?: string }) {
  const p = palettes[r.palette];
  return (
    <article className={cn("ks-lift flex flex-col gap-4 rounded-3xl border border-[rgba(20,19,18,0.08)] bg-white p-[22px] shadow-[0_1px_2px_rgba(20,19,18,0.04)]", className)}>
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full font-ks-display text-lg font-semibold"
          style={{ background: p.tint, color: p.ink }}
          aria-hidden="true"
        >
          {r.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold">{r.name}</h3>
          <p className="text-sm text-ks-subtle">{r.role}</p>
        </div>
        <span className="flex h-[26px] shrink-0 items-center gap-1.5 rounded-full bg-[#E8F5EE] px-2.5 text-xs font-medium text-[#17663F]">
          <span className="h-1.5 w-1.5 rounded-full bg-ks-success" aria-hidden="true" />
          {r.dispo}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2.5 text-[13px]">
        <div className="rounded-xl bg-ks-bg px-3 py-2.5">
          <dt className="text-ks-subtle">Expérience</dt>
          <dd className="mt-0.5 font-semibold">{r.xp}</dd>
        </div>
        <div className="rounded-xl bg-ks-bg px-3 py-2.5">
          <dt className="text-ks-subtle">Localisation</dt>
          <dd className="mt-0.5 font-semibold">{r.city}</dd>
        </div>
      </dl>
      <ul className="flex flex-wrap gap-1.5 text-xs font-medium" style={{ color: p.ink }} aria-label="Spécialités">
        {r.tags.map((t) => (
          <li key={t} className="rounded-full px-[11px] py-[5px]" style={{ background: p.soft }}>
            {t}
          </li>
        ))}
      </ul>
      <SmartLink
        href={ROUTES.recruit}
        className="ks-ghost mt-auto flex h-11 items-center justify-center rounded-full border border-ks-line-strong bg-white text-sm font-semibold"
      >
        Voir le profil<span className="sr-only"> de {r.name}</span>
      </SmartLink>
    </article>
  );
}

export default function MarketplacePreview() {
  const [filter, setFilter] = useState<Filter>("Tous");
  const shown = (filter === "Tous" ? RECRUITERS : RECRUITERS.filter((r) => r.domain === filter)).slice(0, 3);

  return (
    <div className="px-5 md:px-8">
      <section
        id="marketplace"
        aria-labelledby="marketplace-title"
        className="ks-reveal mx-auto mt-16 max-w-ks scroll-mt-24 overflow-hidden rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white shadow-ks-window md:rounded-[32px]"
      >
        <div className="flex h-11 items-center gap-[7px] border-b border-[rgba(20,19,18,0.06)] px-5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E6E0D6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E6E0D6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E6E0D6]" />
          <span className="mx-auto flex h-[26px] items-center rounded-full bg-ks-bg px-4 text-xs text-ks-subtle">kistone.fr/marketplace</span>
        </div>
        <div className="px-4 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="marketplace-title" className="font-ks-display text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">
                Trouvez votre recruteur RPO
              </h2>
              <p className="mt-1 text-sm text-ks-subtle">Freelances vérifiés, disponibles pour vos recrutements</p>
            </div>
            <div role="group" aria-label="Filtrer par expertise" className="flex gap-1.5 self-start overflow-x-auto rounded-full bg-ks-bg p-1 md:self-auto">
              {FILTERS.map((f) => {
                const on = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "h-9 shrink-0 whitespace-nowrap rounded-full px-3 text-sm sm:px-4 font-medium transition-colors",
                      on ? "bg-ks-dark text-ks-dark-fg" : "text-ks-ink-2 hover:bg-[rgba(20,19,18,0.05)]",
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {shown.map((r, i) => (
              // En tablette (2 colonnes), la 3e fiche resterait seule sur sa ligne
              <RecruiterCard key={r.name} r={r} className={i === 2 ? "md:hidden lg:flex" : undefined} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
