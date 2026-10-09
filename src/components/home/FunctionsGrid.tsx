import SectionTag from "@/components/site/SectionTag";
import SmartLink from "@/components/site/SmartLink";
import { ROUTES } from "@/content/site";
import { palettes } from "@/lib/palettes";
import { VERTICALS } from "@/lib/verticals";

/**
 * Les six fonctions de la plateforme : une carte teintée par fonction, qui ouvre le dépôt
 * de besoin avec la fonction déjà choisie (?fonction=cfo).
 */
export default function FunctionsGrid() {
  return (
    <section id="fonctions" className="mx-auto mt-24 flex max-w-ks scroll-mt-24 flex-col items-center px-5 text-center md:mt-[140px] md:px-8 xl:px-0">
      <SectionTag className="ks-reveal">Fonctions</SectionTag>
      <h2 className="ks-reveal mt-5 font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[72px]">
        Six fonctions clés.
        <br />
        Un seul partenaire.
      </h2>
      <p className="ks-reveal mt-[18px] text-[17px] leading-[1.5] text-ks-soft md:text-[19px]">
        Des experts seniors, à temps plein ou quelques jours par semaine.
      </p>
      <ul className="mt-14 grid w-full gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
        {VERTICALS.map((v, i) => {
          const p = palettes[v.palette];
          return (
            <li key={v.id} className="ks-reveal">
              <SmartLink
                href={`${ROUTES.recruit}?fonction=${v.id}`}
                className="ks-lift flex h-full flex-col rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card"
              >
                <div className="flex h-[120px] items-start justify-between rounded-[20px] p-[18px]" style={{ background: p.tint }}>
                  <span className="font-ks-display text-[44px] font-bold leading-none tracking-[-0.04em]" style={{ color: p.ink }}>
                    {v.short}
                  </span>
                  <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: p.ink }} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-5">
                  <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">{v.roles}</span>
                  <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">{v.label}</h3>
                  <p className="text-[15px] leading-[1.55] text-ks-soft">{v.description}</p>
                  <span className="mt-auto pt-3 text-sm font-semibold text-ks-ink">
                    Trouver un {v.id === "rpo" ? "recruteur" : v.short} <span aria-hidden="true">→</span>
                  </span>
                </div>
              </SmartLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
