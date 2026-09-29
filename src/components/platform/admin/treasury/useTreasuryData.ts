import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ClientInvoice, FreelanceInvoice } from "@/lib/invoices";
import type { FixedCost, FrozenRates, MissionLike } from "@/lib/treasury";

/**
 * Données du pilotage (admin). Les tables des phases 2 à 4 ne sont pas dans les types générés ;
 * fixed_costs peut ne pas exister encore (migration à appliquer) : on le signale sans bloquer le reste.
 */

export interface TreasuryMission extends MissionLike { recruiter_profile_id: string }
export interface TreasuryTimesheet { id: string; month: number; year: number; status: string; mission_id: string | null }
export interface TreasuryRates extends FrozenRates { expenses_ht: number; expenses_vat: number }
export interface FreelanceInvoiceWithName extends FreelanceInvoice { freelance_name: string }

export interface TreasuryData {
  missions: TreasuryMission[];
  timesheets: TreasuryTimesheet[];
  rates: Record<string, TreasuryRates>;
  clientInvoices: ClientInvoice[];
  freelanceInvoices: FreelanceInvoiceWithName[];
  openNeeds: number;
  suggestions: { created_at: string }[];
  fixedCosts: FixedCost[];
  fixedCostsError: boolean;
}

const EMPTY: TreasuryData = {
  missions: [], timesheets: [], rates: {}, clientInvoices: [], freelanceInvoices: [],
  openNeeds: 0, suggestions: [], fixedCosts: [], fixedCostsError: false,
};

export async function fetchFixedCosts(): Promise<{ rows: FixedCost[]; error: boolean }> {
  const { data, error } = await supabase
    .from("fixed_costs" as never)
    .select("id, label, category, amount_ht, vat_amount, frequency, start_date, end_date, notes")
    .order("start_date", { ascending: false });
  if (error) return { rows: [], error: true };
  return { rows: (data as FixedCost[] | null) ?? [], error: false };
}

async function load(): Promise<TreasuryData> {
  const [ms, ts, rt, ci, fi, nd, sg, fc] = await Promise.all([
    supabase.from("missions").select("id, status, client_tjm, start_date, end_date, recruiter_profile_id"),
    supabase.from("timesheets").select("id, month, year, status, mission_id"),
    supabase.from("timesheet_rates" as never).select("timesheet_id, client_amount, freelance_amount, expenses_ht, expenses_vat"),
    supabase.from("client_invoices" as never).select("*"),
    supabase.from("freelance_invoices" as never).select("*"),
    supabase.from("client_needs").select("id", { count: "exact", head: true }).in("status", ["pending", "active"]),
    supabase.from("profile_suggestions").select("created_at").gte("created_at", new Date(Date.now() - 400 * 86_400_000).toISOString()),
    fetchFixedCosts(),
  ]);
  const freelanceInvoices = (fi.data as FreelanceInvoice[] | null) ?? [];
  const userIds = [...new Set(freelanceInvoices.map((i) => i.freelance_user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("recruiter_profiles").select("user_id, first_name, last_name").in("user_id", userIds)
    : { data: [] as { user_id: string | null; first_name: string; last_name: string }[] };
  const names = new Map((profiles ?? []).map((p) => [p.user_id, `${p.first_name} ${p.last_name}`.trim()]));

  return {
    missions: (ms.data as TreasuryMission[] | null) ?? [],
    timesheets: (ts.data as TreasuryTimesheet[] | null) ?? [],
    rates: Object.fromEntries(((rt.data as TreasuryRates[] | null) ?? []).map((r) => [r.timesheet_id, r])),
    clientInvoices: (ci.data as ClientInvoice[] | null) ?? [],
    freelanceInvoices: freelanceInvoices.map((i) => ({ ...i, freelance_name: names.get(i.freelance_user_id) || "Freelance" })),
    openNeeds: nd.count ?? 0,
    suggestions: (sg.data as { created_at: string }[] | null) ?? [],
    fixedCosts: fc.rows,
    fixedCostsError: fc.error,
  };
}

export function useTreasuryData() {
  const [data, setData] = useState<TreasuryData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setData(await load());
    setLoading(false);
  }, []);

  const reloadFixedCosts = useCallback(async () => {
    const fc = await fetchFixedCosts();
    setData((d) => ({ ...d, fixedCosts: fc.rows, fixedCostsError: fc.error }));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, reload, reloadFixedCosts };
}
