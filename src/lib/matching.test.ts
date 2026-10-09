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
  it("compare le prix client (TJM freelance + 20 %) au budget, tolérance 10 %", () => {
    const within = scoreRecruiter(need, profile({ tjm: 650 }), false)!; // 780 € client ≤ 800
    expect(within.breakdown.budget).toBe(25);
    const slightlyAbove = scoreRecruiter(need, profile({ tjm: 700 }), false)!; // 840 ≤ 880
    expect(slightlyAbove.breakdown.budget).toBe(12.5);
    expect(scoreRecruiter(need, profile({ tjm: 750 }), false)).toBeNull(); // 900 > 880 : exclu
  });

  it("ne croise jamais deux verticales", () => {
    const other = profile({ vertical: "cfo" as never });
    expect(scoreRecruiter(need, other, false)).toBeNull();
    expect(scoreRecruiter(need, profile({ vertical: "rpo" }), false)).not.toBeNull();
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

describe("date d'arrivée souhaitée", () => {
  const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const busyUntil = (n: number) => profile({ available: false, availability_date: inDays(n) });

  it("besoin « dès que possible » : profils libres sous 30 jours, exclus au-delà", () => {
    expect(scoreRecruiter(need, profile({}), false)!.breakdown.availability).toBe(20);
    const late = scoreRecruiter(need, busyUntil(20), false)!;
    expect(late.breakdown.availability).toBeGreaterThan(10);
    expect(late.breakdown.availability).toBeLessThan(20);
    expect(late.notes.join(" ")).toMatch(/20 j après la date souhaitée/);
    expect(scoreRecruiter(need, busyUntil(30), false)).not.toBeNull();
    expect(scoreRecruiter(need, busyUntil(31), false)).toBeNull();
  });

  it("arrivée dans 2 mois : un profil libre dans 45 jours convient pleinement", () => {
    const later = { ...need, desired_start: inDays(60) } as Need;
    expect(scoreRecruiter(later, busyUntil(45), false)!.breakdown.availability).toBe(20);
    expect(scoreRecruiter(later, busyUntil(85), false)!.breakdown.availability).toBeLessThan(20);
    expect(scoreRecruiter(later, busyUntil(95), false)).toBeNull();
  });

  it("le tarif est présenté sans le mot « client »", () => {
    const notes = scoreRecruiter(need, profile({ tjm: 500 }), false)!.notes.join(" ");
    expect(notes).toMatch(/Tarif de 600 €\/j/);
    expect(notes).not.toMatch(/client/i);
  });
});

describe("départements C-Level", () => {
  const cfoNeed = { ...need, vertical: "cfo", profile_types: [], specialties: ["Trésorerie", "FP&A"], days_per_week: 2 } as unknown as Need;
  const cfo = (over: Partial<Recruiter>) => profile({ vertical: "cfo" as never, skills: [], specialties: ["Trésorerie", "FP&A", "Consolidation"], weekly_capacity: 3, ...over });

  it("classe selon les spécialités communes avec le besoin", () => {
    const exact = scoreRecruiter(cfoNeed, cfo({}), false)!;
    const other = scoreRecruiter(cfoNeed, cfo({ specialties: ["Comptabilité"] }), false)!;
    expect(exact.score).toBeGreaterThan(other.score);
    expect(exact.notes[0]).toBe("Spécialiste Trésorerie, FP&A");
  });

  it("garde disponible un fractional en mission tant qu'il lui reste des jours", () => {
    const ranked = prefilter(cfoNeed, [cfo({ id: "a" })], new Map([["a", 1]]));
    expect(ranked[0].currentlyOnMission).toBe(false);
    expect(ranked[0].notes.join(" ")).toMatch(/2 j\/sem encore disponibles/);
    const full = prefilter(cfoNeed, [cfo({ id: "b", available: false, availability_date: null })], new Map([["b", 3]]));
    expect(full).toHaveLength(0); // plus de jours libres, aucune date : exclu
  });

  it("pénalise un profil qui propose moins de jours que demandé", () => {
    const fullTimeNeed = { ...cfoNeed, days_per_week: null } as Need;
    const s = scoreRecruiter(fullTimeNeed, cfo({ weekly_capacity: 2 }), false)!;
    expect(s.breakdown.availability).toBeCloseTo(8);
    expect(s.notes.join(" ")).toMatch(/Disponible 2 j \/ sem, le besoin demande temps plein/);
  });

  it("ne mélange jamais un CFO et un besoin RPO", () => {
    expect(scoreRecruiter(need, cfo({}), false)).toBeNull();
  });
});
