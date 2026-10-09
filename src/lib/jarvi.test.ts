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
  it("envoie les champs admin et fait primer la note d'anglais de l'admin", () => {
    const { fields } = toJarviFields({ ...base, admin_rating: 5, admin_english_rating: 2, admin_comments: "  Très bon sourcing  ", tech_specialties: ["Dev", "Java"] }, JARVI_SPECIALITES);
    expect(fields[JARVI_FIELDS.rate]).toBe(5);
    expect(fields[JARVI_FIELDS.english]).toBe(2);
    expect(fields[JARVI_FIELDS.notes]).toBe("Très bon sourcing");
    expect(fields[JARVI_FIELDS.specialitesTech]).toEqual(["Dev"]);
    expect(fields[JARVI_FIELDS.autresLangues]).toEqual(["Anglais (intermédiaire)", "Français (natif)"]);
  });

  it("ajoute l'anglais noté par l'admin même s'il n'est pas déclaré", () => {
    const { fields } = toJarviFields({ ...base, languages: [{ language: "Français", level: "natif" }], admin_english_rating: 5 }, JARVI_SPECIALITES);
    expect(fields[JARVI_FIELDS.autresLangues]).toEqual(["Français (natif)", "Anglais (natif)"]);
    expect(fields[JARVI_FIELDS.english]).toBe(5);
  });

  it("n'envoie pas de champ admin vide (ne les efface pas dans Jarvi)", () => {
    const { fields } = toJarviFields(base, JARVI_SPECIALITES);
    expect(JARVI_FIELDS.rate in fields).toBe(false);
    expect(JARVI_FIELDS.notes in fields).toBe(false);
    expect(fields[JARVI_FIELDS.english]).toBe(4);
  });

  it("traduit chaque champ vers les valeurs Jarvi", () => {
    const { fields } = toJarviFields(base, JARVI_SPECIALITES);
    expect(fields[JARVI_FIELDS.specialites]).toEqual(["Tech", "Data"]);
    expect(fields[JARVI_FIELDS.modele]).toEqual(["RPO", "Success"]);
    expect(fields[JARVI_FIELDS.tjm]).toBe(550);
    expect(fields[JARVI_FIELDS.dispo]).toBe(false);
    expect(fields[JARVI_FIELDS.dateDispo]).toBe("2026-11-02");
    expect(fields[JARVI_FIELDS.secteurs]).toEqual(["Startup/scaleup", "Banque"]);
    expect(fields[JARVI_FIELDS.remote]).toBe("Full remote");
    expect(fields[JARVI_FIELDS.linkedinRecruiter]).toBe(false);
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

describe("toJarviFields · départements C-Level", () => {
  const CFO_FIELD = "f96c2a0c-dac9-4c86-bf3c-8b6dd20229a1";
  const cfo = { ...base, vertical: "cfo" as const, specialties: ["Trésorerie", "FP&A"], skills: [], model: null };

  it("envoie les spécialités dans le champ de la verticale, sans les champs propres au RPO", () => {
    const { fields } = toJarviFields(cfo, JARVI_SPECIALITES);
    expect(fields[CFO_FIELD]).toEqual(["Trésorerie", "FP&A"]);
    expect(JARVI_FIELDS.specialites in fields).toBe(false);
    expect(JARVI_FIELDS.modele in fields).toBe(false);
    expect(JARVI_FIELDS.linkedinRecruiter in fields).toBe(false);
    expect(fields[JARVI_FIELDS.tjm]).toBe(550);
  });

  it("ajoute « CFO Part-time » quand le freelance n'est pas à temps plein", () => {
    expect(toJarviFields({ ...cfo, weekly_capacity: 2 }, JARVI_SPECIALITES).fields[CFO_FIELD]).toContain("CFO Part-time");
    expect(toJarviFields({ ...cfo, weekly_capacity: 5 }, JARVI_SPECIALITES).fields[CFO_FIELD]).not.toContain("CFO Part-time");
  });

  it("range les spécialités COO dans leur propre champ Jarvi", () => {
    const { fields } = toJarviFields({ ...cfo, vertical: "coo" as const, specialties: ["Achats"] }, JARVI_SPECIALITES);
    expect(fields["007887f9-a5f0-4659-8fae-5b485aa8884f"]).toContain("Achats");
    expect(fields[CFO_FIELD]).toBeUndefined();
  });
});
