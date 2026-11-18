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

// Articles publiés du blog (lecture publique) : pré-rendus avec leur contenu complet
function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(join(root, ".env"), "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^"|"$/g, "");
  } catch { return undefined; }
}
let posts = [];
try {
  const base = env("VITE_SUPABASE_URL"), key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  const res = await fetch(`${base}/rest/v1/blog_posts?status=eq.published&order=published_at.desc&select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (res.ok) posts = await res.json();
  else console.warn(`blog : articles non chargés (${res.status}), pages blog pré-rendues vides`);
} catch (e) {
  console.warn(`blog : articles non chargés (${e.message})`);
}
const ROUTES = [...PRERENDER_ROUTES, ...posts.map((p) => `/ressources/${p.slug}`)];
// Données injectées dans la page pour l'accueil et le blog (évite un écran de chargement)
const withData = (route) => route === "/" || route.startsWith("/ressources");
const dataScript = `<script type="application/json" id="ks-blog">${JSON.stringify(posts).replace(/</g, "\\u003c")}</script>`;

const template = readFileSync(join(dist, "index.html"), "utf8");
// Gabarit vierge pour les espaces connectés : servi tel quel pour toute route non pré-rendue.
writeFileSync(join(dist, "app.html"), template);

for (const route of ROUTES) {
  const { html, head } = render(route, posts);
  const page = template
    .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, head)
    .replace('<div id="root"></div>', `<div id="root" data-prerendered="${route}">${html}</div>${withData(route) ? dataScript : ""}`);
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
const lastmod = { ...LASTMOD, ...Object.fromEntries(posts.map((p) => [`/ressources/${p.slug}`, (p.updated_at || p.published_at || "").slice(0, 10)])) };
const urls = ROUTES.map((r) => `  <url><loc>${SITE}${r}</loc>${lastmod[r] ? `<lastmod>${lastmod[r]}</lastmod>` : ""}</url>`).join("\n");
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`sitemap.xml (${ROUTES.length} pages)`);

// Résumé du site pour les moteurs IA (https://llmstxt.org)
const llms = `# Kistone

> Réseau freelance d'experts IA. Kistone met en relation les entreprises avec des experts IA freelance sélectionnés et qualifiés, en mission, en fractional (quelques jours par semaine) ou en contract-to-hire : AI Engineers (LLM, RAG, agents, MLOps), AI Product (Product Managers IA, AI Designers) et AI Leaders (CTO, Head of AI, Chief AI Officer). Des Tech Recruiters freelance aident aussi les clients à internaliser leurs talents IA en CDI.

- Un premier profil présélectionné sous 48 h, un démarrage en une semaine en général.
- Facturation au jour (TJM), sans frais de recrutement ; contrat, conformité, CRA et facturation gérés par Kistone.
- Les freelances sont sélectionnés et qualifiés en entretien (parcours, projets IA, références) et notés.

## Pages

${LLMS_PAGES.map((p) => `- [${p.title}](${SITE}${p.path}): ${p.desc}`).join("\n")}
${posts.length ? `\n## Articles\n\n${posts.map((p) => `- [${p.title}](${SITE}/ressources/${p.slug}): ${p.seo_description || p.excerpt}`).join("\n")}\n` : ""}
## Optional

- [Politique de confidentialité](${SITE}/privacy): traitement des données personnelles.
`;
writeFileSync(join(dist, "llms.txt"), llms);
console.log("llms.txt");

rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
