import { useState, useEffect, useMemo } from "react";
import { Briefcase, MapPin, Calendar, Clock, ChevronLeft, ChevronRight, Send, Check, ArrowLeft, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FreelanceMission {
  id: string;
  title: string;
  company_name: string;
  location: string;
  recruiter_tjm: number;
  start_date: string;
  end_date: string | null;
  duration_text: string | null;
  status: string;
  need_id: string;
  suggestion_id: string;
  recruiter_profile_id: string;
}

interface TimesheetData {
  id: string;
  month: number;
  year: number;
  total_days: number;
  status: string;
  submitted_at: string | null;
  rejection_reason: string | null;
}

const MISSION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "En cours", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  completed: { label: "Terminée", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const TS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Envoyé", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  client_approved: { label: "Validé", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  client_rejected: { label: "Refusé", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  admin_invoiced: { label: "Facturé", color: "bg-accent text-accent-foreground" },
};

const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
const getFirstDayOfWeek = (month: number, year: number) => {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
};
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

const FreelanceMissionsSection = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<FreelanceMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<FreelanceMission | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // CRA state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [timesheet, setTimesheet] = useState<TimesheetData | null>(null);
  const [days, setDays] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [timesheetHistory, setTimesheetHistory] = useState<TimesheetData[]>([]);
  const [freelancerComment, setFreelancerComment] = useState("");

  useEffect(() => {
    loadMissions();
  }, [userId]);

  useEffect(() => {
    if (selectedMission && profileId) {
      loadTimesheet();
      loadTimesheetHistory();
    }
  }, [selectedMission, currentMonth, currentYear, profileId]);

  const loadMissions = async () => {
    const { data: profile } = await supabase
      .from("recruiter_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);

    const { data: missionsData } = await supabase
      .from("freelance_missions")
      .select("id, title, company_name, location, recruiter_tjm, start_date, end_date, duration_text, status, need_id, suggestion_id, recruiter_profile_id")
      .eq("recruiter_profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (missionsData) setMissions(missionsData);
    setLoading(false);
  };

  const loadTimesheet = async () => {
    if (!selectedMission || !profileId) return;
    const { data: ts } = await supabase
      .from("timesheets")
      .select("*")
      .eq("recruiter_profile_id", profileId)
      .eq("need_id", selectedMission.need_id)
      .eq("mission_id", selectedMission.id)
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .maybeSingle();

    if (ts) {
      setTimesheet(ts as any);
      setFreelancerComment((ts as any).freelancer_comment || "");
      const { data: dayData } = await supabase
        .from("timesheet_days")
        .select("*")
        .eq("timesheet_id", ts.id);
      const dayMap: Record<string, number> = {};
      (dayData || []).forEach((d) => { dayMap[d.day_date] = Number(d.value); });
      setDays(dayMap);
    } else {
      setTimesheet(null);
      setFreelancerComment("");
      setDays({});
    }
  };

  const loadTimesheetHistory = async () => {
    if (!selectedMission || !profileId) return;
    const { data } = await supabase
      .from("timesheets")
      .select("id, month, year, total_days, status, submitted_at, rejection_reason")
      .eq("recruiter_profile_id", profileId)
      .eq("need_id", selectedMission.need_id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });
    if (data) setTimesheetHistory(data as any[]);
  };

  const ensureTimesheet = async (): Promise<string | null> => {
    if (timesheet) return timesheet.id;
    if (!selectedMission || !profileId) return null;
    const { data, error } = await supabase
      .from("timesheets")
      .insert({
        suggestion_id: selectedMission.suggestion_id,
        recruiter_profile_id: profileId,
        need_id: selectedMission.need_id,
        mission_id: selectedMission.id,
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
    return data.id;
  };

  const toggleDay = async (dateStr: string) => {
    if (!selectedMission || !profileId) return;
    if (timesheet && !["draft", "client_rejected"].includes(timesheet.status)) return;

    const currentValue = days[dateStr] || 0;
    const nextValue = currentValue === 0 ? 1 : currentValue === 1 ? 0.5 : 0;
    const tsId = await ensureTimesheet();
    if (!tsId) return;

    if (nextValue === 0) {
      await supabase.from("timesheet_days").delete().eq("timesheet_id", tsId).eq("day_date", dateStr);
    } else {
      await supabase.from("timesheet_days").upsert(
        { timesheet_id: tsId, day_date: dateStr, value: nextValue },
        { onConflict: "timesheet_id,day_date" }
      );
    }

    const newDays = { ...days };
    if (nextValue === 0) delete newDays[dateStr];
    else newDays[dateStr] = nextValue;
    setDays(newDays);

    const total = Object.values(newDays).reduce((sum, v) => sum + v, 0);
    await supabase.from("timesheets").update({ total_days: total }).eq("id", tsId);
    if (timesheet) setTimesheet({ ...timesheet, total_days: total });
  };

  const handleSubmit = async () => {
    if (!timesheet) return;
    if (!freelancerComment.trim()) {
      toast({ title: "Commentaire requis", description: "Veuillez ajouter un commentaire de mission avant de soumettre.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const total = Object.values(days).reduce((sum, v) => sum + v, 0);
    const { error } = await supabase
      .from("timesheets")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), total_days: total, freelancer_comment: freelancerComment.trim() } as any)
      .eq("id", timesheet.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTimesheet({ ...timesheet, status: "submitted", total_days: total });
      toast({ title: "CRA envoyé !", description: "Votre CRA a été soumis au client pour validation." });
      loadTimesheetHistory();
    }
    setSaving(false);
  };

  const totalDays = useMemo(() => Object.values(days).reduce((sum, v) => sum + v, 0), [days]);
  const canEdit = !timesheet || ["draft", "client_rejected"].includes(timesheet.status);
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfWeek(currentMonth, currentYear);

  if (loading) return null;
  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
        <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Aucune mission en cours pour le moment.</p>
      </div>
    );
  }

  // === MISSION DETAIL VIEW ===
  if (selectedMission) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedMission(null)} className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour aux missions
        </Button>

        {/* Mission header */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{selectedMission.title}</h2>
                <Badge className={MISSION_STATUS_LABELS[selectedMission.status]?.color || ""}>
                  {MISSION_STATUS_LABELS[selectedMission.status]?.label || selectedMission.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{selectedMission.company_name}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {selectedMission.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedMission.location}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Début : {new Date(selectedMission.start_date).toLocaleDateString("fr-FR")}
                </span>
                {selectedMission.duration_text && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedMission.duration_text}</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">Mon TJM</div>
              <div className="text-2xl font-bold text-primary">{selectedMission.recruiter_tjm}€<span className="text-sm font-normal text-muted-foreground">/j</span></div>
            </div>
          </div>
        </div>

        {/* CRA Section */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Compte-rendu d'activité
          </h3>

          {/* Rejection reason */}
          {timesheet?.status === "client_rejected" && timesheet.rejection_reason && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <strong>Motif du refus :</strong> {timesheet.rejection_reason}
            </div>
          )}

          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
              else setCurrentMonth(currentMonth - 1);
            }}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <span className="text-lg font-semibold min-w-[200px] inline-block">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
              {timesheet && (
                <div className="mt-0.5">
                  <Badge className={TS_STATUS_LABELS[timesheet.status]?.color || ""} >
                    {TS_STATUS_LABELS[timesheet.status]?.label || timesheet.status}
                  </Badge>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => {
              if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
              else setCurrentMonth(currentMonth + 1);
            }}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAY_NAMES.map((d) => (
              <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const date = new Date(currentYear, currentMonth - 1, dayNum);
              const weekend = isWeekend(date);
              const value = days[dateStr] || 0;
              return (
                <button
                  key={dayNum}
                  disabled={weekend || !canEdit}
                  onClick={() => !weekend && canEdit && toggleDay(dateStr)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-medium transition-all sm:text-base ${
                    weekend ? "border-transparent bg-muted/40 text-muted-foreground/40 cursor-default"
                    : value === 1 ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/30"
                    : value === 0.5 ? "border-accent bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
                    : canEdit ? "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    : "border-border bg-card text-foreground cursor-default"
                  }`}
                >
                  <span>{dayNum}</span>
                  {value > 0 && <span className="absolute bottom-0.5 text-[8px] sm:text-[9px] font-semibold">{value === 1 ? "1j" : "½j"}</span>}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-primary bg-primary/15" /> Journée complète</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-accent bg-accent/15" /> Demi-journée</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-border bg-card" /> Non travaillé</span>
            {canEdit && <span className="italic">Cliquez pour basculer : 0 → 1j → ½j → 0</span>}
          </div>

          {/* Comment field */}
          {canEdit && totalDays > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">
                Commentaire de mission <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Décrivez brièvement votre activité ce mois-ci..."
                value={freelancerComment}
                onChange={(e) => setFreelancerComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          )}

          {/* Total & submit */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div>
              <span className="text-2xl font-bold">{totalDays}</span>
              <span className="ml-1 text-sm text-muted-foreground">jour{totalDays > 1 ? "s" : ""} travaillé{totalDays > 1 ? "s" : ""}</span>
              <div className="text-xs text-muted-foreground mt-0.5">
                Montant : <span className="font-semibold text-foreground">{(totalDays * selectedMission.recruiter_tjm).toLocaleString("fr-FR")}€</span>
              </div>
            </div>
            {canEdit && totalDays > 0 && (
              <Button onClick={handleSubmit} disabled={saving || !freelancerComment.trim()} className="gap-2">
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

        {/* Timesheet history */}
        {timesheetHistory.length > 0 && (
          <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Historique des CRA</h3>
            <div className="space-y-2">
              {timesheetHistory.map((ts) => (
                <button
                  key={ts.id}
                  onClick={() => { setCurrentMonth(ts.month); setCurrentYear(ts.year); }}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 ${
                    ts.month === currentMonth && ts.year === currentYear ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <span className="font-medium">{MONTH_NAMES[ts.month - 1]} {ts.year}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{ts.total_days}j</span>
                    <Badge className={TS_STATUS_LABELS[ts.status]?.color || ""}>{TS_STATUS_LABELS[ts.status]?.label || ts.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // === MISSIONS LIST VIEW ===
  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <button
          key={m.id}
          onClick={() => setSelectedMission(m)}
          className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{m.title}</h3>
                <Badge className={MISSION_STATUS_LABELS[m.status]?.color || ""}>
                  {MISSION_STATUS_LABELS[m.status]?.label || m.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{m.company_name}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.location}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(m.start_date).toLocaleDateString("fr-FR")}</span>
                {m.duration_text && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {m.duration_text}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">Mon TJM</div>
              <div className="text-lg font-bold text-primary">{m.recruiter_tjm}€<span className="text-xs font-normal text-muted-foreground">/j</span></div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default FreelanceMissionsSection;
