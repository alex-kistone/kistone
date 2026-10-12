import { describe, expect, it } from "vitest";
import { COMPARISON, PLAYERS } from "./comparison";

describe("comparatif des acteurs", () => {
  it("présente Kistone et chaque acteur avec ses points forts et un lien", () => {
    expect(PLAYERS[0].name).toBe("Kistone");
    for (const p of PLAYERS) {
      expect(p.strengths.length).toBeGreaterThanOrEqual(3);
      expect(p.url).toMatch(/^https:\/\//);
    }
  });
  it("respecte le vocabulaire du site", () => {
    const text = JSON.stringify({ COMPARISON, PLAYERS }).toLowerCase();
    expect(text).not.toContain("management de transition");
    expect(text).not.toContain("sans le cdi");
  });
});
