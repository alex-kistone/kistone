import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";
import { getFrenchHolidays, getFrenchHolidayName } from "@/lib/frenchHolidays";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimesheetDay {
  id?: string;
  day_date: string;
  value: number; // 0, 0.5, 1
}

interface Timesheet {
  id: string;
  suggestion_id: string;
  recruiter_profile_id: string;
  need_id: string;
  month: number;
  year: number;
  total_days: number;
  status: string;
  submitted_at: string | null;
  client_reviewed_at: string | null;
  rejection_reason: string | null;
}

interface Mission {
  suggestion_id: string;
  need_id: string;
  job_title: string;
  company_name: string;
  mission_id: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Envoyé", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  client_approved: { label: "Validé par le client", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  client_rejected: { label: "Refusé", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  admin_invoiced: { label: "Facturé", color: "bg-accent text-accent-foreground" },
};

const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
const getFirstDayOfWeek = (month: number, year: number) => {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
};
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

const FreelanceTimesheets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [days, setDays] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [recruitmentsCount, setRecruitmentsCount] = useState<number>(0);

  const holidays = useMemo(() => getFrenchHolidays(currentYear), [currentYear]);

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    if (selectedMission && profileId) {
      loadTimesheet();
    }
  }, [selectedMission, currentMonth, currentYear, profileId]);

  const loadMissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    // Get recruiter profile
    const { data: profile } = await supabase
      .from("recruiter_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);

    // Get active missions for this freelancer
    const { data: missionsData } = await supabase
      .from("missions" as any)
      .select("id, suggestion_id, need_id, title, company_name, status")
      .eq("recruiter_profile_id", profile.id)
      .eq("status", "active");

    if (!missionsData || missionsData.length === 0) { setLoading(false); return; }

    const missionList = (missionsData as any[]).map((m: any) => ({
      suggestion_id: m.suggestion_id,
      need_id: m.need_id,
      job_title: m.title,
      company_name: m.company_name,
      mission_id: m.id,
    }));
    setMissions(missionList);
    if (missionList.length > 0) setSelectedMission(missionList[0]);
    setLoading(false);
  };

  const loadTimesheet = async () => {
    if (!selectedMission || !profileId) return;

    const { data: ts } = await supabase
      .from("timesheets" as any)
      .select("*")
      .eq("recruiter_profile_id", profileId)
      .eq("need_id", selectedMission.need_id)
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .maybeSingle();

    if (ts) {
      setTimesheet(ts as any);
      setRecruitmentsCount((ts as any).recruitments_count || 0);
      // Load days
      const { data: dayData } = await supabase
        .from("timesheet_days" as any)
        .select("*")
        .eq("timesheet_id", (ts as any).id);

      const dayMap: Record<string, number> = {};
      (dayData as any[] || []).forEach((d: any) => { dayMap[d.day_date] = Number(d.value); });
      setDays(dayMap);
    } else {
      setTimesheet(null);
      setDays({});
      setRecruitmentsCount(0);
    }
  };

  const ensureTimesheet = async (): Promise<string | null> => {
    if (timesheet) return timesheet.id;
    if (!selectedMission || !profileId) return null;

    const { data, error } = await supabase
      .from("timesheets" as any)
      .insert({
        suggestion_id: selectedMission.suggestion_id,
        recruiter_profile_id: profileId,
        need_id: selectedMission.need_id,
        mission_id: selectedMission.mission_id,
        month: currentMonth,
        year: currentYear,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return null;
    }
    setTimesheet(data as any);
    return (data as any).id;
  };

  const toggleDay = async (dateStr: string) => {
    if (!selectedMission || !profileId) return;
    if (timesheet && !["draft", "client_rejected"].includes(timesheet.status)) return;

    const currentValue = days[dateStr] || 0;
    // Cycle: 0 -> 1 -> 0.5 -> 0
    const nextValue = currentValue === 0 ? 1 : currentValue === 1 ? 0.5 : 0;

    const tsId = await ensureTimesheet();
    if (!tsId) return;

    if (nextValue === 0) {
      // Delete the day entry
      await supabase
        .from("timesheet_days" as any)
        .delete()
        .eq("timesheet_id", tsId)
        .eq("day_date", dateStr);
    } else {
      // Upsert
      const { error } = await supabase
        .from("timesheet_days" as any)
        .upsert(
          { timesheet_id: tsId, day_date: dateStr, value: nextValue },
          { onConflict: "timesheet_id,day_date" }
        );
      if (error) console.error(error);
    }

    const newDays = { ...days };
    if (nextValue === 0) {
      delete newDays[dateStr];
    } else {
      newDays[dateStr] = nextValue;
    }
    setDays(newDays);

    // Update total
    const total = Object.values(newDays).reduce((sum, v) => sum + v, 0);
    await supabase
      .from("timesheets" as any)
      .update({ total_days: total })
      .eq("id", tsId);

    if (timesheet) setTimesheet({ ...timesheet, total_days: total });
  };

  const handleSubmit = async () => {
    if (!timesheet) return;
    setSaving(true);

    const total = Object.values(days).reduce((sum, v) => sum + v, 0);
    const { error } = await supabase
      .from("timesheets" as any)
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        total_days: total,
        recruitments_count: recruitmentsCount,
      })
      .eq("id", timesheet.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTimesheet({ ...timesheet, status: "submitted", total_days: total });
      toast({ title: "CRA envoyé !", description: "Votre CRA a été soumis au client pour validation." });
    }
    setSaving(false);
  };

  const totalDays = useMemo(() => Object.values(days).reduce((sum, v) => sum + v, 0), [days]);

  const canEdit = !timesheet || ["draft", "client_rejected"].includes(timesheet.status);

  // Calendar rendering
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfWeek(currentMonth, currentYear);

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
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Mes CRA</h1>
            <p className="text-sm text-muted-foreground">Compte-rendu d'activité mensuel</p>
          </div>
        </div>

        {missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
            <p className="text-muted-foreground">Aucune mission validée pour le moment.</p>
          </div>
        ) : (
          <>
            {/* Mission selector */}
            {missions.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {missions.map((m) => (
                  <Button
                    key={m.suggestion_id}
                    variant={selectedMission?.suggestion_id === m.suggestion_id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMission(m)}
                  >
                    {m.job_title} — {m.company_name}
                  </Button>
                ))}
              </div>
            )}

            {selectedMission && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                {/* Header with month navigation */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedMission.job_title}</h2>
                    <p className="text-sm text-muted-foreground">{selectedMission.company_name}</p>
                  </div>
                  {timesheet && (
                    <Badge className={STATUS_LABELS[timesheet.status]?.color || ""}>
                      {STATUS_LABELS[timesheet.status]?.label || timesheet.status}
                    </Badge>
                  )}
                </div>

                {/* Rejection reason */}
                {timesheet?.status === "client_rejected" && timesheet.rejection_reason && (
                  <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <strong>Motif du refus :</strong> {timesheet.rejection_reason}
                  </div>
                )}

                {/* Month navigation */}
                <div className="mb-4 flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
                      else setCurrentMonth(currentMonth - 1);
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-lg font-semibold min-w-[200px] text-center">
                    {MONTH_NAMES[currentMonth - 1]} {currentYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
                      else setCurrentMonth(currentMonth + 1);
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Calendar grid */}
                <TooltipProvider>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {/* Day headers */}
                    {WEEKDAY_NAMES.map((d) => (
                      <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                        {d}
                      </div>
                    ))}

                    {/* Empty cells before first day */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                      const date = new Date(currentYear, currentMonth - 1, dayNum);
                      const weekend = isWeekend(date);
                      const isHoliday = holidays.has(dateStr);
                      const holidayName = isHoliday ? getFrenchHolidayName(dateStr) : null;
                      const isOff = weekend || isHoliday;
                      const value = days[dateStr] || 0;

                      const cell = (
                        <button
                          key={dayNum}
                          disabled={isOff || !canEdit}
                          onClick={() => !isOff && canEdit && toggleDay(dateStr)}
                          className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-medium transition-all sm:text-base ${
                            isOff
                              ? "border-transparent bg-muted/40 text-muted-foreground/40 cursor-default"
                              : value === 1
                              ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/30"
                              : value === 0.5
                              ? "border-accent bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
                              : canEdit
                              ? "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                              : "border-border bg-card text-foreground cursor-default"
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
                        </button>
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

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded border border-primary bg-primary/15" /> Journée complète
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded border border-accent bg-accent/15" /> Demi-journée
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded border border-border bg-card" /> Non travaillé
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="relative h-3 w-3 rounded bg-muted/40"><span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-destructive/60" /></span> Jour férié
                  </span>
                  {canEdit && <span className="italic">Cliquez pour basculer : 0 → 1j → ½j → 0</span>}
                </div>

                {/* Recruitments count */}
                {canEdit && (
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <label htmlFor="recruitments" className="text-sm font-medium whitespace-nowrap">
                      Recrutements effectués ce mois
                    </label>
                    <input
                      id="recruitments"
                      type="number"
                      min={0}
                      value={recruitmentsCount}
                      onChange={async (e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setRecruitmentsCount(val);
                        const tsId = await ensureTimesheet();
                        if (tsId) {
                          await supabase.from("timesheets" as any).update({ recruitments_count: val }).eq("id", tsId);
                        }
                      }}
                      className="h-9 w-20 rounded-md border border-input bg-background px-3 text-center text-sm"
                    />
                  </div>
                )}
                {!canEdit && recruitmentsCount > 0 && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <span className="font-medium">Recrutements déclarés :</span>
                    <span className="font-bold">{recruitmentsCount}</span>
                  </div>
                )}

                {/* Total & actions */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <span className="text-2xl font-bold">{totalDays}</span>
                    <span className="ml-1 text-sm text-muted-foreground">jour{totalDays > 1 ? "s" : ""} travaillé{totalDays > 1 ? "s" : ""}</span>
                  </div>
                  {canEdit && totalDays > 0 && (
                    <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                      <Send className="h-4 w-4" />
                      {saving ? "Envoi..." : "Soumettre le CRA"}
                    </Button>
                  )}
                  {timesheet?.status === "client_approved" && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span className="text-sm font-medium">Approuvé — Vous pouvez envoyer votre facture</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default FreelanceTimesheets;
