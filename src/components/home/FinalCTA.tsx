import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { FINAL_CTA } from "@/content/home";

/** Dernier appel avant le pied de page (sombre) : grande carte blanche, deux portes d'entrée. */
export default function FinalCTA() {
  return (
    <div className="px-5 md:px-8 xl:px-0">
      <section
        aria-labelledby="final-cta-title"
        className="ks-reveal relative mx-auto mt-24 max-w-ks overflow-hidden rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white px-6 py-16 text-center shadow-ks-window md:mt-[140px] md:rounded-[36px] md:py-24"
      >
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(255,46,110,0.16), rgba(255,46,110,0))" }}
          aria-hidden="true"
        />
        <h2 id="final-cta-title" className="relative font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[72px]">
          {FINAL_CTA.title}
          <br />
          <span className="ks-highlight">{FINAL_CTA.titleEnd}</span>
        </h2>
        <p className="relative mx-auto mt-5 max-w-[520px] text-[17px] leading-[1.55] text-ks-soft md:text-lg">{FINAL_CTA.text}</p>
        <div className="relative mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Cta href={ROUTES.recruit} size="lg" arrow className="shadow-ks-pink">
            {FINAL_CTA.primary}
          </Cta>
          <Cta href={ROUTES.freelance} size="lg" variant="secondary">
            {FINAL_CTA.secondary}
          </Cta>
        </div>
      </section>
    </div>
  );
}
