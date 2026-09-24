import { KEY_FIGURES } from "@/content/studio";

/** Trois chiffres clés XXL (délais vérifiables uniquement), unités en rose. */
export default function KeyFigures() {
  return (
    <section className="mt-8 px-5 md:mt-16 md:px-8" aria-label="Chiffres clés">
      <div className="ks-reveal mx-auto grid max-w-ks border-t border-[rgba(20,19,18,0.08)] md:grid-cols-3 md:border-b">
        {KEY_FIGURES.map((f, i) => (
          <div
            key={f.label}
            className={`flex flex-col gap-2 border-b border-[rgba(20,19,18,0.08)] py-7 md:gap-3 md:border-b-0 md:px-6 md:py-12 lg:px-10 ${
              i < KEY_FIGURES.length - 1 ? "md:border-r" : ""
            }`}
          >
            <div className="whitespace-nowrap font-ks-display text-[80px] font-bold leading-[0.9] tracking-[-0.05em] xl:text-[112px]">
              {f.value}
              <span className="text-[36px] tracking-[-0.03em] text-ks-pink xl:text-5xl"> {f.unit}</span>
            </div>
            <div className="text-[15px] text-ks-soft md:text-base">{f.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
