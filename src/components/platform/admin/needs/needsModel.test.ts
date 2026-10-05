import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS, applyFiltersToParams, buildNeedRow, filterAndSortRows, filtersFromParams, relativeAge,
  type ClientNeed, type ProfileSuggestion,
} from "./needsModel";

const NOW = new Date("2026-09-29T12:00:00Z").getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const need = (id: string, over: Partial<ClientNeed> = {}): ClientNeed => ({
  id, user_id: "u1", company_name: "Acme", contact_name: "", contact_email: "", job_title: `Poste ${id}`,
  profile_types: [], sectors: [], budget_tjm_min: null, budget_tjm_max: null, mission_location: "", remote_policy: "hybrid",
  status: "pending", persona: "", description: null, desired_start: null, vertical: "rpo", tenant_id: null, created_at: daysAgo(1), updated_at: daysAgo(1),
  ...over,
});

const sugg = (id: string, needId: string, status: string, updated: string | null = null): ProfileSuggestion => ({
  id, need_id: needId, anonymous_label: "Profil A", match_score: 80, match_reasons: [], pipeline_status: status,
  recruiter_profile_id: `p-${id}`, super_tam: false, created_at: daysAgo(20), status_updated_at: updated,
});

describe("buildNeedRow", () => {
  it("marque « À matcher » un besoin sans suggestion", () => {
    const row = buildNeedRow(need("n1"), [], new Set(), NOW);
    expect(row.status).toBe("to_match");
    expect(row.todo).toEqual(["to_match"]);
  });

  it("compte les étapes et signale la mission à créer", () => {
    const s = [sugg("a", "n1", "suggested"), sugg("b", "n1", "accepted", daysAgo(1)), sugg("c", "n2", "accepted")];
    const row = buildNeedRow(need("n1"), s, new Set(), NOW);
    expect(row.counts).toEqual({ suggested: 1, shortlisted: 0, interview: 0, accepted: 1 });
    expect(row.status).toBe("in_progress");
    expect(row.todo).toEqual(["mission_to_create"]);
    expect(buildNeedRow(need("n1"), s, new Set(["b"]), NOW).todo).toEqual([]);
  });

  it("signale « À relancer » après 7 jours sans mouvement (status_updated_at, sinon created_at)", () => {
    expect(buildNeedRow(need("n1"), [sugg("a", "n1", "interview", daysAgo(8))], new Set(), NOW).todo).toEqual(["to_follow_up"]);
    expect(buildNeedRow(need("n1"), [sugg("a", "n1", "shortlisted", daysAgo(2))], new Set(), NOW).todo).toEqual([]);
    expect(buildNeedRow(need("n1"), [sugg("a", "n1", "shortlisted")], new Set(), NOW).todo).toEqual(["to_follow_up"]);
  });

  it("n'a rien à traiter pour un besoin clos", () => {
    expect(buildNeedRow(need("n1", { status: "closed" }), [], new Set(), NOW).todo).toEqual([]);
    expect(buildNeedRow(need("n1", { status: "staffed" }), [sugg("a", "n1", "accepted")], new Set(["a"]), NOW).status).toBe("staffed");
  });
});

describe("filterAndSortRows", () => {
  const rows = [
    buildNeedRow(need("old", { created_at: daysAgo(10), status: "staffed" }), [], new Set(), NOW),
    buildNeedRow(need("new", { created_at: daysAgo(1), status: "staffed", company_name: "Société Générale" }), [], new Set(), NOW),
    buildNeedRow(need("todo", { created_at: daysAgo(30), user_id: "u2" }), [], new Set(), NOW),
  ];

  it("place les besoins à traiter d'abord, puis les plus récents", () => {
    expect(filterAndSortRows(rows, EMPTY_FILTERS).map((r) => r.need.id)).toEqual(["todo", "new", "old"]);
  });

  it("filtre par recherche (sans accents), statut, client et « à traiter »", () => {
    expect(filterAndSortRows(rows, { ...EMPTY_FILTERS, q: "societe" }).map((r) => r.need.id)).toEqual(["new"]);
    expect(filterAndSortRows(rows, { ...EMPTY_FILTERS, status: "staffed" }).map((r) => r.need.id)).toEqual(["new", "old"]);
    expect(filterAndSortRows(rows, { ...EMPTY_FILTERS, client: "u2" }).map((r) => r.need.id)).toEqual(["todo"]);
    expect(filterAndSortRows(rows, { ...EMPTY_FILTERS, todo: true }).map((r) => r.need.id)).toEqual(["todo"]);
  });
});

describe("paramètres d'URL", () => {
  it("fait l'aller-retour des filtres sans toucher aux autres paramètres", () => {
    const params = applyFiltersToParams(new URLSearchParams("tab=needs&need=x"), { q: "dev", status: "to_match", client: "u1", todo: true });
    expect(params.get("tab")).toBe("needs");
    expect(params.get("need")).toBe("x");
    expect(filtersFromParams(params)).toEqual({ q: "dev", status: "to_match", client: "u1", todo: true });
    expect(applyFiltersToParams(params, EMPTY_FILTERS).toString()).toBe("tab=needs&need=x");
    expect(filtersFromParams(new URLSearchParams("status=bogus")).status).toBe("");
  });
});

describe("relativeAge", () => {
  it("donne un âge court", () => {
    expect(relativeAge(daysAgo(0), NOW)).toBe("aujourd'hui");
    expect(relativeAge(daysAgo(3), NOW)).toBe("il y a 3 j");
    expect(relativeAge(daysAgo(95), NOW)).toBe("il y a 3 mois");
  });
});
