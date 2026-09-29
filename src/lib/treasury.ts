import { getFrenchHolidays } from "@/lib/frenchHolidays";
import { MONTH_NAMES } from "@/lib/cra";

/**
 * Pilotage (admin) : calculs purs de dates et d'agrégats pour le tableau de bord et la trésorerie.
 * Les dates sont des chaînes ISO (AAAA-MM-JJ…) ; les mois sont des clés « AAAA-MM ».
 */

export type MonthKey = string;

export type FixedCostCategory = "logiciels" | "assurances" | "comptabilite" | "locaux" | "salaires" | "marketing" | "banque" | "autre";
export type FixedCostFrequency = "monthly" | "quarterly" | "yearly" | "once";

export interface FixedCost {
  id: string;
  label: string;
  category: FixedCostCategory;
  amount_ht: number;
  vat_amount: number;
  frequency: FixedCostFrequency;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

export const FIXED_COST_CATEGORIES: Record<FixedCostCategory, string> = {
  logiciels: "Logiciels",
  assurances: "Assurances",
  comptabilite: "Comptabilité",
  locaux: "Locaux",
  salaires: "Salaires",
  marketing: "Marketing",
  banque: "Banque",
  autre: "Autre",
};

export const FIXED_COST_FREQUENCIES: Record<FixedCostFrequency, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  yearly: "Annuel",
  once: "Ponctuel",
};

const FREQUENCY_STEP: Record<Exclude<FixedCostFrequency, "once">, number> = { monthly: 1, quarterly: 3, yearly: 12 };

// ── Mois ──
const pad = (n: number) => String(n).padStart(2, "0");

export const monthKey = (year: number, month: number): MonthKey => `${year}-${pad(month)}`;
export const monthKeyOf = (iso: string): MonthKey => iso.slice(0, 7);
export const parseMonthKey = (key: MonthKey) => {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
};
const monthIndex = (key: MonthKey) => {
  const { year, month } = parseMonthKey(key);
  return year * 12 + (month - 1);
};
const fromIndex = (i: number): MonthKey => monthKey(Math.floor(i / 12), (i % 12) + 1);

export const shiftMonth = (key: MonthKey, delta: number): MonthKey => fromIndex(monthIndex(key) + delta);
export const monthDiff = (from: MonthKey, to: MonthKey) => monthIndex(to) - monthIndex(from);

/** `count` mois consécutifs se terminant par `last` (du plus ancien au plus récent). */
export const monthsEndingAt = (last: MonthKey, count: number): MonthKey[] =>
  Array.from({ length: count }, (_, i) => shiftMonth(last, i - count + 1));

/** `count` mois consécutifs à partir de `first`. */
export const monthsFrom = (first: MonthKey, count: number): MonthKey[] =>
  Array.from({ length: count }, (_, i) => shiftMonth(first, i));

export const monthLabel = (key: MonthKey) => {
  const { year, month } = parseMonthKey(key);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};
const MONTH_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const monthShortLabel = (key: MonthKey) => {
  const { year, month } = parseMonthKey(key);
  return `${MONTH_SHORT[month - 1]} ${String(year).slice(2)}`;
};

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
export const lastDayOf = (key: MonthKey) => {
  const { year, month } = parseMonthKey(key);
  return `${key}-${pad(daysInMonth(year, month))}`;
};

/** Date du jour locale au format AAAA-MM-JJ. */
export const localIso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toUtc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
/** Nombre de jours calendaires de `from` à `to` (négatif si `to` est avant). */
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / 86_400_000);

// ── Jours ouvrés ──
/** Jours ouvrés (lundi–vendredi, hors fériés français) entre deux dates incluses. */
export function workingDaysBetween(from: string, to: string): number {
  if (from.slice(0, 10) > to.slice(0, 10)) return 0;
  const holidays = new Map<number, Set<string>>();
  let count = 0;
  for (let t = toUtc(from); t <= toUtc(to); t += 86_400_000) {
    const d = new Date(t);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const year = d.getUTCFullYear();
    if (!holidays.has(year)) holidays.set(year, getFrenchHolidays(year));
    const iso = `${year}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    if (!holidays.get(year)!.has(iso)) count++;
  }
  return count;
}

const maxIso = (a: string, b: string) => (a > b ? a : b);
const minIso = (a: string, b: string) => (a < b ? a : b);

// ── Frais fixes ──
/** Échéances d'un frais fixe comprises entre deux mois (inclus), selon sa fréquence et ses dates. */
export function fixedCostOccurrences(cost: Pick<FixedCost, "frequency" | "start_date" | "end_date">, from: MonthKey, to: MonthKey): { date: string; month: MonthKey }[] {
  const start = monthKeyOf(cost.start_date);
  const day = Number(cost.start_date.slice(8, 10)) || 1;
  const step = cost.frequency === "once" ? 0 : FREQUENCY_STEP[cost.frequency];
  const out: { date: string; month: MonthKey }[] = [];
  const dateIn = (key: MonthKey) => {
    const { year, month } = parseMonthKey(key);
    return `${key}-${pad(Math.min(day, daysInMonth(year, month)))}`;
  };
  const push = (key: MonthKey) => {
    const date = dateIn(key);
    if (cost.end_date && date > cost.end_date.slice(0, 10)) return false;
    out.push({ date, month: key });
    return true;
  };
  if (step === 0) {
    if (monthDiff(from, start) >= 0 && monthDiff(start, to) >= 0) push(start);
    return out;
  }
  // Premier rang d'échéance ≥ from
  const gap = monthDiff(start, from);
  let k = gap <= 0 ? 0 : Math.ceil(gap / step);
  for (let key = shiftMonth(start, k * step); monthDiff(key, to) >= 0; key = shiftMonth(start, ++k * step)) {
    if (!push(key)) break;
  }
  return out;
}

/** Équivalent mensuel HT d'un frais fixe récurrent (0 pour un frais ponctuel). */
export const monthlyEquivalent = (cost: Pick<FixedCost, "frequency" | "amount_ht">) =>
  cost.frequency === "once" ? 0 : Number(cost.amount_ht) / FREQUENCY_STEP[cost.frequency];

/** Un frais récurrent est actif s'il n'est pas terminé à la date donnée. */
export const isFixedCostActive = (cost: Pick<FixedCost, "frequency" | "end_date" | "start_date">, today: string) =>
  cost.frequency !== "once" && (!cost.end_date || cost.end_date.slice(0, 10) >= today);

/** Montants (HT, TVA, TTC) des frais fixes dus sur chaque mois (échéances éventuellement bornées par date). */
export function fixedCostsByMonth(costs: FixedCost[], months: MonthKey[], bounds: { from?: string; to?: string } = {}) {
  const res = Object.fromEntries(months.map((m) => [m, { ht: 0, vat: 0, ttc: 0 }])) as Record<MonthKey, { ht: number; vat: number; ttc: number }>;
  if (!months.length) return res;
  for (const c of costs) {
    for (const o of fixedCostOccurrences(c, months[0], months[months.length - 1])) {
      if ((bounds.from && o.date < bounds.from) || (bounds.to && o.date > bounds.to)) continue;
      const b = res[o.month];
      b.ht += Number(c.amount_ht);
      b.vat += Number(c.vat_amount);
      b.ttc += Number(c.amount_ht) + Number(c.vat_amount);
    }
  }
  return res;
}

// ── Agrégats ──
/** Somme par mois : la clé de mois vient de `dateOf` (ignorée si hors des mois demandés). */
export function sumByMonth<T>(items: T[], months: MonthKey[], dateOf: (x: T) => string | null | undefined, amountOf: (x: T) => number) {
  const res = Object.fromEntries(months.map((m) => [m, 0])) as Record<MonthKey, number>;
  for (const it of items) {
    const d = dateOf(it);
    if (!d) continue;
    const k = monthKeyOf(d);
    if (k in res) res[k] += amountOf(it);
  }
  return res;
}

export interface InvoiceLike {
  kind: "invoice" | "credit_note";
  status: "draft" | "issued" | "paid" | "cancelled";
  issue_date: string | null;
  due_date: string | null;
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  paid_at: string | null;
  paid_amount: number | null;
}

/** Montant signé d'un document émis : positif pour une facture, négatif pour un avoir. */
const signed = (inv: Pick<InvoiceLike, "kind">, n: number) => (inv.kind === "credit_note" ? -Math.abs(Number(n)) : Math.abs(Number(n)));

/** Document comptabilisé : émis (même annulé ensuite par un avoir, qui le compense). */
export const isIssued = (inv: Pick<InvoiceLike, "status" | "issue_date">) => inv.status !== "draft" && Boolean(inv.issue_date);

/** CA facturé HT par mois d'émission (factures moins avoirs). */
export const revenueByMonth = (invoices: InvoiceLike[], months: MonthKey[]) =>
  sumByMonth(invoices.filter(isIssued), months, (i) => i.issue_date, (i) => signed(i, i.total_ht));

/** TVA collectée par mois d'émission (avoirs en négatif). */
export const vatCollectedByMonth = (invoices: InvoiceLike[], months: MonthKey[]) =>
  sumByMonth(invoices.filter(isIssued), months, (i) => i.issue_date, (i) => signed(i, i.total_vat));

/** Encaissements : factures payées, par date de paiement. */
export const receiptsByMonth = (invoices: InvoiceLike[], months: MonthKey[]) =>
  sumByMonth(invoices.filter((i) => i.kind === "invoice" && i.paid_at), months, (i) => i.paid_at, (i) => Number(i.paid_amount ?? i.total_ttc));

/** Factures émises restant à encaisser. */
export const unpaidInvoices = <T extends InvoiceLike>(invoices: T[]) => invoices.filter((i) => i.kind === "invoice" && i.status === "issued");

export interface TimesheetMonth { id: string; month: number; year: number }
export interface FrozenRates { timesheet_id: string; client_amount: number; freelance_amount: number }

/** Chiffre d'affaires des CRA et marge brute par mois de CRA (taux figés à la validation). */
export function marginByMonth(timesheets: TimesheetMonth[], rates: Record<string, FrozenRates>, months: MonthKey[]) {
  const res = Object.fromEntries(months.map((m) => [m, { revenue: 0, cost: 0, margin: 0 }])) as Record<MonthKey, { revenue: number; cost: number; margin: number }>;
  for (const t of timesheets) {
    const r = rates[t.id];
    const b = res[monthKey(t.year, t.month)];
    if (!r || !b) continue;
    b.revenue += Number(r.client_amount);
    b.cost += Number(r.freelance_amount);
    b.margin += Number(r.client_amount) - Number(r.freelance_amount);
  }
  return res;
}

export interface MissionLike { id: string; status: string; client_tjm: number; start_date: string; end_date: string | null }

/**
 * Prévisionnel d'un mois : CRA déjà validés + missions en cours sans CRA validé,
 * estimées au TJM client sur les jours ouvrés du mois couverts par la mission
 * (jours déjà écoulés d'un côté, jours restants à partir d'aujourd'hui de l'autre).
 */
export function monthForecast(opts: {
  month: MonthKey;
  today: string;
  missions: MissionLike[];
  /** Montant client validé par mission pour ce mois (taux figés). */
  validatedByMission: Record<string, number>;
}) {
  const { month, today, missions, validatedByMission } = opts;
  const first = `${month}-01`;
  const last = lastDayOf(month);
  let validated = 0;
  for (const v of Object.values(validatedByMission)) validated += v;
  let elapsed = 0;
  let remaining = 0;
  let remainingDays = 0;
  for (const m of missions) {
    if (m.status !== "active" || m.id in validatedByMission) continue;
    const from = maxIso(first, m.start_date.slice(0, 10));
    const to = m.end_date ? minIso(last, m.end_date.slice(0, 10)) : last;
    if (from > to) continue;
    const tjm = Number(m.client_tjm) || 0;
    // Jours écoulés : jusqu'à la veille ; restants : à partir d'aujourd'hui
    const splitAt = maxIso(from, today);
    const yesterday = new Date(toUtc(today) - 86_400_000).toISOString().slice(0, 10);
    const past = splitAt > from ? workingDaysBetween(from, minIso(to, yesterday)) : 0;
    const rest = workingDaysBetween(splitAt, to);
    elapsed += past * tjm;
    remaining += rest * tjm;
    remainingDays += rest;
  }
  return { validated, elapsed, remaining, remainingDays, total: validated + elapsed + remaining };
}

// ── Projection ──
export interface ProjectionRow {
  month: MonthKey;
  opening: number;
  receipts: number;
  payments: number;
  closing: number;
}

/**
 * Solde projeté mois par mois : trésorerie de départ + encaissements attendus − décaissements attendus.
 * Les échéances dépassées (ou sans date) sont comptées sur le premier mois.
 */
export function projectBalance(opts: {
  start: number;
  months: MonthKey[];
  receipts: { due: string | null; amount: number }[];
  payments: { due: string | null; amount: number }[];
}): ProjectionRow[] {
  const { start, months, receipts, payments } = opts;
  if (!months.length) return [];
  const bucket = (items: { due: string | null; amount: number }[]) => {
    const res = Object.fromEntries(months.map((m) => [m, 0])) as Record<MonthKey, number>;
    for (const it of items) {
      const k = it.due ? monthKeyOf(it.due) : months[0];
      const key = monthDiff(k, months[0]) >= 0 ? months[0] : k;
      if (key in res) res[key] += it.amount;
    }
    return res;
  };
  const r = bucket(receipts);
  const p = bucket(payments);
  let balance = start;
  return months.map((month) => {
    const opening = balance;
    balance = opening + r[month] - p[month];
    return { month, opening, receipts: r[month], payments: p[month], closing: balance };
  });
}

/** Libellé « en retard de N j » (ou null si pas en retard). */
export const overdueDays = (due: string | null, today: string) => {
  if (!due) return 0;
  const n = daysBetween(due, today);
  return n > 0 ? n : 0;
};

/**
 * Soldes de fin de mois reconstitués à rebours : le dernier mois (en cours, à date) vaut `current`,
 * chaque mois précédent vaut le suivant moins le flux net du suivant.
 */
export function backfillBalances(current: number, nets: number[]): number[] {
  const out = new Array<number>(nets.length);
  let balance = current;
  for (let i = nets.length - 1; i >= 0; i--) {
    out[i] = balance;
    balance -= nets[i];
  }
  return out;
}
