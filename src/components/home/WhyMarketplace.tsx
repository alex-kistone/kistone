import { ADMIN_CHECKLIST, ASSETS } from "@/content/home";
import { cn } from "@/lib/utils";
import { BoltWatermark } from "@/components/brand/Bolt";
import AssetVisual from "./AssetVisuals";

export default function WhyMarketplace() {
  return (
    <section
      aria-label="Pourquoi Kistone"
      className="relative isolate mx-auto mt-24 grid max-w-ks gap-5 px-5 md:mt-[140px] md:grid-cols-2 md:px-8 lg:grid-cols-3 xl:px-0"
    >
      <BoltWatermark className="-bottom-28 right-[6%] h-[220px] w-auto rotate-[24deg]" />
      <article className="ks-lift ks-reveal relative flex min-h-[280px] flex-col justify-between gap-8 overflow-hidden rounded-[28px] bg-ks-dark p-8 text-ks-dark-fg md:col-span-2 md:p-10">
        <div
          className="pointer-events-none absolute -right-[90px] -top-[90px] h-[300px] w-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(177,77,245,0.35), rgba(255,46,110,0.12) 45%, rgba(76,125,255,0) 72%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3.5">
          <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Cadre clé en main</span>
          <h3 className="max-w-[600px] font-ks-display text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[38px]">
            Contrat, KYC, CRA, facturation. On gère l’administratif, vous pilotez votre croissance.
          </h3>
        </div>
        {/* La liste se coche toute seule, ligne après ligne, en boucle */}
        <ul className="relative grid gap-2.5 text-[14px] sm:grid-cols-2">
          {ADMIN_CHECKLIST.map((item, i) => (
            <li
              key={item}
              className="ks-check-row flex items-center gap-3 rounded-2xl border border-[rgba(245,241,234,0.12)] bg-[rgba(245,241,234,0.04)] px-3.5 py-3"
              style={{ animationDelay: `${i * 0.7}s` }}
            >
              <span
                className="ks-check-box flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                style={{ animationDelay: `${i * 0.7}s` }}
                aria-hidden="true"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path className="ks-check-mark" d="M5 12.5l4.5 4.5L19 7.5" style={{ animationDelay: `${i * 0.7}s` }} />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </article>

      {ASSETS.map((a) => (
        <article
          key={a.title}
          className={cn(
            "ks-lift ks-reveal flex flex-col gap-6 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card",
            "featured" in a && a.featured ? "min-h-[280px]" : "min-h-[240px]",
          )}
        >
          <AssetVisual icon={a.icon} />
          <div className="px-5 pb-5">
            <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">{a.title}</h3>
            <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{a.desc}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
