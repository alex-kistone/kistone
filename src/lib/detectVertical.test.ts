import { describe, expect, it } from "vitest";
import { detectVertical } from "./detectVertical";

describe("detectVertical", () => {
  it("reconnaît la famille citée", () => {
    expect(detectVertical("Un CTO Part-time pour nous aider à mettre en place des agents IA")).toBe("leader");
    expect(detectVertical("Nous cherchons un Head of AI pour notre feuille de route")).toBe("leader");
    expect(detectVertical("Un AI Engineer pour industrialiser notre RAG")).toBe("engineer");
    expect(detectVertical("Besoin d'un MLOps pour passer en production")).toBe("engineer");
    expect(detectVertical("Un Product Manager IA pour notre assistant")).toBe("product");
    expect(detectVertical("Un recruteur pour 3 développeurs backend")).toBe("rpo");
  });
  it("garde la première famille citée", () => {
    expect(detectVertical("Un tech recruiter pour recruter des AI Engineers")).toBe("rpo");
  });
  it("ne devine rien sans fonction explicite", () => {
    expect(detectVertical("Startup SaaS, Paris, dès que possible")).toBeNull();
    expect(detectVertical("Nous recherchons un microcontrôleur")).toBeNull();
  });
});
