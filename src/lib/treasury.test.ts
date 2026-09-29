import { describe, expect, it } from "vitest";
import {
  backfillBalances,
  fixedCostOccurrences,
  fixedCostsByMonth,
  marginByMonth,
  monthForecast,
  monthlyEquivalent,
  monthsEndingAt,
  overdueDays,
  projectBalance,
  revenueByMonth,
  shiftMonth,
  workingDaysBetween,
  type FixedCost,
  type InvoiceLike,
} from "./treasury";

const cost = (over: Partial<FixedCost>): FixedCost => ({
  id: "c", label: "x", category: "autre", amount_ht: 100, vat_amount: 20, frequency: "monthly",
  start_date: "2026-01-15", end_date: null, notes: null, ...over,
});

describe("mois", () => {
  it("décale et liste les mois", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 3)).toBe("2027-02");
    expect(monthsEndingAt("2026-02", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});

describe("jours ouvrés", () => {
  it("exclut week-ends et fériés", () => {
    // Mai 2026 : 21 jours de semaine, dont 1er, 8, 14 (Ascension) et 25 (Pentecôte) fériés
    expect(workingDaysBetween("2026-05-01", "2026-05-31")).toBe(17);
    expect(workingDaysBetween("2026-09-28", "2026-09-30")).toBe(3);
    expect(workingDaysBetween("2026-09-30", "2026-09-28")).toBe(0);
  });
});

describe("frais fixes", () => {
  it("mensuel borné par la date de fin", () => {
    const occ = fixedCostOccurrences(cost({ end_date: "2026-03-10" }), "2026-01", "2026-06");
    expect(occ.map((o) => o.date)).toEqual(["2026-01-15", "2026-02-15"]);
  });
  it("trimestriel à partir d'un mois intermédiaire", () => {
    const occ = fixedCostOccurrences(cost({ frequency: "quarterly" }), "2026-02", "2026-12");
    expect(occ.map((o) => o.month)).toEqual(["2026-04", "2026-07", "2026-10"]);
  });
  it("annuel et ponctuel", () => {
    expect(fixedCostOccurrences(cost({ frequency: "yearly", start_date: "2025-03-31" }), "2026-01", "2026-12").map((o) => o.date)).toEqual(["2026-03-31"]);
    expect(fixedCostOccurrences(cost({ frequency: "once" }), "2026-02", "2026-12")).toEqual([]);
    expect(fixedCostOccurrences(cost({ frequency: "once" }), "2026-01", "2026-01")).toHaveLength(1);
  });
  it("jour ramené à la fin du mois", () => {
    expect(fixedCostOccurrences(cost({ start_date: "2026-01-31" }), "2026-02", "2026-02")[0].date).toBe("2026-02-28");
  });
  it("équivalent mensuel et agrégat", () => {
    expect(monthlyEquivalent(cost({ frequency: "yearly", amount_ht: 1200 }))).toBe(100);
    expect(monthlyEquivalent(cost({ frequency: "once" }))).toBe(0);
    const b = fixedCostsByMonth([cost({})], ["2026-01", "2026-02"], { from: "2026-01-20" });
    expect(b["2026-01"].ttc).toBe(0);
    expect(b["2026-02"].ttc).toBe(120);
  });
});

describe("agrégats", () => {
  const inv = (over: Partial<InvoiceLike>): InvoiceLike => ({
    kind: "invoice", status: "issued", issue_date: "2026-03-05", due_date: "2026-04-04",
    total_ht: 1000, total_vat: 200, total_ttc: 1200, paid_at: null, paid_amount: null, ...over,
  });
  it("CA : factures moins avoirs, brouillons exclus", () => {
    const r = revenueByMonth([
      inv({}), inv({ status: "cancelled" }), inv({ kind: "credit_note", total_ht: -1000 }), inv({ status: "draft", issue_date: null }),
    ], ["2026-03"]);
    expect(r["2026-03"]).toBe(1000);
  });
  it("marge par mois de CRA", () => {
    const m = marginByMonth([{ id: "t", month: 3, year: 2026 }], { t: { timesheet_id: "t", client_amount: 1000, freelance_amount: 700 } }, ["2026-03"]);
    expect(m["2026-03"].margin).toBe(300);
  });
  it("retard en jours", () => {
    expect(overdueDays("2026-09-20", "2026-09-29")).toBe(9);
    expect(overdueDays("2026-10-20", "2026-09-29")).toBe(0);
  });
});

describe("prévisionnel et projection", () => {
  it("sépare validé, écoulé et restant", () => {
    const f = monthForecast({
      month: "2026-09", today: "2026-09-28",
      missions: [
        { id: "a", status: "active", client_tjm: 500, start_date: "2026-01-01", end_date: null },
        { id: "b", status: "active", client_tjm: 800, start_date: "2026-01-01", end_date: null },
      ],
      validatedByMission: { b: 4000 },
    });
    expect(f.validated).toBe(4000);
    expect(f.remainingDays).toBe(3);
    expect(f.remaining).toBe(1500);
    expect(f.elapsed).toBe(19 * 500);
  });
  it("reconstitue les soldes passés", () => {
    expect(backfillBalances(1000, [100, -200, 300])).toEqual([900, 700, 1000]);
  });
  it("reporte les retards sur le premier mois", () => {
    const rows = projectBalance({
      start: 1000, months: ["2026-09", "2026-10"],
      receipts: [{ due: "2026-08-01", amount: 500 }, { due: "2026-10-10", amount: 200 }],
      payments: [{ due: null, amount: 2000 }],
    });
    expect(rows[0].closing).toBe(-500);
    expect(rows[1].closing).toBe(-300);
  });
});
