import { describe, expect, it } from "vitest";
import { budgetError } from "./budget";
import { isFreeEmail } from "./emailDomains";
import { clientPrice, freelanceRate } from "./pricing";

describe("budgetError", () => {
  it("exige un min strictement inférieur au max", () => {
    expect(budgetError("500", "600")).toBeNull();
    expect(budgetError("600", "600")).toMatch(/inférieur/);
    expect(budgetError("700", "600")).toMatch(/inférieur/);
  });
  it("accepte une borne seule", () => {
    expect(budgetError("", "600")).toBeNull();
    expect(budgetError("500", "")).toBeNull();
  });
});

describe("isFreeEmail", () => {
  it("refuse les messageries grand public", () => {
    for (const e of ["a@gmail.com", "a@hotmail.fr", "a@outlook.com", "a@yahoo.co.uk", "a@orange.fr", "a@icloud.com", "A@GMAIL.COM"]) {
      expect(isFreeEmail(e)).toBe(true);
    }
  });
  it("accepte les domaines d'entreprise", () => {
    for (const e of ["a@kistone.fr", "a@gotam.ai", "a@outlook-conseil.fr", "a@livementor.com"]) {
      expect(isFreeEmail(e)).toBe(false);
    }
  });
});

describe("tarification (+20 %)", () => {
  it("prix client = TJM freelance + 20 %, arrondi à l'euro supérieur", () => {
    expect(clientPrice(500)).toBe(600);
    expect(clientPrice(550)).toBe(660); // pas 661 malgré 550 × 1,2 = 660,000…01
    expect(clientPrice(333)).toBe(400); // 399,6 → 400
  });
  it("le freelance voit le budget client sans la marge", () => {
    expect(freelanceRate(600)).toBe(500);
    expect(freelanceRate(800)).toBe(666);
    expect(clientPrice(freelanceRate(800))).toBeLessThanOrEqual(800);
  });
});
