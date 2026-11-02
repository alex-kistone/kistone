import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { AppProviders, AppRoutes } from "./App";
import { ROLE_PAGES, ROLES_UPDATED, rolePath } from "./content/roles";
import { COMPARISON_PATH } from "./pages/ComparisonPage";
import { COMPARISON } from "./content/comparison";
import { STATIC_POSTS } from "./content/articles";
import { BlogDataContext, type BlogPost } from "./lib/blog";

/** Pages publiques pré-rendues au build (à compléter à chaque nouvelle page du site). */
export const PRERENDER_ROUTES = ["/", "/besoin", "/privacy", ...ROLE_PAGES.map(rolePath), "/freelances", "/pourquoi-kistone", "/ressources", COMPARISON_PATH,
  // Articles écrits dans le code (le comparatif a déjà sa page ci-dessus)
  ...STATIC_POSTS.filter((p) => p.slug !== COMPARISON.slug).map((p) => `/ressources/${p.slug}`)];

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
  { path: "/", title: "Accueil", desc: "Réseau de Freelance RPO : une communauté de 700+ recruteurs freelance sélectionnés et qualifiés, spécialisés par métier (Tech, Data, Product, Sales & Marketing, Finance, Industrie), le bon recruteur en 48 h." },
  { path: "/besoin", title: "Partager un besoin", desc: "Décrire son besoin de recrutement (métiers, rythme, budget) pour recevoir un recruteur freelance qualifié sous 48 h." },
  ...ROLE_PAGES.map((r) => ({ path: rolePath(r), title: r.seoTitle, desc: r.seoDescription })),
  { path: "/pourquoi-kistone", title: "Pourquoi Kistone", desc: "La conviction d'Alexandre Guégo, fondateur : l'IA transforme la fonction recrutement, le RPO complète l'équipe de manière ponctuelle et de nombreux recruteurs ont choisi le Freelance." },
  { path: "/freelances", title: "Espace freelance", desc: "Rejoindre la communauté des Freelance RPO : missions qualifiées pour recruteurs freelance, rémunération transparente payée chaque fin de mois, administratif géré." },
  { path: "/ressources", title: "Ressources", desc: "Analyses et guides sur le RPO freelance, la structuration de la fonction recrutement et le travail avec un recruteur freelance." },
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
