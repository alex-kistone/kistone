/**
 * Images de partage (og:image, 1200 × 630) des pages publiques, rendues par Chrome sans
 * interface à partir d'un gabarit HTML aux couleurs du site. Résultat dans public/og/*.png,
 * versionné : à relancer seulement quand un titre change.
 *
 * Usage : node scripts/og-images.mjs (Google Chrome installé dans /Applications).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public/og");
const chrome = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const logo = `data:image/png;base64,${readFileSync(join(root, "public/logos/logo-full-black.png")).toString("base64")}`;

// Teintes des familles (src/lib/palettes.ts)
const T = {
  blue: { tint: "#DDE8F5", accent: "#3D7BD0", ink: "#1E4F8F" },
  lilac: { tint: "#E8E2F6", accent: "#7357D6", ink: "#4B35A0" },
  teal: { tint: "#D5EDEA", accent: "#1F8F87", ink: "#16615C" },
  sage: { tint: "#DCEEDF", accent: "#2F9A63", ink: "#1B6541" },
  sand: { tint: "#F5ECCB", accent: "#C99A12", ink: "#6E5208" },
};

/** a = début du titre, b = fin en dégradé, items = vignette de droite (null = pas de vignette). */
const IMAGES = [
  { file: "default", a: "Votre prochain", b: "expert", c: "est déjà disponible.", label: "Réseau freelance IA & RPO", items: [["AI Engineer", T.blue], ["AI Product", T.lilac], ["AI Leader", T.teal], ["Tech Recruiter · RPO", T.sage]] },
  { file: "ai-engineer", a: "Recrutez un", b: "AI Engineer", c: "freelance.", label: "LLM · RAG · Agents · MLOps", tone: T.blue, items: ["LLM & IA générative", "RAG & recherche sémantique", "Agents IA", "MLOps / LLMOps"] },
  { file: "ai-product-manager", a: "Recrutez un", b: "AI Product Manager", c: "freelance.", label: "Product Manager IA · AI Designer", tone: T.lilac, items: ["Product Manager IA", "Product Owner produits LLM", "AI Designer / UX IA", "Discovery & cas d'usage IA"] },
  { file: "ai-leader", a: "Recrutez un", b: "AI Leader", c: "freelance.", label: "CTO · Head of AI · Chief AI Officer", tone: T.teal, items: ["CTO", "Head of AI", "Chief AI Officer", "Stratégie IA & GenAI"] },
  { file: "tech-recruiter", a: "Un", b: "Tech Recruiter", c: "intégré à vos équipes.", label: "RPO · Recruter vos talents IA en CDI", tone: T.sage, items: ["Data/IA", "Engineering", "Product", "Infra/Cloud", "Cyber", "GTM"] },
  { file: "modeles", a: "Mission, fractional ou", b: "contract-to-hire", c: ".", label: "Les modèles d'intervention", items: [["Mission freelance", T.blue], ["Fractional", T.teal], ["Contract-to-hire", T.lilac]] },
  { file: "freelances", a: "Rejoignez la communauté des", b: "freelances IA & RPO", c: ".", label: "Experts IA et Tech Recruiters", tone: T.sand, items: ["Missions qualifiées", "Rythme au choix", "Facturation gérée", "Paiement chaque fin de mois"] },
  { file: "comparatif", a: "Expert IA freelance :", b: "le comparatif", c: "des plateformes.", label: "Ressources · Comparatif 2026", items: null },
  { file: "pourquoi-kistone", a: "L'IA a changé le travail.", b: "Le freelance", c: "aussi.", label: "Pourquoi Kistone", items: null },
];

const bolt = (color, opacity) => `<svg viewBox="0 0 624 1024" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="22" stroke-linejoin="miter"><path d="M38 560 L488 18 L318 398"/><path d="M22 588 L346 416 L602 416 L280 588 Z"/><path d="M300 606 L132 1006 L590 444"/></svg>`;

function card(img) {
  if (!img.items) return "";
  const row = img.tone ? "rgba(255,255,255,.75)" : "#F5F1EA";
  const rows = img.items.map((it) => {
    const [text, tone] = Array.isArray(it) ? it : [it, img.tone];
    return `<li style="background:${row}"><span class="dot" style="background:${tone.accent}"></span>${text}</li>`;
  }).join("");
  const bg = img.tone ? img.tone.tint : "#FFFFFF";
  const ink = img.tone ? img.tone.ink : "#5E5A54";
  return `<div class="card" style="background:${bg}"><p class="mono" style="color:${ink}">${img.label}</p><ul>${rows}</ul></div>`;
}

function page(img) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=Geist:wght@500&family=Geist+Mono:wght@500&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:1200px;height:630px;overflow:hidden;background:#F5F1EA;font-family:Geist,sans-serif;color:#141312;position:relative}
.bolt{position:absolute;right:-60px;top:-80px;width:520px;transform:rotate(14deg)}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;gap:48px;align-items:center}
.left{flex:1.25;display:flex;flex-direction:column;height:100%}
.logo{height:44px;width:auto;align-self:flex-start}
h1{margin-top:auto;font-family:Outfit;font-weight:700;font-size:${img.items ? 66 : 82}px;line-height:1.02;letter-spacing:-0.045em}
.g{white-space:nowrap;background:linear-gradient(90deg,#FF2E6E,#B14DF5,#4C7DFF);-webkit-box-decoration-break:clone;box-decoration-break:clone;-webkit-background-clip:text;background-clip:text;color:transparent}
.foot{margin-top:28px;font-size:22px;color:#5E5A54}
.mono{font-family:'Geist Mono';font-size:15px;text-transform:uppercase;letter-spacing:0.14em}
.card{flex:1;border-radius:28px;padding:30px;box-shadow:0 1px 2px rgba(20,19,18,.04),0 18px 40px -24px rgba(60,40,20,.16)}
.card ul{list-style:none;margin-top:20px;display:flex;flex-direction:column;gap:12px}
.card li{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.75);border-radius:14px;padding:14px 18px;font-size:21px;color:#3D3A36}
.dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
</style></head><body>
<div class="bolt">${bolt("#141312", 0.06)}</div>
<div class="wrap"><div class="left">
<img class="logo" src="${logo}" alt="">
<h1>${img.a} <span class="g">${img.b}</span>${img.c.startsWith(".") ? "" : " "}${img.c}</h1>
<p class="foot">${img.items ? "kistone.fr" : `${img.label} · kistone.fr`}</p>
</div>${card(img)}</div></body></html>`;
}

mkdirSync(out, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "kistone-og-"));
for (const img of IMAGES) {
  const html = join(tmp, `${img.file}.html`);
  writeFileSync(html, page(img));
  execFileSync(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--window-size=1200,630", "--virtual-time-budget=4000", `--screenshot=${join(out, `${img.file}.png`)}`, `file://${html}`,
  ], { stdio: "ignore" });
  console.log(`public/og/${img.file}.png`);
}
