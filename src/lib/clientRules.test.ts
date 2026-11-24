import { describe, expect, it } from "vitest";
import { budgetError } from "./budget";
import { isFreeEmail } from "./emailDomains";
import { clientPrice, freelanceNet, freelanceRate } from "./pricing";

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

describe("tarification (prix coûtant)", () => {
  it("prix client = TJM freelance, sans marge", () => {
    expect(clientPrice(500)).toBe(500);
    expect(clientPrice(550)).toBe(550);
  });
  it("le freelance voit le budget client tel quel", () => {
    expect(freelanceRate(600)).toBe(600);
    expect(freelanceRate(800)).toBe(800);
    expect(clientPrice(freelanceRate(800))).toBeLessThanOrEqual(800);
  });
});

describe("freelanceNet", () => {
  it("garde 80 % du budget client pour le freelance (600 € client → 480 € freelance)", () => {
    expect(freelanceNet(600)).toBe(480);
    expect(freelanceNet(700)).toBe(560);
    expect(freelanceNet(555)).toBe(444);
  });
});
