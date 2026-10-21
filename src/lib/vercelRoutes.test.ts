import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_ROLE_SLUGS, ROLE_PAGES, rolePath } from "@/content/roles";
import { LEGACY_MODEL_SLUGS, MODEL_PAGES, modelPath } from "@/content/models";
import { LEGACY_COMPARISON_SLUG } from "@/content/comparison";

const root = join(__dirname, "../..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
  redirects: { source: string; destination: string }[];
  rewrites: { source: string; destination: string }[];
};
const app = readFileSync(join(root, "src/App.tsx"), "utf8");
const entry = readFileSync(join(root, "src/entry-server.tsx"), "utf8");

/** Motif Vercel (« /client/:path* », « /(a|b) ») vers une expression régulière. */
const toRegex = (source: string) =>
  new RegExp(`^${source.replace(/:\w+\*/g, ".*").replace(/:\w+/g, "[^/]+")}$`);
const rewritten = (path: string) => vercel.rewrites.some((r) => r.destination === "/app.html" && toRegex(r.source).test(path));

describe("vercel.json", () => {
  it("sert app.html pour toutes les routes de l'application non pré-rendues", () => {
    const routes = [...app.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1]);
    const prerendered = new Set(["/", "/besoin", "/privacy", "/freelances", "/pourquoi-kistone", "/ressources", ...ROLE_PAGES.map(rolePath), ...MODEL_PAGES.map(modelPath)]);
    expect(entry).toContain('"/besoin"');
    const dynamicPublic = ["/recruter/:slug", "/modeles/:slug"]; // slugs connus pré-rendus, anciens slugs redirigés
    const missing = routes
      .filter((r) => !prerendered.has(r) && !dynamicPublic.includes(r))
      .map((r) => r.replace(/:\w+/g, "x"))
      .filter((r) => !rewritten(r));
    expect(missing).toEqual([]);
  });

  it("redirige en 301 toutes les anciennes adresses", () => {
    const target = (from: string) => vercel.redirects.find((r) => r.source === from)?.destination;
    for (const [from, to] of Object.entries(LEGACY_ROLE_SLUGS)) expect(target(`/recruter/${from}`)).toBe(to ? `/recruter/${to}` : "/");
    for (const [from, to] of Object.entries(LEGACY_MODEL_SLUGS)) expect(target(`/modeles/${from}`)).toBe(`/modeles/${to}`);
    expect(target(`/ressources/${LEGACY_COMPARISON_SLUG}`)).toBe("/ressources/comparatif-plateformes-freelance-ia");
  });

  it("ne sert pas app.html aux adresses inconnues (vraie 404)", () => {
    expect(rewritten("/page-inexistante")).toBe(false);
    expect(rewritten("/recruter/inconnu")).toBe(false);
  });
});
