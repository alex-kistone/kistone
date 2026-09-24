import { ADMIN_PILLS, ASSETS } from "@/content/home";
import { cn } from "@/lib/utils";

const ICONS: Record<(typeof ASSETS)[number]["icon"], JSX.Element> = {
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c1.9.7 3.1 2.5 3.5 5.2" />
    </>
  ),
  pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
};

export default function WhyMarketplace() {
  return (
    <section
      aria-label="Pourquoi la marketplace"
      className="mx-auto mt-24 grid max-w-ks gap-5 px-5 md:mt-[140px] md:grid-cols-2 md:px-8 lg:grid-cols-3 xl:px-0"
    >
      <article className="ks-lift ks-reveal relative flex min-h-[280px] flex-col justify-between gap-8 overflow-hidden rounded-[28px] bg-ks-dark p-8 text-ks-dark-fg md:col-span-2 md:p-10">
        <div
          className="pointer-events-none absolute -right-[90px] -top-[90px] h-[300px] w-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,46,110,0.32), rgba(255,46,110,0) 70%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3.5">
          <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Cadre clé en main</span>
          <h3 className="max-w-[600px] font-ks-display text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[38px]">
            Contrat, KYC, CRA, facturation. On gère l’administratif, vous gérez vos recrutements.
          </h3>
        </div>
        <ul className="relative flex flex-wrap gap-2 text-[13px]">
          {ADMIN_PILLS.map((p) => (
            <li key={p} className="rounded-full border border-[rgba(245,241,234,0.2)] px-3.5 py-[7px]">
              {p}
            </li>
          ))}
        </ul>
      </article>

      {ASSETS.map((a) => (
        <article
          key={a.title}
          className={cn(
            "ks-lift ks-reveal flex flex-col justify-between gap-8 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-8 shadow-ks-card",
            "featured" in a && a.featured ? "min-h-[280px]" : "min-h-[240px]",
          )}
        >
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-[14px]",
              "featured" in a && a.featured ? "bg-ks-pink-100" : "bg-ks-muted",
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#141312" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS[a.icon]}
            </svg>
          </span>
          <div>
            <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">{a.title}</h3>
            <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{a.desc}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
