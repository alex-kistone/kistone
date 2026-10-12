import { describe, expect, it } from "vitest";
import { MODEL_PAGES } from "./models";

describe("modèles", () => {
  it("partagent les mêmes libellés de faits (tableau comparatif)", () => {
    const labels = MODEL_PAGES[0].facts.map((f) => f.label);
    for (const m of MODEL_PAGES) expect(m.facts.map((f) => f.label)).toEqual(labels);
  });
  it("n'emploient jamais « management de transition » ni « sans le CDI »", () => {
    const text = JSON.stringify(MODEL_PAGES).toLowerCase();
    expect(text).not.toContain("management de transition");
    expect(text).not.toContain("sans le cdi");
  });
});
