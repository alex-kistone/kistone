import { describe, expect, it } from "vitest";
import { pendingNeedFromRequest } from "./pendingNeed";

const today = new Date("2026-11-02T10:00:00Z");

describe("besoin de /besoin repris dans le parcours avec compte", () => {
  it("reprend le métier, la durée, le démarrage et le budget", () => {
    const n = pendingNeedFromRequest({ metier: "Tech", duration: "3-6m", start_window: "1m", budget: "500-600", brief: null }, today);
    expect(n).toMatchObject({
      job_title: "Recruteur Tech", vertical: "rpo", profile_types: ["Tech"], duration_months: 6,
      desired_start: "2026-12-02", budget_tjm_min: 500, budget_tjm_max: 600, remote_policy: "flexible",
    });
  });

  it("laisse le budget et le démarrage ouverts quand le client n'est pas encore sûr", () => {
    const n = pendingNeedFromRequest({ metier: "Head of TA", duration: "unsure", start_window: "asap", budget: "unsure", brief: "Structurer l'équipe" }, today);
    expect(n).toMatchObject({ job_title: "Head of TA", budget_tjm_min: null, budget_tjm_max: null, desired_start: null, duration_months: null, description: "Structurer l'équipe" });
  });
});
