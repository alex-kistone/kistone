import { Helmet } from "react-helmet-async";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import { BoltWatermark } from "@/components/brand/Bolt";
import { ROLE_PAGES, rolePath } from "@/content/roles";
import { ROUTES } from "@/content/site";

/**
 * Page introuvable. Pré-rendue en dist/404.html et servie par Vercel avec le statut 404 : les
 * adresses inconnues ne sont pas indexées comme des pages (pas de « soft 404 »).
 */
const NotFound = () => (
  <SiteLayout>
    <Helmet>
      <title>Page introuvable | Kistone</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <section className="relative isolate mx-auto max-w-ks px-5 pb-10 pt-16 md:px-8 md:pt-24 xl:px-0">
      <BoltWatermark strokeWidth={14} className="-right-24 -top-24 h-[560px] w-auto rotate-[14deg]" />
      <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">Erreur 404</p>
      <h1 className="mt-4 max-w-[760px] font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] md:text-[64px]">Cette page n'existe pas.</h1>
      <p className="mt-5 max-w-[620px] text-lg leading-[1.5] text-ks-soft">Elle a peut-être changé d'adresse. Voici où trouver ce que vous cherchez.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Cta href="/" variant="studio" size="lg" arrow>Retour à l'accueil</Cta>
        <Cta href={ROUTES.recruit} size="lg" variant="secondary">Partager un besoin</Cta>
      </div>
      <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium">
        {ROLE_PAGES.map((r) => (
          <li key={r.slug}><a href={rolePath(r)} className="underline underline-offset-4 hover:text-ks-pink">{r.role}</a></li>
        ))}
      </ul>
    </section>
  </SiteLayout>
);

export default NotFound;
