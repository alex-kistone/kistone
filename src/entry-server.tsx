import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { AppProviders, AppRoutes } from "./App";
import { BlogDataContext, type BlogPost } from "./lib/blog";
import { ROLES, rolePath } from "./content/transition";

/** Pages publiques pré-rendues au build (à compléter à chaque nouvelle page du site). */
export const PRERENDER_ROUTES = ["/", "/privacy", "/cgu", ...ROLES.map(rolePath)];

/** Date de dernière modification réelle des pages qui en ont une (sitemap.xml). */
export const LASTMOD: Record<string, string> = {};

/** Pages décrites dans llms.txt (résumé du site pour les moteurs IA), générées au build. */
export const LLMS_PAGES = [
  { path: "/", title: "Accueil", desc: "Cabinet de management de transition : des dirigeants expérimentés pour la direction générale et les fonctions clés, short-list sous 48 heures, prise de fonction sous une semaine." },
  ...ROLES.map((r) => ({ path: rolePath(r), title: r.title, desc: r.pitch })),
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
