import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Briefcase, Euro, Target, Clock } from "lucide-react";

interface KPIData {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalCA: number;
  totalMarge: number;
  avgMargePerDay: number;
  totalNeeds: number;
  staffedNeeds: number;
  conversionRate: number;
  availableFreelancers: number;
  totalFreelancers: number;
  avgStaffingDays: number;
  missionsPerMonth: { month: string; count: number; ca: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
}

const MARGIN_PER_DAY = 100;

const AdminKPIPanel = () => {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const [missionsRes, needsRes, profilesRes, timesheetsRes] = await Promise.all([
        supabase.from("missions").select("*"),
        supabase.from("client_needs").select("id, status, created_at"),
        supabase.from("recruiter_profiles" as any).select("id, available"),
        supabase.from("timesheets").select("total_days, mission_id, year, month, status"),
      ]);

      const missions = (missionsRes.data as any[]) || [];
      const needs = needsRes.data || [];
      const profiles = (profilesRes.data as any[]) || [];
      const timesheets = (timesheetsRes.data as any[]) || [];

      const activeMissions = missions.filter(m => m.status === "active");
      const completedMissions = missions.filter(m => m.status === "completed");

      // CA & marge from approved/invoiced timesheets
      const validTimesheets = timesheets.filter(t => ["client_approved", "admin_invoiced"].includes(t.status));
      const totalDaysWorked = validTimesheets.reduce((sum, t) => sum + (t.total_days || 0), 0);

      // Build CA from missions' client_tjm × days
      let totalCA = 0;
      let totalMarge = 0;
      for (const ts of validTimesheets) {
        const mission = missions.find(m => m.id === ts.mission_id);
        if (mission) {
          totalCA += (mission.client_tjm || 0) * (ts.total_days || 0);
          totalMarge += MARGIN_PER_DAY * (ts.total_days || 0);
        }
      }

      // Conversion rate
      const staffedNeeds = needs.filter(n => n.status === "staffed").length;
      const conversionRate = needs.length > 0 ? Math.round((staffedNeeds / needs.length) * 100) : 0;

      // Available freelancers
      const availableFreelancers = profiles.filter(p => p.available !== false).length;

      // Avg staffing time (days between need creation and first active mission)
      let staffingDaysSum = 0;
      let staffingCount = 0;
      for (const mission of missions) {
        const need = needs.find(n => n.id === mission.need_id);
        if (need && mission.start_date) {
          const diffMs = new Date(mission.start_date).getTime() - new Date(need.created_at).getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays >= 0) {
            staffingDaysSum += diffDays;
            staffingCount++;
          }
        }
      }
      const avgStaffingDays = staffingCount > 0 ? Math.round(staffingDaysSum / staffingCount) : 0;

      // Missions per month (last 12 months)
      const monthMap = new Map<string, { count: number; ca: number }>();
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, { count: 0, ca: 0 });
      }
      for (const m of missions) {
        const d = new Date(m.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthMap.has(key)) {
          const entry = monthMap.get(key)!;
          entry.count++;
        }
      }
      // Add CA per month from timesheets
      for (const ts of validTimesheets) {
        const key = `${ts.year}-${String(ts.month).padStart(2, "0")}`;
        const mission = missions.find(m => m.id === ts.mission_id);
        if (monthMap.has(key) && mission) {
          monthMap.get(key)!.ca += (mission.client_tjm || 0) * (ts.total_days || 0);
        }
      }

      const missionsPerMonth = Array.from(monthMap.entries()).map(([month, d]) => ({
        month: new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        count: d.count,
        ca: d.ca,
      }));

      // Status distribution
      const statusDistribution = [
        { name: "Actives", value: activeMissions.length, color: "hsl(var(--primary))" },
        { name: "Terminées", value: completedMissions.length, color: "hsl(var(--muted-foreground))" },
        { name: "Annulées", value: missions.filter(m => m.status === "cancelled").length, color: "hsl(var(--destructive))" },
      ].filter(s => s.value > 0);

      setData({
        totalMissions: missions.length,
        activeMissions: activeMissions.length,
        completedMissions: completedMissions.length,
        totalCA,
        totalMarge,
        avgMargePerDay: totalDaysWorked > 0 ? Math.round(totalMarge / totalDaysWorked) : MARGIN_PER_DAY,
        totalNeeds: needs.length,
        staffedNeeds,
        conversionRate,
        availableFreelancers,
        totalFreelancers: profiles.length,
        avgStaffingDays,
        missionsPerMonth,
        statusDistribution,
      });
    } catch (err) {
      console.error("KPI load error:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="h-20 animate-pulse rounded bg-muted" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA total</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalCA)}</p>
              </div>
              <Euro className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge totale</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalMarge)}</p>
                <p className="text-xs text-muted-foreground">{MARGIN_PER_DAY}€/jour travaillé</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missions actives</p>
                <p className="text-2xl font-bold">{data.activeMissions}</p>
                <p className="text-xs text-muted-foreground">{data.totalMissions} au total</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de conversion</p>
                <p className="text-2xl font-bold">{data.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">{data.staffedNeeds}/{data.totalNeeds} besoins staffés</p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Freelances disponibles</p>
                <p className="text-2xl font-bold">{data.availableFreelancers}</p>
                <p className="text-xs text-muted-foreground">sur {data.totalFreelancers} inscrits</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Délai moyen de staffing</p>
                <p className="text-2xl font-bold">{data.avgStaffingDays} jours</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missions créées par mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.missionsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" name="Missions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CA mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.missionsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: number) => [formatCurrency(v), "CA"]}
                />
                <Line type="monotone" dataKey="ca" name="CA" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {data.statusDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition des missions</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {data.statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminKPIPanel;
