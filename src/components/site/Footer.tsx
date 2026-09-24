import { FOOTER_COLUMNS, ROUTES } from "@/content/site";
import Cta from "./Cta";
import SmartLink from "./SmartLink";

export default function Footer() {
  return (
    <footer className="mx-3 mb-3 mt-24 rounded-[28px] bg-ks-dark px-6 pb-8 pt-12 text-ks-dark-fg md:mx-6 md:mb-6 md:mt-[140px] md:rounded-[36px] md:px-12 lg:px-[72px] lg:pt-14">
      <div className="mx-auto max-w-[1296px]">
        <div className="grid gap-12 lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 className="font-ks-display text-[36px] font-bold leading-[1.02] tracking-[-0.045em] md:text-[44px]">
              Votre partenaire RH augmenté.
            </h2>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Cta href={ROUTES.recruit} className="h-[50px]">Je recrute</Cta>
              <Cta href={ROUTES.freelance} variant="ghost-dark" className="h-[50px]">Je suis freelance</Cta>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[15px] sm:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3.5">
                <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">{col.title}</span>
                {col.links.map((l) => (
                  <SmartLink key={l.label} href={l.href} className="text-ks-dark-fg hover:text-white hover:underline">
                    {l.label}
                  </SmartLink>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-[rgba(245,241,234,0.12)] pt-6 text-sm text-ks-dark-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-ks-display text-xl font-semibold text-ks-dark-fg">Kistone</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <SmartLink href={ROUTES.login} className="hover:text-ks-dark-fg">Se connecter</SmartLink>
            <SmartLink href="/privacy" className="hover:text-ks-dark-fg">Confidentialité</SmartLink>
            <span>© 2026 Kistone. Tous droits réservés.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
