/**
 * Pré-rendu des pages publiques après `vite build` : écrit dist/<page>/index.html avec le
 * contenu et les balises SEO de la page. Les autres routes (espaces connectés) restent servies
 * par dist/index.html comme une application classique.
 *
 * Usage : npm run build (enchaîne build client, build SSR et ce script).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const { render, PRERENDER_ROUTES, LLMS_PAGES, LASTMOD } = await import(pathToFileURL(join(root, "dist-ssr/entry-server.js")).href);

const ROUTES = PRERENDER_ROUTES;

const template = readFileSync(join(dist, "index.html"), "utf8");
// Gabarit vierge pour les espaces connectés : servi tel quel pour toute route non pré-rendue.
writeFileSync(join(dist, "app.html"), template);

for (const route of ROUTES) {
  const { html, head } = render(route);
  const page = template
    .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, head)
    .replace('<div id="root"></div>', `<div id="root" data-prerendered="${route}">${html}</div>`);
  const file = route === "/" ? join(dist, "index.html") : join(dist, route.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page);
  console.log(`pré-rendu ${route} (${Math.round(page.length / 1024)} ko)`);
}
// Page introuvable : servie par Vercel avec le statut 404 pour toute adresse inconnue
{
  const { html, head } = render("/404");
  const page = template.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, head).replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  writeFileSync(join(dist, "404.html"), page);
  console.log("404.html");
}

// Plan du site pour les moteurs de recherche (hors pages d'application)
const SITE = "https://kistone.fr";
const lastmod = LASTMOD;
const urls = ROUTES.map((r) => `  <url><loc>${SITE}${r}</loc>${lastmod[r] ? `<lastmod>${lastmod[r]}</lastmod>` : ""}</url>`).join("\n");
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`sitemap.xml (${ROUTES.length} pages)`);

// Résumé du site pour les moteurs IA (https://llmstxt.org)
const llms = `# Kistone

> Cabinet de management de transition. Kistone met à disposition des entreprises (PME, ETI, groupes) des managers de transition confirmés, par fonction : direction générale, finance, ressources humaines, logistique, commerce, marketing, juridique, RSE, DSI et innovation digitale, opérations industrielles, recrutement (RPO).

- Une short-list de managers sous 48 heures, une prise de fonction sous une semaine.
- Un associé référent par mission, un contrat tripartite, une lettre de mission et des objectifs écrits.
- Facturation au jour d'intervention, fixée lors du cadrage.

## Pages

${LLMS_PAGES.map((p) => `- [${p.title}](${SITE}${p.path}): ${p.desc}`).join("\n")}
## Optional

- [Politique de confidentialité](${SITE}/privacy): traitement des données personnelles.
`;
writeFileSync(join(dist, "llms.txt"), llms);
console.log("llms.txt");

rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
