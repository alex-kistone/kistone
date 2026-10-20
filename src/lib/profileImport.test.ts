import { describe, expect, it } from "vitest";
import { mergeImportedProfile, type ProfileDraft } from "./profileImport";

const empty: ProfileDraft = { jobTitle: "", introText: "", clients: [], missions: [], languages: [], skills: [], specialties: [] };
const limits = { maxSkills: 3, maxSpecialties: 2, allowedSpecialties: ["RAG", "Agents IA", "MLOps"] };

describe("mergeImportedProfile", () => {
  it("remplit un profil vide", () => {
    const { draft, added } = mergeImportedProfile(empty, {
      job_title: " AI Engineer ", intro_text: "Je conçois des assistants RAG.",
      clients: ["BNP Paribas", "Doctolib"], missions: [{ client_name: "Doctolib", profile_types: "Assistant RAG", duration: "6 mois", tools: ["Python"] }],
      languages: [{ language: "Anglais", level: "courant" }], specialties: ["RAG", "Inconnue", "Agents IA", "MLOps"],
    }, limits);
    expect(draft.jobTitle).toBe("AI Engineer");
    expect(draft.clients).toEqual(["BNP Paribas", "Doctolib"]);
    expect(draft.missions[0]).toMatchObject({ client_name: "Doctolib", profile_types: "Assistant RAG", kpis: "", duration: "6 mois", tools: ["Python"] });
    expect(draft.specialties).toEqual(["RAG", "Agents IA"]);
    expect(added).toBe(7);
  });

  it("n'écrase jamais une saisie du freelance", () => {
    const mine: ProfileDraft = { ...empty, jobTitle: "Lead AI Engineer", introText: "Mon texte", clients: ["doctolib"], skills: ["Tech"], specialties: ["MLOps"],
      missions: [{ client_name: "Doctolib", profile_types: "Assistant RAG", kpis: "", duration: "" }], languages: [{ language: "Anglais", level: "natif" }] };
    const { draft, added } = mergeImportedProfile(mine, {
      job_title: "AI Engineer", intro_text: "Autre", clients: ["Doctolib"], missions: [{ client_name: "doctolib", profile_types: "assistant rag" }],
      languages: [{ language: "anglais", level: "courant" }], metiers: ["Data/AI"], specialties: ["RAG"],
    }, limits);
    expect(draft).toEqual(mine);
    expect(added).toBe(0);
  });

  it("convertit les métiers RPO et respecte la limite", () => {
    const { draft } = mergeImportedProfile(empty, { metiers: ["Data/IA", "Dev", "Infra", "Sales", "GTM"] }, limits);
    expect(draft.skills).toEqual(["Data/AI", "Tech", "Sales"]);
  });
});
