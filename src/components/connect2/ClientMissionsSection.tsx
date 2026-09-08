import { useState, useEffect } from "react";
import { Briefcase, MapPin, Calendar, Clock, Check, X, ArrowLeft, Pencil, User, Euro, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientMission {
  id: string;
  title: string;
  company_name: string;
  location: string;
  client_tjm: number;
  start_date: string;
  end_date: string | null;
  duration_text: string | null;
  status: string;
  need_id: string;
  recruiter_profile_id: string;
  // Consultant info (non-anonymized)
  consultant_first_name: string;
  consultant_last_name: string;
  consultant_email: string;
  consultant_phone: string | null;
  consultant_job_title: string | null;
  consultant_photo_url: string | null;
}

interface TimesheetForReview {
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
  submitted: { label: "À valider", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  client_approved: { label: "Validé", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  client_rejected: { label: "Refusé", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  admin_invoiced: { label: "Facturé", color: "bg-accent text-accent-foreground" },
};

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
const getFirstDayOfWeek = (month: number, year: number) => {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
};
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

type View = "list" | "detail" | "cra";

const ClientMissionsSection = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<ClientMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<Record<string, TimesheetForReview[]>>({});

  // Navigation
  const [view, setView] = useState<View>("list");
  const [selectedMission, setSelectedMission] = useState<ClientMission | null>(null);

  // CRA review
  const [selectedTs, setSelectedTs] = useState<TimesheetForReview | null>(null);
  const [days, setDays] = useState<Record<string, number>>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [clientComment, setClientComment] = useState("");
  const [freelancerComment, setFreelancerComment] = useState("");
  const [processing, setProcessing] = useState(false);

  // Edit title
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  useEffect(() => {
    loadMissions();
  }, [userId]);

  const loadMissions = async () => {
    const { data: needs } = await supabase
      .from("client_needs")
      .select("id")
      .eq("user_id", userId);

    if (!needs || needs.length === 0) { setLoading(false); return; }
    const needIds = needs.map((n) => n.id);

    const { data: missionsData } = await supabase
      .from("client_missions")
      .select("id, title, company_name, location, client_tjm, start_date, end_date, duration_text, status, recruiter_profile_id, need_id")
      .in("need_id", needIds)
      .order("created_at", { ascending: false });

    if (!missionsData || missionsData.length === 0) { setLoading(false); return; }

    // Get full consultant profiles (non-anonymized)
    const profileIds = [...new Set(missionsData.map((m) => m.recruiter_profile_id))];
    const { data: profiles } = await supabase
      .from("recruiter_profiles")
      .select("id, first_name, last_name, email, phone, job_title, photo_url")
      .in("id", profileIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p; });

    const list: ClientMission[] = missionsData.map((m) => {
      const p = profileMap[m.recruiter_profile_id] || {};
      return {
        ...m,
        consultant_first_name: p.first_name || "Freelance",
        consultant_last_name: p.last_name || "",
        consultant_email: p.email || "",
        consultant_phone: p.phone || null,
        consultant_job_title: p.job_title || null,
        consultant_photo_url: p.photo_url || null,
      };
    });

    setMissions(list);

    // Load timesheets
    const { data: tsData } = await supabase
      .from("timesheets")
      .select("id, month, year, total_days, status, submitted_at, rejection_reason, need_id, recruiter_profile_id")
      .in("need_id", needIds)
      .in("status", ["submitted", "client_approved", "client_rejected", "admin_invoiced"])
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (tsData) {
      const grouped: Record<string, TimesheetForReview[]> = {};
      list.forEach((m) => {
        grouped[m.id] = (tsData as any[])
          .filter((t) => t.need_id === m.need_id && t.recruiter_profile_id === m.recruiter_profile_id)
          .map((t) => ({
            id: t.id, month: t.month, year: t.year, total_days: t.total_days,
            status: t.status, submitted_at: t.submitted_at, rejection_reason: t.rejection_reason,
          }));
      });
      setTimesheets(grouped);
    }

    setLoading(false);
  };

  const loadDays = async (tsId: string) => {
    const { data } = await supabase
      .from("timesheet_days")
      .select("day_date, value")
      .eq("timesheet_id", tsId);

    const dayMap: Record<string, number> = {};
    (data || []).forEach((d) => { dayMap[d.day_date] = Number(d.value); });
    setDays(dayMap);
  };

  const handleOpenMission = (m: ClientMission) => {
    setSelectedMission(m);
    setView("detail");
    setEditingTitle(false);
  };

  const handleOpenCra = async (ts: TimesheetForReview) => {
    setSelectedTs(ts);
    setShowRejectForm(false);
    setRejectionReason("");
    setClientComment("");
    setView("cra");
    await loadDays(ts.id);
    // Load comments
    const { data } = await supabase
      .from("timesheets")
      .select("freelancer_comment, client_comment")
      .eq("id", ts.id)
      .single();
    if (data) {
      setFreelancerComment((data as any).freelancer_comment || "");
      setClientComment((data as any).client_comment || "");
    }
  };

  const handleBack = () => {
    if (view === "cra") { setView("detail"); setSelectedTs(null); }
    else { setView("list"); setSelectedMission(null); }
  };

  const handleSaveTitle = async () => {
    if (!selectedMission || !editTitle.trim()) return;
    setSavingTitle(true);
    const { error } = await supabase
      .from("missions")
      .update({ title: editTitle.trim() } as any)
      .eq("id", selectedMission.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      const updated = { ...selectedMission, title: editTitle.trim() };
      setSelectedMission(updated);
      setMissions((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      setEditingTitle(false);
      toast({ title: "Nom mis à jour" });
    }
    setSavingTitle(false);
  };

  const handleApprove = async () => {
    if (!selectedTs) return;
    if (!clientComment.trim()) {
      toast({ title: "Commentaire requis", description: "Veuillez ajouter un commentaire de mission avant de valider.", variant: "destructive" });
      return;
    }
    setProcessing(true);
    const { error } = await supabase
      .from("timesheets")
      .update({ status: "client_approved", client_reviewed_at: new Date().toISOString(), client_comment: clientComment.trim() } as any)
      .eq("id", selectedTs.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTimesheets((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key] = updated[key].map((t) => t.id === selectedTs.id ? { ...t, status: "client_approved" } : t);
        });
        return updated;
      });
      setSelectedTs({ ...selectedTs, status: "client_approved" });
      toast({ title: "CRA validé !" });
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedTs || !rejectionReason.trim()) return;
    setProcessing(true);
    const { error } = await supabase
      .from("timesheets")
      .update({ status: "client_rejected", client_reviewed_at: new Date().toISOString(), rejection_reason: rejectionReason.trim() } as any)
      .eq("id", selectedTs.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTimesheets((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key] = updated[key].map((t) => t.id === selectedTs.id ? { ...t, status: "client_rejected" } : t);
        });
        return updated;
      });
      setSelectedTs({ ...selectedTs, status: "client_rejected" });
      toast({ title: "CRA refusé" });
      setShowRejectForm(false);
    }
    setProcessing(false);
  };

  const renderCalendar = (ts: TimesheetForReview) => {
    const daysInMonth = getDaysInMonth(ts.month, ts.year);
    const firstDay = getFirstDayOfWeek(ts.month, ts.year);

    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAY_NAMES.map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${ts.year}-${String(ts.month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const date = new Date(ts.year, ts.month - 1, dayNum);
          const weekend = isWeekend(date);
          const value = days[dateStr] || 0;

          return (
            <div key={dayNum} className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-medium sm:text-base ${
              weekend ? "border-transparent bg-muted/40 text-muted-foreground/40"
              : value === 1 ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/30"
              : value === 0.5 ? "border-accent bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
              : "border-border bg-card text-foreground"
            }`}>
              <span>{dayNum}</span>
              {value > 0 && <span className="absolute bottom-0.5 text-[8px] sm:text-[9px] font-semibold">{value === 1 ? "1j" : "½j"}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement des missions...</div>;

  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
        <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Aucune mission en cours pour le moment.</p>
        <p className="mt-1 text-xs text-muted-foreground">Les missions apparaîtront ici une fois qu'un profil sera validé.</p>
      </div>
    );
  }

  // ========== CRA DETAIL VIEW ==========
  if (view === "cra" && selectedTs && selectedMission) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={handleBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour à la mission
        </Button>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {selectedMission.consultant_first_name} {selectedMission.consultant_last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {MONTH_NAMES[selectedTs.month - 1]} {selectedTs.year}
            </p>
          </div>
          <Badge className={TS_STATUS_LABELS[selectedTs.status]?.color || ""}>
            {TS_STATUS_LABELS[selectedTs.status]?.label || selectedTs.status}
          </Badge>
        </div>

        {renderCalendar(selectedTs)}

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-2xl font-bold">{selectedTs.total_days}</span>
            <span className="ml-1 text-sm text-muted-foreground">jour{selectedTs.total_days > 1 ? "s" : ""}</span>
            <span className="ml-3 text-sm text-muted-foreground">
              soit <span className="font-semibold text-foreground">{(selectedTs.total_days * selectedMission.client_tjm).toLocaleString("fr-FR")}€</span>
            </span>
          </div>

          {/* Freelancer comment */}
          {freelancerComment && (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> Commentaire du consultant
              </div>
              <p className="text-sm">{freelancerComment}</p>
            </div>
          )}

          {/* Client comment field */}
          {selectedTs.status === "submitted" && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">
                Votre commentaire de mission <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Ajoutez votre retour sur la mission ce mois-ci..."
                value={clientComment}
                onChange={(e) => setClientComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          )}

          {selectedTs.status === "submitted" && (
            <div className="mt-4 flex gap-2 justify-end">
              {showRejectForm ? (
                <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-end">
                  <Textarea placeholder="Motif du refus..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="min-w-[200px]" rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>Confirmer</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button variant="outline" className="gap-2 text-destructive border-destructive/30" onClick={() => setShowRejectForm(true)}>
                    <X className="h-4 w-4" /> Refuser
                  </Button>
                  <Button className="gap-2" onClick={handleApprove} disabled={processing || !clientComment.trim()}>
                    <Check className="h-4 w-4" /> Valider le CRA
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== MISSION DETAIL VIEW ==========
  if (view === "detail" && selectedMission) {
    const missionTs = timesheets[selectedMission.id] || [];
    const pendingCount = missionTs.filter((t) => t.status === "submitted").length;

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={handleBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Toutes les missions
        </Button>

        {/* Mission header */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-semibold"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                  />
                  <Button size="sm" onClick={handleSaveTitle} disabled={savingTitle || !editTitle.trim()}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{selectedMission.title}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => { setEditTitle(selectedMission.title); setEditingTitle(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Badge className={MISSION_STATUS_LABELS[selectedMission.status]?.color || ""}>
                    {MISSION_STATUS_LABELS[selectedMission.status]?.label || selectedMission.status}
                  </Badge>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {selectedMission.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedMission.location}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Début : {new Date(selectedMission.start_date).toLocaleDateString("fr-FR")}
                </span>
                {selectedMission.duration_text && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedMission.duration_text}</span>
                )}
                <span className="flex items-center gap-1">
                  <Euro className="h-3.5 w-3.5" /> TJM : {selectedMission.client_tjm}€/j
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Consultant info (non-anonymized) */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Consultant</h3>
            <div className="flex items-center gap-4">
              {selectedMission.consultant_photo_url ? (
                <img
                  src={selectedMission.consultant_photo_url}
                  alt={selectedMission.consultant_first_name}
                  className="h-14 w-14 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="font-semibold text-base">
                  {selectedMission.consultant_first_name} {selectedMission.consultant_last_name}
                </p>
                {selectedMission.consultant_job_title && (
                  <p className="text-sm text-muted-foreground">{selectedMission.consultant_job_title}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {selectedMission.consultant_email && <span>{selectedMission.consultant_email}</span>}
                  {selectedMission.consultant_phone && <span>· {selectedMission.consultant_phone}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CRA section */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Comptes-rendus d'activité
            </h3>
            {pendingCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {pendingCount} à valider
              </Badge>
            )}
          </div>

          {missionTs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun CRA soumis pour cette mission.
            </p>
          ) : (
            <div className="space-y-2">
              {missionTs.map((ts) => (
                <button
                  key={ts.id}
                  onClick={() => handleOpenCra(ts)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-accent/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="font-medium text-sm">
                          {MONTH_NAMES[ts.month - 1]} {ts.year}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {ts.total_days} jour{ts.total_days > 1 ? "s" : ""}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {(ts.total_days * selectedMission.client_tjm).toLocaleString("fr-FR")}€
                        </span>
                      </div>
                    </div>
                    <Badge className={TS_STATUS_LABELS[ts.status]?.color || ""}>
                      {TS_STATUS_LABELS[ts.status]?.label || ts.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== MISSION LIST VIEW ==========
  return (
    <div className="space-y-3">
      {missions.map((m) => {
        const missionTs = timesheets[m.id] || [];
        const pendingCount = missionTs.filter((t) => t.status === "submitted").length;

        return (
          <button
            key={m.id}
            onClick={() => handleOpenMission(m)}
            className="w-full rounded-xl border border-border bg-card p-4 sm:p-5 text-left transition-colors hover:bg-accent/5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">{m.title}</h3>
                  <Badge className={MISSION_STATUS_LABELS[m.status]?.color || ""}>
                    {MISSION_STATUS_LABELS[m.status]?.label || m.status}
                  </Badge>
                  {pendingCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {pendingCount} CRA à valider
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {m.consultant_first_name} {m.consultant_last_name}
                  {m.consultant_job_title && <span className="ml-1 text-xs">· {m.consultant_job_title}</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {m.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {m.location}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {new Date(m.start_date).toLocaleDateString("fr-FR")}
                  </span>
                  {m.duration_text && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {m.duration_text}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">TJM</div>
                <div className="text-lg font-bold text-primary">{m.client_tjm}€<span className="text-xs font-normal text-muted-foreground">/j</span></div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ClientMissionsSection;
