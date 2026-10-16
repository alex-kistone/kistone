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

describe("toJarviFields · familles IA", () => {
  const LEADER_FIELD = "c5f1c316-4911-478b-bded-220bebe7c639";
  const ENGINEER_FIELD = "eaba6143-8e57-4384-89a4-08693de4e9c5";
  const leader = { ...base, vertical: "leader" as const, specialties: ["Head of AI", "Transformation IA"], skills: [], model: null };

  it("envoie les spécialités dans le champ de la famille, sans les champs propres au RPO", () => {
    const { fields } = toJarviFields(leader, JARVI_SPECIALITES);
    expect(fields[LEADER_FIELD]).toEqual(["Head of AI", "Transformation IA"]);
    expect(JARVI_FIELDS.specialites in fields).toBe(false);
    expect(JARVI_FIELDS.modele in fields).toBe(false);
    expect(JARVI_FIELDS.linkedinRecruiter in fields).toBe(false);
    expect(fields[JARVI_FIELDS.tjm]).toBe(550);
  });

  it("ajoute « AI Leader Part-time » quand le leader n'est pas à temps plein", () => {
    expect(toJarviFields({ ...leader, weekly_capacity: 2 }, JARVI_SPECIALITES).fields[LEADER_FIELD]).toContain("AI Leader Part-time");
    expect(toJarviFields({ ...leader, weekly_capacity: 5 }, JARVI_SPECIALITES).fields[LEADER_FIELD]).not.toContain("AI Leader Part-time");
  });

  it("range les spécialités AI Engineer dans leur propre champ Jarvi, sans tag de rythme", () => {
    const { fields, unmapped } = toJarviFields({ ...leader, vertical: "engineer" as const, specialties: ["Agents IA", "Inconnue"], weekly_capacity: 3 }, JARVI_SPECIALITES);
    expect(fields[ENGINEER_FIELD]).toEqual(["Agents IA"]);
    expect(unmapped).toContain("Spécialité « Inconnue »");
    expect(fields[LEADER_FIELD]).toBeUndefined();
  });
});
