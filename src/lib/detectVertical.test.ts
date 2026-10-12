import { describe, expect, it } from "vitest";
import { detectVertical } from "./detectVertical";

describe("detectVertical", () => {
  it("reconnaît la fonction citée", () => {
    expect(detectVertical("Un CTO Part-time pour nous aider à mettre en place des agents IA")).toBe("cto");
    expect(detectVertical("On cherche un DAF à temps partagé")).toBe("cfo");
    expect(detectVertical("Besoin d'une directrice commerciale pour ouvrir l'Allemagne")).toBe("cro");
    expect(detectVertical("Un recruteur pour 3 développeurs backend")).toBe("rpo");
  });
  it("garde la première fonction citée", () => {
    expect(detectVertical("Un DRH pour accompagner notre nouveau CTO")).toBe("drh");
  });
  it("ne devine rien sans fonction explicite", () => {
    expect(detectVertical("Startup SaaS, Paris, dès que possible")).toBeNull();
    expect(detectVertical("Nous recherchons un microcontrôleur")).toBeNull();
  });
});
