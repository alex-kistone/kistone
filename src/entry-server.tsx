import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { AppProviders, AppRoutes } from "./App";

/** Pages publiques pré-rendues au build (à compléter à chaque nouvelle page du site). */
export const PRERENDER_ROUTES = ["/", "/studio", "/besoin", "/privacy"];

/**
 * Pré-rendu des pages publiques (scripts/prerender.mjs) : HTML complet et balises <head>
 * de la page, pour que Google et les moteurs IA lisent le contenu sans exécuter le JavaScript.
 */
export function render(url: string) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <AppProviders>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </AppProviders>
    </HelmetProvider>,
  );
  const h = helmetContext.helmet;
  const head = h ? [h.title, h.meta, h.link, h.script].map((x) => x.toString()).join("\n    ") : "";
  return { html, head };
}
