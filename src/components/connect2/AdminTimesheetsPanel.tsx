import { useState, useEffect, useMemo } from "react";
import { Check, FileText, Receipt, ArrowLeft, MessageSquare, ChevronLeft, ChevronRight, Download, TrendingUp, Clock, AlertCircle, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getFrenchHolidays, getFrenchHolidayName } from "@/lib/frenchHolidays";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminTimesheet {
  id: string;
  month: number;
  year: number;
  total_days: number;
  status: string;
  submitted_at: string | null;
  client_reviewed_at: string | null;
  admin_invoiced_at: string | null;
  need_id: string;
  recruiter_profile_id: string;
  recruiter_name: string;
  client_name: string;
  job_title: string;
  tjm: number | null;
  freelancer_comment: string | null;
  client_comment: string | null;
  rejection_reason: string | null;
  recruitments_count: number;
}

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Soumis", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  client_approved: { label: "Validé client", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  client_rejected: { label: "Refusé client", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  admin_invoiced: { label: "Facturé", color: "bg-accent text-accent-foreground" },
};

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
const getFirstDayOfWeek = (month: number, year: number) => {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
};
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

const AdminTimesheetsPanel = () => {
  const { toast } = useToast();
  const [timesheets, setTimesheets] = useState<AdminTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedTs, setSelectedTs] = useState<AdminTimesheet | null>(null);
  const [days, setDays] = useState<Record<string, number>>({});

  const holidays = useMemo(() => getFrenchHolidays(selectedTs?.year || selectedYear), [selectedTs?.year, selectedYear]);

  useEffect(() => { loadTimesheets(); }, []);

  const loadTimesheets = async () => {
    const { data: ts } = await supabase
      .from("timesheets" as any)
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (!ts || ts.length === 0) { setLoading(false); return; }

    const profileIds = [...new Set((ts as any[]).map((t: any) => t.recruiter_profile_id))];
    const { data: profiles } = await supabase
      .from("recruiter_profiles")
      .select("id, first_name, last_name, tjm")
      .in("id", profileIds);

    const profileMap: Record<string, { name: string; tjm: number | null }> = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = { name: `${p.first_name} ${p.last_name}`, tjm: p.tjm }; });

    const needIds = [...new Set((ts as any[]).map((t: any) => t.need_id))];
    const { data: needs } = await supabase
      .from("client_needs" as any)
      .select("id, job_title, company_name")
      .in("id", needIds);

    const needMap: Record<string, { job_title: string; company_name: string }> = {};
    (needs as any[] || []).forEach((n: any) => { needMap[n.id] = { job_title: n.job_title, company_name: n.company_name }; });

    const list: AdminTimesheet[] = (ts as any[]).map((t: any) => ({
      ...t,
      recruiter_name: profileMap[t.recruiter_profile_id]?.name || "Inconnu",
      tjm: profileMap[t.recruiter_profile_id]?.tjm || null,
      client_name: needMap[t.need_id]?.company_name || "Inconnu",
      job_title: needMap[t.need_id]?.job_title || "Mission",
    }));

    setTimesheets(list);
    setLoading(false);
  };

  const handleMarkInvoiced = async (tsId: string) => {
    const { error } = await supabase
      .from("timesheets" as any)
      .update({ status: "admin_invoiced", admin_invoiced_at: new Date().toISOString() })
      .eq("id", tsId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTimesheets((prev) => prev.map((t) => t.id === tsId ? { ...t, status: "admin_invoiced" } : t));
      if (selectedTs?.id === tsId) setSelectedTs({ ...selectedTs, status: "admin_invoiced" });
      toast({ title: "CRA marqué comme facturé" });
    }
  };

  const handleSelectTs = async (ts: AdminTimesheet) => {
    setSelectedTs(ts);
    const { data } = await supabase
      .from("timesheet_days" as any)
      .select("day_date, value")
      .eq("timesheet_id", ts.id);

    const dayMap: Record<string, number> = {};
    (data as any[] || []).forEach((d: any) => { dayMap[d.day_date] = Number(d.value); });
    setDays(dayMap);
  };

  // CSV Export
  const handleExportCSV = () => {
    const rows = filtered.map((ts) => ({
      Freelance: ts.recruiter_name,
      Mission: ts.job_title,
      Client: ts.client_name,
      Mois: `${MONTH_NAMES[ts.month - 1]} ${ts.year}`,
      Jours: ts.total_days,
      TJM: ts.tjm || "",
      "Montant HT": ts.tjm ? ts.total_days * ts.tjm : "",
      Recrutements: ts.recruitments_count || 0,
      Statut: STATUS_LABELS[ts.status]?.label || ts.status,
      "Commentaire freelance": ts.freelancer_comment || "",
      "Commentaire client": ts.client_comment || "",
    }));

    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(";"),
      ...rows.map((r) => headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CRA_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // KPIs
  const monthTimesheets = timesheets.filter((t) => t.month === selectedMonth && t.year === selectedYear);
  const kpis = useMemo(() => {
    const total = monthTimesheets.length;
    const submitted = monthTimesheets.filter((t) => ["submitted", "client_approved", "client_rejected", "admin_invoiced"].includes(t.status)).length;
    const pending = monthTimesheets.filter((t) => t.status === "submitted").length;
    const invoiced = monthTimesheets.filter((t) => t.status === "admin_invoiced");
    const caInvoiced = invoiced.reduce((sum, t) => sum + (t.tjm ? t.total_days * t.tjm : 0), 0);
    const caTotal = monthTimesheets.reduce((sum, t) => sum + (t.tjm ? t.total_days * t.tjm : 0), 0);
    const submissionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;
    const totalRecruitments = monthTimesheets.reduce((sum, t) => sum + (t.recruitments_count || 0), 0);
    const margin = 100;
    const marginTotal = monthTimesheets.reduce((sum, t) => sum + t.total_days * margin, 0);
    const marginInvoiced = invoiced.reduce((sum, t) => sum + t.total_days * margin, 0);

    return { total, submitted, pending, caInvoiced, caTotal, submissionRate, totalRecruitments, marginTotal, marginInvoiced };
  }, [monthTimesheets]);

  const availableYears = [...new Set(timesheets.map((t) => t.year))].sort((a, b) => b - a);
  if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

  const filtered = timesheets
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) => t.month === selectedMonth && t.year === selectedYear);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement des CRA...</div>;

  // Detail view
  if (selectedTs) {
    const { month, year } = selectedTs;
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfWeek(month, year);

    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" onClick={() => setSelectedTs(null)}>
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </Button>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selectedTs.recruiter_name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedTs.job_title} — {selectedTs.client_name} · {MONTH_NAMES[month - 1]} {year}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={STATUS_LABELS[selectedTs.status]?.color || ""}>
                {STATUS_LABELS[selectedTs.status]?.label || selectedTs.status}
              </Badge>
              <div className="text-right">
                <div className="text-lg font-bold">{selectedTs.total_days}j</div>
                {selectedTs.tjm && (
                  <div className="text-xs text-muted-foreground">
                    {(selectedTs.total_days * selectedTs.tjm).toLocaleString("fr-FR")} € HT
                  </div>
                )}
              </div>
            </div>
          </div>

          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {WEEKDAY_NAMES.map((d) => (
                <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const date = new Date(year, month - 1, dayNum);
                const weekend = isWeekend(date);
                const isHoliday = holidays.has(dateStr);
                const holidayName = isHoliday ? getFrenchHolidayName(dateStr) : null;
                const isOff = weekend || isHoliday;
                const value = days[dateStr] || 0;

                const cell = (
                  <div
                    key={dayNum}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-medium sm:text-base ${
                      isOff
                        ? "border-transparent bg-muted/40 text-muted-foreground/40"
                        : value === 1
                        ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/30"
                        : value === 0.5
                        ? "border-accent bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
                        : "border-border bg-card text-foreground"
                    }`}
                  >
                    <span>{dayNum}</span>
                    {value > 0 && (
                      <span className="absolute bottom-0.5 text-[8px] sm:text-[9px] font-semibold">
                        {value === 1 ? "1j" : "½j"}
                      </span>
                    )}
                    {isHoliday && !weekend && (
                      <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-destructive/60" />
                    )}
                  </div>
                );

                if (holidayName) {
                  return (
                    <Tooltip key={dayNum}>
                      <TooltipTrigger asChild>{cell}</TooltipTrigger>
                      <TooltipContent side="top"><p className="text-xs">{holidayName}</p></TooltipContent>
                    </Tooltip>
                  );
                }
                return cell;
              })}
            </div>
          </TooltipProvider>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-primary bg-primary/15" /> Journée complète
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-accent bg-accent/15" /> Demi-journée
            </span>
            <span className="flex items-center gap-1.5">
              <span className="relative h-3 w-3 rounded bg-muted/40"><span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-destructive/60" /></span> Jour férié
            </span>
          </div>

          {/* Comments */}
          <div className="mt-6 space-y-3 border-t border-border pt-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" /> Commentaires de mission
            </h4>

            {selectedTs.freelancer_comment ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Freelance</p>
                <p className="text-sm">{selectedTs.freelancer_comment}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucun commentaire freelance</p>
            )}

            {selectedTs.client_comment ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Client</p>
                <p className="text-sm">{selectedTs.client_comment}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucun commentaire client</p>
            )}

           {selectedTs.rejection_reason && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="mb-1 text-xs font-semibold text-destructive">Motif de refus</p>
                <p className="text-sm text-destructive">{selectedTs.rejection_reason}</p>
              </div>
            )}

            {selectedTs.recruitments_count > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Recrutements déclarés</p>
                <p className="text-sm font-bold">{selectedTs.recruitments_count}</p>
              </div>
            )}
          </div>

          {selectedTs.status === "client_approved" && (
            <div className="mt-4 flex justify-end">
              <Button size="sm" className="gap-2" onClick={() => handleMarkInvoiced(selectedTs.id)}>
                <Receipt className="h-4 w-4" /> Marquer facturé
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> CA mensuel
          </div>
          <p className="mt-1 text-xl font-bold">{kpis.caTotal.toLocaleString("fr-FR")} €</p>
          {kpis.caInvoiced > 0 && (
            <p className="text-[10px] text-muted-foreground">{kpis.caInvoiced.toLocaleString("fr-FR")} € facturé</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Euro className="h-3.5 w-3.5" /> Marge
          </div>
          <p className="mt-1 text-xl font-bold">{kpis.marginTotal.toLocaleString("fr-FR")} €</p>
          {kpis.marginInvoiced > 0 && (
            <p className="text-[10px] text-muted-foreground">{kpis.marginInvoiced.toLocaleString("fr-FR")} € facturé</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> CRA total
          </div>
          <p className="mt-1 text-xl font-bold">{kpis.total}</p>
          <p className="text-[10px] text-muted-foreground">{kpis.submitted} soumis</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> En attente
          </div>
          <p className="mt-1 text-xl font-bold">{kpis.pending}</p>
          <p className="text-[10px] text-muted-foreground">à valider par client</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" /> Taux soumission
          </div>
          <p className="mt-1 text-xl font-bold">{kpis.submissionRate}%</p>
          <p className="text-[10px] text-muted-foreground">des CRA soumis</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5" /> Recrutements
          </div>
          <p className="mt-1 text-xl font-bold">{kpis.totalRecruitments}</p>
          <p className="text-[10px] text-muted-foreground">ce mois</p>
        </div>
      </div>

      {/* Filters + month selector */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tous" },
            { key: "submitted", label: "Soumis" },
            { key: "client_approved", label: "Validés" },
            { key: "client_rejected", label: "Refusés" },
            { key: "admin_invoiced", label: "Facturés" },
          ].map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV} disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(selectedYear - 1); }
            else setSelectedMonth(selectedMonth - 1);
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(selectedYear + 1); }
            else setSelectedMonth(selectedMonth + 1);
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun CRA pour {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ts) => (
            <button
              key={ts.id}
              onClick={() => handleSelectTs(ts)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{ts.recruiter_name}</span>
                    <Badge className={STATUS_LABELS[ts.status]?.color || ""}>
                      {STATUS_LABELS[ts.status]?.label || ts.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {ts.job_title} — {ts.client_name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">{ts.total_days}j</div>
                    {ts.tjm && (
                      <div className="text-xs text-muted-foreground">
                        {(ts.total_days * ts.tjm).toLocaleString("fr-FR")} € HT
                      </div>
                    )}
                  </div>
                  {ts.recruitments_count > 0 && (
                    <Badge variant="secondary" className="text-xs">{ts.recruitments_count} recr.</Badge>
                  )}
                  {(ts.freelancer_comment || ts.client_comment) && (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTimesheetsPanel;
