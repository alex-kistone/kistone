import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { AppProviders, AppRoutes } from "./App";
import { ROLE_PAGES, rolePath } from "./content/roles";
import { BlogDataContext, type BlogPost } from "./lib/blog";

/** Pages publiques pré-rendues au build (à compléter à chaque nouvelle page du site). */
export const PRERENDER_ROUTES = ["/", "/studio", "/besoin", "/privacy", ...ROLE_PAGES.map(rolePath), "/ressources"];

/** Pages décrites dans llms.txt (résumé du site pour les moteurs IA), générées au build. */
export const LLMS_PAGES = [
  { path: "/", title: "Accueil", desc: "Plateforme Freelance · Fractional Leaders : dirigeants et recruteurs freelance (RPO, DRH, CFO, COO, CRO, CTO, CPO, CDO) pour les entreprises Tech & Digital, à temps plein ou quelques jours par semaine." },
  { path: "/besoin", title: "Partager un besoin", desc: "Décrire son besoin (fonction, rythme, budget) pour recevoir un profil présélectionné sous 48 h." },
  ...ROLE_PAGES.map((r) => ({ path: rolePath(r), title: r.seoTitle, desc: r.seoDescription })),
  { path: "/ressources", title: "Ressources", desc: "Guides et articles sur le recrutement freelance, le RPO et les dirigeants fractional." },
  { path: "/studio", title: "Studio IA", desc: "Outils RH sur mesure (onboarding, assistant RH, tri de candidatures) conçus et livrés par Kistone." },
];

/**
 * Pré-rendu des pages publiques (scripts/prerender.mjs) : HTML complet et balises <head>
 * de la page, pour que Google et les moteurs IA lisent le contenu sans exécuter le JavaScript.
 */
export function render(url: string, posts: BlogPost[] = []) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <BlogDataContext.Provider value={posts}>
        <AppProviders>
          <StaticRouter location={url}>
            <AppRoutes />
          </StaticRouter>
        </AppProviders>
      </BlogDataContext.Provider>
    </HelmetProvider>,
  );
  const h = helmetContext.helmet;
  const head = h ? [h.title, h.meta, h.link, h.script].map((x) => x.toString()).join("\n    ") : "";
  return { html, head };
}
