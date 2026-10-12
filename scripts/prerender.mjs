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
const { render, PRERENDER_ROUTES, LLMS_PAGES } = await import(pathToFileURL(join(root, "dist-ssr/entry-server.js")).href);

const template = readFileSync(join(dist, "index.html"), "utf8");
// Gabarit vierge pour les espaces connectés : servi tel quel pour toute route non pré-rendue.
writeFileSync(join(dist, "app.html"), template);

for (const route of PRERENDER_ROUTES) {
  const { html, head } = render(route);
  const page = template
    .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, head)
    .replace('<div id="root"></div>', `<div id="root" data-prerendered="${route}">${html}</div>`);
  const file = route === "/" ? join(dist, "index.html") : join(dist, route.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page);
  console.log(`pré-rendu ${route} (${Math.round(page.length / 1024)} ko)`);
}
// Plan du site pour les moteurs de recherche (hors pages d'application)
const SITE = "https://kistone.fr";
const today = new Date().toISOString().slice(0, 10);
const urls = PRERENDER_ROUTES.map((r) => `  <url><loc>${SITE}${r === "/" ? "/" : r}</loc><lastmod>${today}</lastmod></url>`).join("\n");
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`sitemap.xml (${PRERENDER_ROUTES.length} pages)`);

// Résumé du site pour les moteurs IA (https://llmstxt.org)
const llms = `# Kistone

> Plateforme Freelance · Fractional Leaders. Kistone met en relation les entreprises Tech & Digital avec des dirigeants et recruteurs freelance qualifiés, à temps plein ou quelques jours par semaine (fractional) : RPO, DRH, CFO, COO, CRO, CTO, CPO et CDO.

- Un premier profil présélectionné sous 48 h, un démarrage en une semaine en général.
- Facturation au jour (TJM), sans frais de recrutement ; contrat, conformité, CRA et facturation gérés par la plateforme.
- Les freelances sont qualifiés en entretien (parcours, expertise, références) et notés.

## Pages

${LLMS_PAGES.map((p) => `- [${p.title}](${SITE}${p.path}): ${p.desc}`).join("\n")}

## Optional

- [Politique de confidentialité](${SITE}/privacy): traitement des données personnelles.
`;
writeFileSync(join(dist, "llms.txt"), llms);
console.log("llms.txt");

rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
