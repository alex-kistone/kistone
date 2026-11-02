import { describe, expect, it } from "vitest";
import { needRequestLines, parseNeedRequest } from "./needRequest";

const base = { email: " Marie@Entreprise.fr ", vertical: "engineer", engagement: "fractional", rhythm: "2-3-days", start_window: "asap" };

describe("parseNeedRequest", () => {
  it("normalise l'email et garde le rythme d'un fractional", () => {
    const r = parseNeedRequest(base);
    expect(r).toMatchObject({ email: "marie@entreprise.fr", rhythm: "2-3-days", duration: null, open_positions: null });
  });

  it("ignore les réponses qui ne correspondent pas au modèle choisi", () => {
    const r = parseNeedRequest({ ...base, engagement: "mission", duration: "6m+", open_positions: "3" });
    expect(r).toMatchObject({ rhythm: null, duration: "6m+", open_positions: null });
  });

  it("exige le nombre de postes pour un recrutement CDI", () => {
    expect(parseNeedRequest({ ...base, engagement: "cdi" })).toBe("Indiquez le nombre de postes ouverts.");
    expect(parseNeedRequest({ ...base, engagement: "cdi", open_positions: " 4 postes " })).toMatchObject({ open_positions: "4 postes" });
  });

  it("refuse un email ou une valeur hors liste", () => {
    expect(parseNeedRequest({ ...base, email: "pas-un-email" })).toBe("Adresse email invalide.");
    expect(parseNeedRequest({ ...base, vertical: "cfo" })).toBe("Profil recherché invalide.");
    expect(parseNeedRequest({ ...base, start_window: "demain" })).toBe("Démarrage invalide.");
  });
});

describe("needRequestLines", () => {
  it("affiche Tech Recruiter et les postes ouverts pour un CDI", () => {
    const lines = needRequestLines({ vertical: "rpo", engagement: "cdi", rhythm: null, duration: null, open_positions: "2 postes", start_window: "1m" });
    expect(lines.map((l) => l.value)).toEqual(["Tech Recruiter", "Recrutement CDI", "2 postes", "Dans un mois"]);
  });
});

const rpo = { email: "A@test.kistone.invalid", vertical: "rpo", engagement: "mission", duration: "3-6m", start_window: "asap" };

describe("demande RPO (parcours /besoin)", () => {
  it("garde le métier et la durée", () => {
    const r = parseNeedRequest({ ...rpo, metier: "Finance" });
    expect(r).toMatchObject({ email: "a@test.kistone.invalid", metier: "Finance", duration: "3-6m" });
  });

  it("récapitule métier, durée et démarrage, sans profil ni modèle", () => {
    const r = parseNeedRequest({ ...rpo, metier: "Autres" });
    expect(typeof r).not.toBe("string");
    if (typeof r === "string") return;
    expect(needRequestLines(r).map((l) => l.value)).toEqual(["Autre", "3 à 6 mois", "Dès que possible"]);
  });

  it("garde le budget, y compris « pas encore sûr », et l'affiche au récapitulatif", () => {
    const r = parseNeedRequest({ ...rpo, metier: "Tech", budget: "unsure" });
    if (typeof r === "string") throw new Error(r);
    expect(r.budget).toBe("unsure");
    expect(needRequestLines(r).at(-1)).toEqual({ label: "Budget", value: "Pas encore sûr(e)" });
    expect((parseNeedRequest({ ...rpo, metier: "Tech", budget: "1M€" }) as { budget: string | null }).budget).toBeNull();
  });

  it("accepte Head of TA", () => {
    expect(parseNeedRequest({ ...rpo, metier: "Head of TA" })).toMatchObject({ metier: "Head of TA" });
  });

  it("écarte un métier inconnu et relit les anciennes demandes", () => {
    const r = parseNeedRequest({ ...rpo, metier: "Cuisine" });
    if (typeof r === "string") throw new Error(r);
    expect(r.metier).toBeNull();
    expect(needRequestLines(r).map((l) => l.label)).toEqual(["Profil", "Modèle", "Durée", "Démarrage"]);
  });
});
