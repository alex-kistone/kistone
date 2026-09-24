type T = { quote: string; name: string; role: string };

/** Témoignage client (placeholders tant que les citations réelles manquent). */
export default function TestimonialCard({ t, className = "" }: { t: T; className?: string }) {
  return (
    <figure
      className={`ks-lift ks-reveal flex flex-col gap-5 rounded-3xl border border-[rgba(20,19,18,0.06)] bg-white p-6 text-left shadow-ks-card md:gap-7 md:rounded-[28px] md:p-8 ${className}`}
    >
      <svg width="28" height="22" viewBox="0 0 28 22" className="h-[19px] w-6 md:h-[22px] md:w-7" aria-hidden="true">
        <path
          d="M0 22V13C0 5.8 3.6 1.4 10.8 0l1.4 3.4C8.3 4.6 6.4 7 6.2 10.4H11V22H0zm16 0V13C16 5.8 19.6 1.4 26.8 0l1.2 3.4c-3.9 1.2-5.8 3.6-6 7H27V22H16z"
          fill="#FF2E6E"
        />
      </svg>
      <blockquote className="grow text-base leading-[1.55] text-ks-ink md:text-lg">{t.quote}</blockquote>
      <figcaption className="flex items-center gap-3 border-t border-ks-line pt-4 md:gap-3.5 md:pt-5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-[rgba(20,19,18,0.25)] bg-ks-muted text-[9px] text-ks-subtle md:h-12 md:w-12 md:text-[10px]"
          aria-hidden="true"
        >
          Photo
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="text-sm font-semibold md:text-[15px]">{t.name}</span>
          <span className="text-[13px] text-ks-subtle md:text-sm">{t.role}</span>
        </span>
        <span
          className="flex h-[26px] shrink-0 items-center rounded-lg border border-dashed border-[rgba(20,19,18,0.25)] px-2 text-[10px] text-ks-subtle md:h-7 md:px-2.5 md:text-[11px]"
          aria-hidden="true"
        >
          Logo
        </span>
      </figcaption>
    </figure>
  );
}
