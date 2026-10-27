import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { AppProviders, AppRoutes } from "./App";
import { ROLE_PAGES, ROLES_UPDATED, rolePath } from "./content/roles";
import { MODEL_PAGES, modelPath } from "./content/models";
import { COMPARISON_PATH } from "./pages/ComparisonPage";
import { COMPARISON } from "./content/comparison";
import { BlogDataContext, type BlogPost } from "./lib/blog";

/** Pages publiques pré-rendues au build (à compléter à chaque nouvelle page du site). */
export const PRERENDER_ROUTES = ["/", "/besoin", "/privacy", ...ROLE_PAGES.map(rolePath), ...MODEL_PAGES.map(modelPath), "/freelances", "/pourquoi-kistone", "/ressources", COMPARISON_PATH];

/**
 * Date de dernière modification réelle des pages qui en ont une (sitemap.xml). Les autres pages
 * n'en déclarent pas : une date qui change à chaque déploiement n'apprend rien à Google.
 */
export const LASTMOD: Record<string, string> = {
  ...Object.fromEntries(ROLE_PAGES.map((r) => [rolePath(r), ROLES_UPDATED])),
  [COMPARISON_PATH]: COMPARISON.date,
};

/** Pages décrites dans llms.txt (résumé du site pour les moteurs IA), générées au build. */
export const LLMS_PAGES = [
  { path: "/", title: "Accueil", desc: "Réseau freelance d'experts IA : AI Engineers, AI Product et AI Leaders sélectionnés et qualifiés, en mission, en fractional ou en contract-to-hire, et des Tech Recruiters pour internaliser vos talents IA." },
  { path: "/besoin", title: "Partager un besoin", desc: "Décrire son besoin (famille d'expert IA ou Tech Recruiter, rythme, budget) pour recevoir un profil qualifié sous 48 h." },
  ...ROLE_PAGES.map((r) => ({ path: rolePath(r), title: r.seoTitle, desc: r.seoDescription })),
  ...MODEL_PAGES.map((m) => ({ path: modelPath(m), title: m.seoTitle, desc: m.seoDescription })),
  { path: "/pourquoi-kistone", title: "Pourquoi Kistone", desc: "La conviction d'Alexandre Guégo, fondateur : l'IA a totalement transformé la façon de travailler, et le freelance (mission, fractional, contract-to-hire) est le modèle pour accéder vite aux experts IA qualifiés." },
  { path: "/freelances", title: "Espace freelance", desc: "Rejoindre la communauté des freelances IA & RPO : missions qualifiées pour AI Engineers, AI Product, AI Leaders et Tech Recruiters, rémunération transparente payée chaque fin de mois, rythme au choix, contrat, CRA et facturation gérés. Inscription gratuite." },
  { path: "/ressources", title: "Ressources", desc: "Analyses et guides sur les projets IA, les formats d'intervention (mission freelance, fractional, contract-to-hire) et le recrutement des talents IA." },
  { path: COMPARISON_PATH, title: COMPARISON.seoTitle, desc: COMPARISON.seoDescription },
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
