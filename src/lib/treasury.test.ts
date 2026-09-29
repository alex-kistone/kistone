import { describe, expect, it } from "vitest";
import {
  backfillBalances,
  cashInItems,
  cashOutItems,
  chainBalances,
  chargeToFixedCost,
  fixedCostToCharge,
  flowsByParty,
  lateFlows,
  latestBalance,
  validateCharge,
  type FreelanceInvoiceLike,
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

describe("soldes de référence", () => {
  it("prend le solde le plus récent", () => {
    expect(latestBalance([{ month: "2026-07-01", amount: 1 }, { month: "2026-09-01", amount: 2 }, { month: "2026-08-01", amount: 3 }])?.amount).toBe(2);
    expect(latestBalance([])).toBeNull();
  });

  it("enchaîne les mois à partir du solde au 1er, et reconstitue les mois antérieurs", () => {
    const nets: Record<string, number> = { "2026-07": 100, "2026-08": -50, "2026-09": 200, "2026-10": -300 };
    const rows = chainBalances({
      anchor: { month: "2026-08-01", amount: 1000 },
      months: ["2026-07", "2026-08", "2026-09", "2026-10"],
      netOf: (m) => nets[m] ?? 0,
    });
    expect(rows).toEqual([
      { month: "2026-07", opening: 900, net: 100, closing: 1000 },
      { month: "2026-08", opening: 1000, net: -50, closing: 950 },
      { month: "2026-09", opening: 950, net: 200, closing: 1150 },
      { month: "2026-10", opening: 1150, net: -300, closing: 850 },
    ]);
  });

  it("enchaîne depuis un solde antérieur à la fenêtre", () => {
    const rows = chainBalances({ anchor: { month: "2026-05-01", amount: 0 }, months: ["2026-08", "2026-09"], netOf: () => 10 });
    // mai, juin, juillet : +30 avant l'ouverture d'août
    expect(rows?.map((r) => [r.opening, r.closing])).toEqual([[30, 40], [40, 50]]);
  });

  it("renvoie null sans solde de référence", () => {
    expect(chainBalances({ anchor: null, months: ["2026-09"], netOf: () => 0 })).toBeNull();
  });
});

describe("détail des flux", () => {
  const inv = (over: Partial<InvoiceLike & { client: string }>): InvoiceLike & { client: string } => ({
    kind: "invoice", status: "issued", issue_date: "2026-08-01", due_date: "2026-09-01", total_ht: 100, total_vat: 20,
    total_ttc: 120, paid_at: null, paid_amount: null, client: "Acme", ...over,
  });
  const fi = (over: Partial<FreelanceInvoiceLike & { name: string }>): FreelanceInvoiceLike & { name: string } => ({
    status: "approved", due_date: "2026-10-05", paid_at: null, amount_ttc: 500, name: "Jane", ...over,
  });

  it("répartit le cash in par client et par mois", () => {
    const items = cashInItems([
      inv({}),
      inv({ status: "paid", paid_at: "2026-09-10", paid_amount: 118, client: "Beta" }),
      inv({ due_date: "2026-10-01" }),
      inv({ status: "draft", due_date: null }),
      inv({ kind: "credit_note", total_ttc: -120 }),
      inv({ status: "cancelled" }),
    ], (i) => i.client);
    const t = flowsByParty(items, ["2026-09", "2026-10"]);
    expect(t.rows.map((r) => r.party)).toEqual(["Acme", "Beta"]);
    expect(t.rows[0].cells).toEqual({ "2026-09": 120, "2026-10": 120 });
    expect(t.totals).toEqual({ "2026-09": 238, "2026-10": 120 });
    expect(t.total).toBe(358);
  });

  it("répartit le cash out par freelance, ignore les factures refusées et hors fenêtre", () => {
    const items = cashOutItems([
      fi({}),
      fi({ status: "paid", paid_at: "2026-09-02" }),
      fi({ status: "rejected" }),
      fi({ status: "submitted", due_date: "2027-06-01", name: "Bob" }),
    ], (i) => i.name);
    const t = flowsByParty(items, ["2026-09", "2026-10"]);
    expect(t.rows).toHaveLength(1);
    expect(t.totals).toEqual({ "2026-09": 500, "2026-10": 500 });
  });

  it("range les flux plus anciens dans le premier mois si demandé", () => {
    const t = flowsByParty([{ party: "A", date: "2026-01-10", amount: 5 }], ["2026-08", "2026-09"], { clampEarlier: true });
    expect(t.totals["2026-08"]).toBe(5);
    expect(t.clamped).toBe(true);
  });

  it("liste les retards client et freelance", () => {
    const late = lateFlows(
      [inv({ due_date: "2026-09-01" }), inv({ due_date: "2026-10-01" }), inv({ status: "paid", paid_at: "2026-09-20", due_date: "2026-09-01" })],
      [fi({ due_date: "2026-09-19" }), fi({ status: "submitted", due_date: "2026-09-01" })],
      "2026-09-29",
    );
    expect(late.map((l) => [l.source, l.daysLate])).toEqual([["client", 28], ["freelance", 10]]);
  });
});

describe("charges internes", () => {
  it("convertit une charge TTC récurrente", () => {
    expect(chargeToFixedCost({ ttc: 1200, vat: 200, firstMonth: "2026-09", lastMonth: null })).toEqual({
      amount_ht: 1000, vat_amount: 200, frequency: "monthly", start_date: "2026-09-01", end_date: null,
    });
    expect(chargeToFixedCost({ ttc: 1200, vat: 200, firstMonth: "2026-09", lastMonth: "2027-02" }).end_date).toBe("2027-02-28");
  });

  it("même mois de début et de fin : ponctuelle", () => {
    const c = chargeToFixedCost({ ttc: 50, vat: 0, firstMonth: "2026-10", lastMonth: "2026-10" });
    expect(c.frequency).toBe("once");
    expect(c.end_date).toBe("2026-10-31");
  });

  it("garde la fréquence et les jours d'une charge existante", () => {
    const prev = { frequency: "quarterly" as const, start_date: "2026-01-15", end_date: null };
    expect(chargeToFixedCost({ ttc: 120, vat: 20, firstMonth: "2026-01", lastMonth: null }, prev)).toMatchObject({ frequency: "quarterly", start_date: "2026-01-15" });
  });

  it("aller-retour avec fixed_costs", () => {
    expect(fixedCostToCharge(cost({ start_date: "2026-03-01", end_date: "2026-06-30" }))).toEqual({ ttc: 120, vat: 20, firstMonth: "2026-03", lastMonth: "2026-06" });
    expect(fixedCostToCharge(cost({ frequency: "once", start_date: "2026-03-10" })).lastMonth).toBe("2026-03");
  });

  it("valide la saisie", () => {
    expect(validateCharge({ ttc: 100, vat: 120, firstMonth: "2026-01", lastMonth: null }).vat).toBeTruthy();
    expect(validateCharge({ ttc: 100, vat: 20, firstMonth: "2026-05", lastMonth: "2026-04" }).lastMonth).toBeTruthy();
    expect(validateCharge({ ttc: 100, vat: 20, firstMonth: "2026-05", lastMonth: null })).toEqual({});
  });
});
