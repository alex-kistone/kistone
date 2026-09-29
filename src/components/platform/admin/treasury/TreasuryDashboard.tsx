import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Briefcase, CalendarClock, ClipboardList, Euro, Hourglass, Percent, TrendingUp, UserCheck, Users } from "lucide-react";
import { eur } from "@/lib/invoices";
import {
  localIso, marginByMonth, monthForecast, monthKeyOf, monthLabel, monthShortLabel, monthsEndingAt, parseMonthKey,
  revenueByMonth, type MonthKey,
} from "@/lib/treasury";
import type { TreasuryData } from "./useTreasuryData";
import { axisEur, eur0, pct, signedEur } from "./format";
import { TREASURY_COLORS as C } from "./palette";
import { Amount, KpiCard, MonthSelect, Section } from "./shared";

/** Tableau de bord : activité et rentabilité du mois choisi, historique sur 12 mois, prévisionnel. */

const VALIDATED = ["client_approved", "admin_invoiced"];


export const TreasuryDashboard = ({ data }: { data: TreasuryData }) => {
  const today = localIso();
  const current = monthKeyOf(today);
  const [month, setMonth] = useState<MonthKey>(current);

  const stats = useMemo(() => {
    const months = monthsEndingAt(month, 12);
    const revenue = revenueByMonth(data.clientInvoices, months);
    const margin = marginByMonth(data.timesheets, data.rates, months);
    const chart = months.map((m) => ({ month: monthShortLabel(m), ca: Math.round(revenue[m]), marge: Math.round(margin[m].margin) }));
    const m = margin[month];
    const { year, month: mm } = parseMonthKey(month);

    const active = data.missions.filter((x) => x.status === "active");
    return {
      chart,
      revenue: revenue[month],
      margin: m.margin,
      marginRate: m.revenue > 0 ? (m.margin / m.revenue) * 100 : null,
      craRevenue: m.revenue,
      consultants: new Set(active.map((x) => x.recruiter_profile_id)).size,
      activeMissions: active.length,
      onboarding: data.missions.filter((x) => x.status === "onboarding").length,
      suggestions: data.suggestions.filter((s) => monthKeyOf(s.created_at) === month).length,
      pendingCra: data.timesheets.filter((t) => t.status === "submitted").length,
      pendingCraMonth: data.timesheets.filter((t) => t.status === "submitted" && t.year === year && t.month === mm).length,
    };
  }, [data, month]);

  const forecast = useMemo(() => {
    const { year, month: mm } = parseMonthKey(current);
    const validatedByMission: Record<string, number> = {};
    for (const t of data.timesheets) {
      const r = data.rates[t.id];
      if (!r || !t.mission_id || t.year !== year || t.month !== mm || !VALIDATED.includes(t.status)) continue;
      validatedByMission[t.mission_id] = (validatedByMission[t.mission_id] ?? 0) + Number(r.client_amount);
    }
    return monthForecast({ month: current, today, missions: data.missions, validatedByMission });
  }, [data, current, today]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Activité et rentabilité de {monthLabel(month).toLowerCase()}.</p>
        <MonthSelect id="treasury-kpi-month" label="Mois" value={month} onChange={setMonth} last={current} />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="CA facturé HT" value={eur0(stats.revenue)} hint="Factures émises moins avoirs" icon={Euro} />
        <KpiCard label="Marge du mois" value={eur0(stats.margin)} hint={`Sur ${eur0(stats.craRevenue)} de CRA validés`} icon={TrendingUp} tone={stats.margin < 0 ? "danger" : undefined} />
        <KpiCard label="Taux de marge" value={stats.marginRate == null ? "—" : pct(stats.marginRate)} hint="Marge / montant client des CRA" icon={Percent} />
        <KpiCard label="Consultants en mission" value={stats.consultants.toLocaleString("fr-FR")} hint={`${stats.activeMissions.toLocaleString("fr-FR")} mission${stats.activeMissions > 1 ? "s" : ""} en cours`} icon={Users} />
        <KpiCard label="Missions en préparation" value={stats.onboarding.toLocaleString("fr-FR")} hint="Onboarding en cours" icon={Briefcase} />
        <KpiCard label="Besoins ouverts" value={data.openNeeds.toLocaleString("fr-FR")} hint="En attente ou actifs" icon={ClipboardList} />
        <KpiCard label="Profils proposés" value={stats.suggestions.toLocaleString("fr-FR")} hint={`En ${monthLabel(month).toLowerCase()}`} icon={UserCheck} />
        <KpiCard
          label="CRA en attente de validation"
          value={stats.pendingCra.toLocaleString("fr-FR")}
          hint={stats.pendingCraMonth ? `dont ${stats.pendingCraMonth} pour ce mois` : "Soumis au client"}
          icon={Hourglass}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Section title="CA et marge sur 12 mois" description="CA facturé HT par mois d'émission ; marge par mois de CRA (taux figés).">
          <div className="h-[260px] w-full rounded-lg" style={{ background: C.surface }} role="img" aria-label={`Histogramme du CA HT et de la marge, de ${stats.chart[0]?.month} à ${stats.chart[stats.chart.length - 1]?.month}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="month" tick={{ fill: C.mutedInk, fontSize: 11 }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: C.grid }} />
                <YAxis tick={{ fill: C.mutedInk, fontSize: 11 }} tickFormatter={axisEur} width={56} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.grid}`, borderRadius: 8, color: C.balance, fontSize: 12 }}
                  formatter={(v: number) => signedEur(v)}
                  cursor={{ fill: C.grid, fillOpacity: 0.4 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: C.mutedInk }} />
                <ReferenceLine y={0} stroke={C.mutedInk} />
                <Bar dataKey="ca" name="CA réalisé HT" fill={C.inflow} stroke={C.surface} strokeWidth={2} radius={[4, 4, 0, 0]} />
                <Bar dataKey="marge" name="Marge" fill={C.outflow} stroke={C.surface} strokeWidth={2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title={`Prévisionnel de ${monthLabel(current).toLowerCase()}`} description="Missions en cours au TJM client, jours ouvrés hors fériés.">
          <p className="text-3xl font-bold tabular-nums">≈ {eur0(forecast.total)}</p>
          <p className="mb-4 text-xs text-muted-foreground">CA HT attendu sur le mois</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">CRA validés</dt>
              <dd className="font-medium tabular-nums">{eur(forecast.validated)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Jours écoulés, CRA à valider</dt>
              <dd className="text-sm"><Amount value={forecast.elapsed} status="forecast" /></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                {forecast.remainingDays.toLocaleString("fr-FR")} j restants (cumul missions)
              </dt>
              <dd className="text-sm"><Amount value={forecast.remaining} status="forecast" /></dd>
            </div>
          </dl>
        </Section>
      </div>
    </div>
  );
};
