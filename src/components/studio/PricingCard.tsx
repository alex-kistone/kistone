import { cn } from "@/lib/utils";
import { BOOKING_HREF, PRICING, type Plan } from "@/content/studio";
import { Check } from "./icons";
import { PinkGlow } from "./WhyBento";

/** Carte tarif. L'offre mise en avant est sombre, badge + coches + CTA roses. */
export default function PricingCard({ plan, className }: { plan: Plan; className?: string }) {
  const dark = plan.featured;
  return (
    <article
      className={cn(
        "ks-lift ks-reveal relative flex flex-col overflow-hidden rounded-[28px] p-[26px] text-left md:rounded-[32px] md:p-9",
        dark
          ? "bg-ks-dark text-ks-dark-fg shadow-[0_30px_60px_-30px_rgba(20,19,18,0.6)]"
          : "border border-[rgba(20,19,18,0.06)] bg-white shadow-ks-card",
        className,
      )}
    >
      {dark ? <PinkGlow className="-bottom-[120px] -right-[120px] h-80 w-80" strength={0.28} /> : null}
      <div className="relative flex items-center justify-between gap-3">
        <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em] md:text-2xl">{plan.name}</h3>
        {plan.badge ? (
          <span className="flex h-[26px] items-center rounded-full ks-grad-bg px-2.5 font-ks-mono text-[10px] uppercase tracking-[0.12em] text-white md:h-7 md:px-3">
            {plan.badge}
          </span>
        ) : null}
      </div>
      <p className={cn("relative mt-1.5 text-sm md:text-[15px]", dark ? "text-ks-dark-muted" : "text-ks-soft")}>{plan.promise}</p>
      <div className="relative mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 md:mt-7 md:gap-x-2.5">
        <span className="whitespace-nowrap font-ks-display text-[52px] font-bold leading-none tracking-[-0.05em] md:text-[64px]">{plan.price}</span>
        <span className={cn("text-[13px] md:text-sm", dark ? "text-ks-dark-muted" : "text-ks-subtle")}>
          <span className="md:hidden">{plan.unitMobile}</span>
          <span className="hidden md:inline">{plan.unit}</span>
        </span>
      </div>
      <ul
        className={cn(
          "relative mt-5 flex grow flex-col gap-3 border-t pt-[18px] md:mt-7 md:gap-3.5 md:pt-6",
          dark ? "border-[rgba(245,241,234,0.12)]" : "border-[rgba(20,19,18,0.08)]",
        )}
      >
        {plan.items.map((it) => (
          <li key={it} className="flex items-center gap-2.5 text-[15px] md:gap-3">
            <Check size={16} className={cn("shrink-0", dark ? "text-[#C9A2FF]" : "text-ks-ink")} />
            {it}
          </li>
        ))}
      </ul>
      <a
        href={BOOKING_HREF}
        className={cn(
          "relative mt-6 flex h-[52px] items-center justify-center rounded-full text-base font-semibold md:mt-8 md:h-[54px]",
          dark
            ? "ks-btn ks-grad-bg text-white shadow-[0_14px_30px_-14px_rgba(120,90,220,0.7)]"
            : "ks-ghost border border-[rgba(20,19,18,0.14)] bg-white text-ks-ink",
        )}
      >
        {plan.cta}
      </a>
      <p className={cn("relative mt-3 text-center text-[13px] md:mt-3.5", dark ? "text-ks-dark-muted" : "text-ks-subtle")}>{PRICING.note}</p>
    </article>
  );
}
