import { describe, expect, it } from "vitest";
import { budgetError } from "./budget";
import { isFreeEmail } from "./emailDomains";

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
