import { describe, expect, it } from "vitest";
import { findLeaks, priceTile, slugify } from "@/components/platform/admin/linkedin/linkedinCard";

describe("carte LinkedIn : garde-fou d'anonymat", () => {
  it("repère un nom ou une entreprise cités en mot entier, sans tenir compte de la casse", () => {
    expect(findLeaks(["Dupont", "Doctolib"], ["Ex-doctolib, 15 ans d'expérience"])).toEqual(["Doctolib"]);
  });
  it("ignore un prénom contenu dans un autre mot (« Marc » dans « marché »)", () => {
    expect(findLeaks(["Marc"], ["Expert du marché B2B"])).toEqual([]);
  });
  it("ignore les termes vides ou trop courts", () => {
    expect(findLeaks(["", null, "A"], ["A comme Achat"])).toEqual([]);
  });
});

describe("carte LinkedIn : tuiles et fichiers", () => {
  it("sépare le prix et son unité", () => {
    expect(priceTile("TJM", "780 €")).toEqual({ label: "TJM", value: "780", unit: "€ HT/j" });
    expect(priceTile("TJM", "Sur demande")).toEqual({ label: "TJM", value: "Sur demande", unit: undefined });
  });
  it("produit un nom de fichier sans accents", () => {
    expect(slugify("Fractional DRH · Équipes")).toBe("fractional-drh-equipes");
  });
});
