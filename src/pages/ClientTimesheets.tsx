import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, ChevronLeft, ChevronRight, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";
import { getFrenchHolidays, getFrenchHolidayName } from "@/lib/frenchHolidays";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimesheetForReview {
  id: string;
  month: number;
  year: number;
  total_days: number;
  status: string;
  submitted_at: string | null;
  need_id: string;
  recruiter_first_name: string;
  job_title: string;
}

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "En attente de validation", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  client_approved: { label: "Validé", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  client_rejected: { label: "Refusé", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  admin_invoiced: { label: "Facturé", color: "bg-accent text-accent-foreground" },
};

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
const getFirstDayOfWeek = (month: number, year: number) => {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
};
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

const ClientTimesheets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timesheets, setTimesheets] = useState<TimesheetForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTs, setSelectedTs] = useState<TimesheetForReview | null>(null);
  const [days, setDays] = useState<Record<string, number>>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const calendarYear = selectedTs?.year || new Date().getFullYear();
  const holidays = useMemo(() => getFrenchHolidays(calendarYear), [calendarYear]);

  useEffect(() => { loadTimesheets(); }, []);

  const loadTimesheets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/client"); return; }

    const { data: needs } = await supabase
      .from("client_needs" as any)
      .select("id, job_title")
      .eq("user_id", session.user.id);

    if (!needs || needs.length === 0) { setLoading(false); return; }

    const needIds = (needs as any[]).map((n: any) => n.id);
    const needMap: Record<string, string> = {};
    (needs as any[]).forEach((n: any) => { needMap[n.id] = n.job_title; });

    const { data: ts } = await supabase
      .from("timesheets" as any)
      .select("id, month, year, total_days, status, submitted_at, need_id, recruiter_profile_id")
      .in("need_id", needIds)
      .in("status", ["submitted", "client_approved", "client_rejected", "admin_invoiced"])
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (!ts || ts.length === 0) { setLoading(false); return; }

    const profileIds = [...new Set((ts as any[]).map((t: any) => t.recruiter_profile_id))];
    const { data: suggestions } = await supabase
      .from("profile_suggestions" as any)
      .select("recruiter_profile_id, recruiter_first_name")
      .in("recruiter_profile_id", profileIds)
      .in("need_id", needIds);

    const nameMap: Record<string, string> = {};
    (suggestions as any[] || []).forEach((s: any) => {
      if (s.recruiter_first_name) nameMap[s.recruiter_profile_id] = s.recruiter_first_name;
    });

    const list: TimesheetForReview[] = (ts as any[]).map((t: any) => ({
      ...t,
      recruiter_first_name: nameMap[t.recruiter_profile_id] || "Freelance",
      job_title: needMap[t.need_id] || "Mission",
    }));

    setTimesheets(list);
    setLoading(false);
  };

  const loadDays = async (tsId: string) => {
    const { data } = await supabase
      .from("timesheet_days" as any)
      .select("day_date, value")
      .eq("timesheet_id", tsId);

    const dayMap: Record<string, number> = {};
    (data as any[] || []).forEach((d: any) => { dayMap[d.day_date] = Number(d.value); });
    setDays(dayMap);
  };

  const handleSelect = async (ts: TimesheetForReview) => {
    setSelectedTs(ts);
    setShowRejectForm(false);
    setRejectionReason("");
    await loadDays(ts.id);
  };

  const handleApprove = async () => {
    if (!selectedTs) return;
    setProcessing(true);

    const { error } = await supabase
      .from("timesheets" as any)
      .update({
        status: "client_approved",
        client_reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedTs.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTimesheets((prev) => prev.map((t) => t.id === selectedTs.id ? { ...t, status: "client_approved" } : t));
      setSelectedTs({ ...selectedTs, status: "client_approved" });
      toast({ title: "CRA validé !", description: `Le CRA de ${selectedTs.recruiter_first_name} a été approuvé.` });
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedTs || !rejectionReason.trim()) return;
    setProcessing(true);

    const { error } = await supabase
      .from("timesheets" as any)
      .update({
        status: "client_rejected",
        client_reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim(),
      })
      .eq("id", selectedTs.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTimesheets((prev) => prev.map((t) => t.id === selectedTs.id ? { ...t, status: "client_rejected" } : t));
      setSelectedTs({ ...selectedTs, status: "client_rejected" });
      toast({ title: "CRA refusé", description: "Le freelance sera notifié du refus." });
      setShowRejectForm(false);
    }
    setProcessing(false);
  };

  const renderCalendar = () => {
    if (!selectedTs) return null;
    const { month, year } = selectedTs;
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfWeek(month, year);

    return (
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
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">CRA à valider</h1>
            <p className="text-sm text-muted-foreground">Validez les comptes-rendus d'activité de vos freelances</p>
          </div>
        </div>

        {timesheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun CRA à valider pour le moment.</p>
          </div>
        ) : selectedTs ? (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => setSelectedTs(null)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Retour
                </Button>
                <h2 className="text-lg font-semibold">
                  {selectedTs.recruiter_first_name} — {selectedTs.job_title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {MONTH_NAMES[selectedTs.month - 1]} {selectedTs.year}
                </p>
              </div>
              <Badge className={STATUS_LABELS[selectedTs.status]?.color || ""}>
                {STATUS_LABELS[selectedTs.status]?.label || selectedTs.status}
              </Badge>
            </div>

            {renderCalendar()}

            {/* Legend */}
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

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <div>
                <span className="text-2xl font-bold">{selectedTs.total_days}</span>
                <span className="ml-1 text-sm text-muted-foreground">jour{selectedTs.total_days > 1 ? "s" : ""}</span>
              </div>

              {selectedTs.status === "submitted" && (
                <div className="flex gap-2">
                  {showRejectForm ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <Textarea
                        placeholder="Motif du refus..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-w-[200px]"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
                          Confirmer le refus
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button variant="outline" className="gap-2 text-destructive border-destructive/30" onClick={() => setShowRejectForm(true)}>
                        <X className="h-4 w-4" /> Refuser
                      </Button>
                      <Button className="gap-2" onClick={handleApprove} disabled={processing}>
                        <Check className="h-4 w-4" /> Valider le CRA
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {timesheets.map((ts) => (
              <button
                key={ts.id}
                onClick={() => handleSelect(ts)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{ts.recruiter_first_name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">— {ts.job_title}</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {MONTH_NAMES[ts.month - 1]} {ts.year} · {ts.total_days} jour{ts.total_days > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge className={STATUS_LABELS[ts.status]?.color || ""}>
                    {STATUS_LABELS[ts.status]?.label || ts.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientTimesheets;
