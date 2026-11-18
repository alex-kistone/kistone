import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROLES, rolePath } from "@/content/transition";
import { PRERENDER_ROUTES } from "@/entry-server";

const root = join(__dirname, "../..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
  redirects: { source: string; destination: string }[];
  rewrites: { source: string; destination: string }[];
};
const app = readFileSync(join(root, "src/App.tsx"), "utf8");

/** Motif Vercel (« /client/:path* », « /(a|b) ») vers une expression régulière. */
const toRegex = (source: string) =>
  new RegExp(`^${source.replace(/:\w+\*/g, ".*").replace(/:\w+/g, "[^/]+")}$`);
const rewritten = (path: string) => vercel.rewrites.some((r) => r.destination === "/app.html" && toRegex(r.source).test(path));
const redirected = (path: string) => vercel.redirects.some((r) => toRegex(r.source).test(path));

describe("vercel.json", () => {
  it("sert app.html pour toutes les routes de l'application non pré-rendues", () => {
    const routes = [...app.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1]);
    const prerendered = new Set(PRERENDER_ROUTES);
    const dynamicPublic = ["/expertises/:slug"]; // fiches connues pré-rendues
    const missing = routes
      .filter((r) => !prerendered.has(r) && !dynamicPublic.includes(r))
      .map((r) => r.replace(/:\w+/g, "x"))
      .filter((r) => !rewritten(r) && !redirected(r));
    expect(missing).toEqual([]);
  });

  it("pré-rend chaque fiche d'expertise", () => {
    for (const r of ROLES) expect(PRERENDER_ROUTES).toContain(rolePath(r));
  });

  it("redirige en 301 les anciennes pages du site RPO", () => {
    for (const path of ["/besoin", "/freelances", "/pourquoi-kistone", "/apport-affaires", "/recruter/tech-recruiter", "/ressources", "/ressources/un-article", "/modeles/x"]) {
      expect(redirected(path), path).toBe(true);
    }
  });

  it("ne sert pas app.html aux adresses inconnues (vraie 404)", () => {
    expect(rewritten("/page-inexistante")).toBe(false);
    expect(rewritten("/expertises/inconnu")).toBe(false);
  });
});
