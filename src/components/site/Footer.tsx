import { FOOTER_COLUMNS, ROUTES } from "@/content/site";
import Cta from "./Cta";
import Logo from "./Logo";
import SmartLink from "./SmartLink";
import { BoltWatermark } from "@/components/brand/Bolt";
import { openConsentBanner } from "@/lib/consent";

const LINKEDIN_URL = "https://www.linkedin.com/company/kistone-ai";

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden mx-3 mb-3 mt-24 rounded-[28px] bg-ks-dark px-6 pb-8 pt-12 text-ks-dark-fg md:mx-6 md:mb-6 md:mt-[140px] md:rounded-[36px] md:px-12 lg:px-[72px] lg:pt-14">
      <BoltWatermark tone="light" className="-bottom-32 -right-16 h-[560px] w-auto rotate-[14deg]" />
      <div className="mx-auto max-w-[1296px]">
        <div className="grid gap-12 lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 className="font-ks-display text-[36px] font-bold leading-[1.02] tracking-[-0.045em] md:text-[44px]">
              Les recruteurs <span className="ks-grad-text">RPO</span> dont vous avez besoin.
            </h2>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Cta href={ROUTES.recruit} variant="studio" className="h-[50px]">Trouver un recruteur</Cta>
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
          <Logo tone="dark" className="h-[44px]" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Kistone sur LinkedIn"
              className="inline-flex items-center gap-2 hover:text-ks-dark-fg"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-current">
                <path d="M20.45 2H3.55C2.7 2 2 2.7 2 3.55v16.9C2 21.3 2.7 22 3.55 22h16.9c.85 0 1.55-.7 1.55-1.55V3.55C22 2.7 21.3 2 20.45 2ZM8.06 19.04H5.08V9.5h2.98v9.54ZM6.57 8.2a1.73 1.73 0 1 1 0-3.46 1.73 1.73 0 0 1 0 3.46Zm12.47 10.84h-2.97v-4.64c0-1.1-.02-2.53-1.54-2.53-1.55 0-1.78 1.2-1.78 2.45v4.72H9.78V9.5h2.85v1.3h.04c.4-.75 1.37-1.54 2.82-1.54 3.01 0 3.57 1.98 3.57 4.56v5.22Z" />
              </svg>
              LinkedIn
            </a>
            <SmartLink href={ROUTES.login} className="hover:text-ks-dark-fg">Se connecter</SmartLink>
            <SmartLink href="/privacy" className="hover:text-ks-dark-fg">Confidentialité</SmartLink>
            <button type="button" onClick={openConsentBanner} className="hover:text-ks-dark-fg">Gérer les cookies</button>
            <span>© 2026 Kistone. Tous droits réservés.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
