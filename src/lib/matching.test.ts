import { describe, expect, it } from "vitest";
import { prefilter, scoreRecruiter, type Need, type Recruiter } from "../../supabase/functions/_shared/matching";

const need = {
  id: "n1", job_title: "Recruteur Tech", description: "Recrutement de développeurs backend",
  persona: "rpo", profile_types: ["Tech"], sectors: ["Startup/scaleup"], mission_location: "Paris",
  remote_policy: "hybrid", budget_tjm_min: 500, budget_tjm_max: 800,
} as unknown as Need;

const profile = (over: Partial<Recruiter>): Recruiter => ({
  id: "x", first_name: "X", job_title: null, skills: ["Tech"], sectors: ["Startup/scaleup"], tech_specialties: [],
  mobility: ["Paris"], clients: [], languages: [], remote_preference: "hybrid", tjm: 550, model: "RPO",
  available: true, availability_date: null, admin_rating: 0, super_tam: false, intro_text: null, missions: [],
  has_linkedin_license: false, ...over,
} as Recruiter);

describe("note admin dans le matching", () => {
  it("classe les profils selon les étoiles (5 > 4 > 3 > non noté > 2) et exclut 1 étoile", () => {
    const ranked = prefilter(need, [1, 2, 3, 4, 5, 0].map((n) => profile({ id: `r${n}`, admin_rating: n })), new Set());
    expect(ranked.map((s) => s.recruiter.id)).toEqual(["r5", "r4", "r3", "r0", "r2"]);
  });

  it("ne mentionne jamais la note ni un avis dans les motifs", () => {
    const s = scoreRecruiter(need, profile({ admin_rating: 5, admin_comments: "Excellent sourcing" }), false)!;
    expect(s.notes.join(" ")).not.toMatch(/note|étoile|admin|avis|évalu|Excellent/i);
  });
});

describe("anglais dans le matching", () => {
  const englishNeed = { ...need, description: "Recrutement international, anglais courant requis" } as Need;

  it("est neutre quand le besoin ne parle pas d'anglais", () => {
    const s = scoreRecruiter(need, profile({ languages: [{ language: "Anglais", level: "débutant" }] }), false)!;
    expect(s.breakdown.english).toBe(10);
  });

  it("fait primer la note de l'admin sur le niveau déclaré", () => {
    const declared = profile({ languages: [{ language: "Anglais", level: "courant" }] });
    const corrected = profile({ languages: [{ language: "Anglais", level: "courant" }], admin_english_rating: 2 });
    expect(scoreRecruiter(englishNeed, declared, false)!.notes).toContain("Anglais courant");
    const s = scoreRecruiter(englishNeed, corrected, false)!;
    expect(s.breakdown.english).toBe(0);
    expect(s.notes).toContain("Anglais limité");
  });
});

describe("cohérence du matching", () => {
  it("compare le TJM freelance + marge au budget client (tolérance 10 %)", () => {
    const within = scoreRecruiter(need, profile({ tjm: 700 }), false)!; // 800 € client = max
    expect(within.breakdown.budget).toBe(25);
    const slightlyAbove = scoreRecruiter(need, profile({ tjm: 760 }), false)!; // 860 ≤ 880
    expect(slightlyAbove.breakdown.budget).toBe(12.5);
    expect(scoreRecruiter(need, profile({ tjm: 790 }), false)).toBeNull(); // 890 > 880 : exclu
  });

  it("plafonne un profil sans métier commun sous un spécialiste", () => {
    const outsider = scoreRecruiter(need, profile({ skills: ["Immobilier"] }), false)!;
    const specialist = scoreRecruiter(need, profile({}), false)!;
    expect(outsider.score).toBeLessThanOrEqual(45);
    expect(specialist.score).toBeGreaterThan(outsider.score);
  });

  it("reconnaît chaque ville d'un besoin multi-lieux", () => {
    const multi = { ...need, mission_location: "Paris, Lyon" } as Need;
    expect(scoreRecruiter(multi, profile({ mobility: ["Lyon"] }), false)!.breakdown.location).toBe(10);
    expect(scoreRecruiter(multi, profile({ mobility: ["Bordeaux"] }), false)!.breakdown.location).toBe(0);
  });

  it("écarte un full remote d'un besoin sur site", () => {
    const onSite = { ...need, remote_policy: "on-site" } as Need;
    expect(scoreRecruiter(onSite, profile({ remote_preference: "full-remote" }), false)!.breakdown.remote).toBe(0);
  });

  it("détecte l'anglais dans « équipe internationale »", () => {
    const intl = { ...need, description: "Rejoindre une équipe internationale" } as Need;
    expect(scoreRecruiter(intl, profile({ admin_english_rating: 2 }), false)!.breakdown.english).toBe(0);
  });
});
