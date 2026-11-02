import { describe, expect, it } from "vitest";
import { LOCATION_OPTIONS, mobilityCovers } from "./locations";

describe("mobilité", () => {
  it("propose la France en premier, puis les régions et les pays", () => {
    expect(LOCATION_OPTIONS[0].value).toBe("France");
    expect(LOCATION_OPTIONS.filter((o) => o.kind === "Région")).toHaveLength(18);
  });

  it("une région couvre ses villes et départements", () => {
    expect(mobilityCovers("Île-de-France", "Paris")).toBe(true);
    expect(mobilityCovers("Île-de-France", "La Défense, Lyon")).toBe(true);
    expect(mobilityCovers("Île-de-France", "Hauts-de-Seine")).toBe(true);
    expect(mobilityCovers("Auvergne-Rhône-Alpes", "Lyon 3e")).toBe(true);
    expect(mobilityCovers("Île-de-France", "Lyon")).toBe(false);
  });

  it("la France couvre toutes les villes françaises, pas l'étranger", () => {
    expect(mobilityCovers("France", "Bordeaux")).toBe(true);
    expect(mobilityCovers("France", "Barcelone")).toBe(false);
  });

  it("garde les anciennes saisies libres et évite les faux amis", () => {
    expect(mobilityCovers("Paris", "paris")).toBe(true);
    expect(mobilityCovers("Nouvelle-Aquitaine", "Paul")).toBe(false);
    expect(mobilityCovers("Belgique", "Bruxelles, Belgique")).toBe(true);
  });
});
