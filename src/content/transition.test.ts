import { describe, expect, it } from "vitest";
import { ROLES } from "./transition";
import { FONCTIONS, parseCallbackRequest } from "@/lib/fonctions";

describe("fiches du cabinet", () => {
  it("couvrent exactement les fonctions connues en base, dans le même ordre", () => {
    expect(ROLES.map((r) => [r.slug, r.short])).toEqual(FONCTIONS.map((f) => [f.value, f.label]));
  });
});

describe("parseCallbackRequest", () => {
  const ok = { name: "Jeanne Martin", company: "Acme", phone: "06 12 34 56 78", fonction: "finance", message: "  DAF pour 6 mois  ", source: "Trouver un manager", page: "Accueil" };

  it("accepte une demande complète", () => {
    expect(parseCallbackRequest(ok)).toEqual({
      contact_name: "Jeanne Martin", company: "Acme", phone: "06 12 34 56 78", fonction: "finance",
      brief: "DAF pour 6 mois", source: "Trouver un manager · Accueil",
    });
  });

  it("exige le nom, l'entreprise et un vrai numéro", () => {
    expect(typeof parseCallbackRequest({ ...ok, company: " " })).toBe("string");
    expect(parseCallbackRequest({ ...ok, phone: "abc" })).toBe("Numéro de téléphone invalide.");
  });

  it("range une fonction inconnue dans « autre »", () => {
    expect(parseCallbackRequest({ ...ok, fonction: "astronaute" })).toMatchObject({ fonction: "autre" });
  });
});
