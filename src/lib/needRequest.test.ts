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
