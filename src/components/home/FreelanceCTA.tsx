import Cta from "@/components/site/Cta";
import { ROUTES } from "@/content/site";
import { FREELANCE_SPACE } from "@/content/home";

export default function FreelanceCTA() {
  return (
    <div className="px-5 md:px-8 xl:px-0">
      <section
        id="freelances"
        aria-labelledby="freelances-title"
        className="ks-reveal mx-auto mt-24 grid max-w-ks scroll-mt-24 items-center gap-10 rounded-[28px] bg-ks-secondary p-6 sm:p-10 md:mt-[140px] md:rounded-[36px] lg:grid-cols-2 lg:gap-14 lg:p-14"
      >
        <div>
          <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">Je suis recruteur freelance</span>
          <h2 id="freelances-title" className="mt-4 font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[56px]">
            Des missions RPO. Zéro administratif.
          </h2>
          <p className="mt-[18px] max-w-[480px] text-[17px] leading-[1.55] text-ks-soft md:text-lg">
            Rejoignez la marketplace : missions qualifiées, contrat, CRA et facturation gérés pour vous.
          </p>
          <Cta href={ROUTES.freelance} variant="dark" size="lg" arrow className="mt-7">
            Rejoindre la marketplace
          </Cta>
        </div>

        <div
          className="flex flex-col gap-1 rounded-3xl bg-white p-5 text-sm shadow-[0_24px_50px_-28px_rgba(60,40,20,0.3)] sm:p-6"
          aria-label="Aperçu de l’espace freelance"
          role="img"
        >
          <div className="flex justify-between border-b border-[rgba(20,19,18,0.06)] pb-3">
            <span className="font-semibold">Mon espace freelance</span>
            <span className="text-ks-subtle">Octobre</span>
          </div>
          {FREELANCE_SPACE.map((row, i) => (
            <div
              key={row.label}
              className={
                "flex min-h-[52px] items-center justify-between gap-3 py-2" +
                (i < FREELANCE_SPACE.length - 1 ? " border-b border-[rgba(20,19,18,0.05)]" : "")
              }
            >
              <span>{row.label}</span>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: row.bg, color: row.fg }}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
