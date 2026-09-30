import { describe, expect, it } from "vitest";
import { JARVI_FIELDS, toJarviFields } from "./jarvi";

const JARVI_SPECIALITES = ["Corporate", "Data", "Finance", "GTM", "Immobilier", "Product", "Tech"];

const base = {
  skills: ["Tech", "Data"],
  model: "RPO,Succès",
  tjm: 550,
  available: false,
  availability_date: "2026-11-02",
  sectors: ["Startup/scaleup", "Banque/assurance", "Autre"],
  mobility: ["Paris"],
  remote_preference: "full-remote",
  languages: [{ language: "Anglais", level: "courant" }, { language: "Français", level: "natif" }],
};

describe("toJarviFields", () => {
  it("traduit chaque champ vers les valeurs Jarvi", () => {
    const { fields } = toJarviFields(base, JARVI_SPECIALITES);
    expect(fields[JARVI_FIELDS.specialites]).toEqual(["Tech", "Data"]);
    expect(fields[JARVI_FIELDS.modele]).toEqual(["RPO", "Success"]);
    expect(fields[JARVI_FIELDS.tjm]).toBe(550);
    expect(fields[JARVI_FIELDS.dispo]).toBe(false);
    expect(fields[JARVI_FIELDS.dateDispo]).toBe("2026-11-02");
    expect(fields[JARVI_FIELDS.secteurs]).toEqual(["Startup/scaleup", "Banque"]);
    expect(fields[JARVI_FIELDS.fullRemote]).toBe(true);
    expect(fields[JARVI_FIELDS.english]).toBe(4);
    expect(fields[JARVI_FIELDS.autresLangues]).toEqual(["Anglais (courant)", "Français (natif)"]);
  });

  it("signale les valeurs sans équivalent Jarvi", () => {
    const { unmapped } = toJarviFields({ ...base, skills: ["Tech", "Sales"] }, JARVI_SPECIALITES);
    expect(unmapped).toEqual(["Métier « Sales »", "Secteur « Autre »"]);
  });

  it("n'envoie pas de date de dispo quand le freelance est disponible", () => {
    const { fields } = toJarviFields({ ...base, available: true }, JARVI_SPECIALITES);
    expect(fields[JARVI_FIELDS.dateDispo]).toBeNull();
  });
});
