import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LogOut, Building2, MapPin, Wifi, Euro, Briefcase, Clock, Trash2, Pencil, Sparkles, User, ChevronDown, ChevronUp, Circle, CheckCircle2, Users, Award, MessageCircle, HandHeart, X, Star, Medal, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";
import ChatPanel from "@/components/connect2/ChatPanel";
import { useUnreadCount } from "@/hooks/useChat";
import ClientMissionsSection from "@/components/connect2/ClientMissionsSection";

interface ClientNeed {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  job_title: string;
  profile_types: string[];
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
  mission_location: string;
  remote_policy: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface ProfileSuggestion {
  id: string;
  anonymous_label: string;
  match_score: number;
  match_reasons: string[];
  pipeline_status: string;
  status_updated_at: string | null;
  super_tam?: boolean;
  created_at?: string;
  recruiter_first_name?: string | null;
}

interface AnonymizedProfile {
  first_name: string;
  job_title: string | null;
  skills: string[];
  clients: string[];
  mobility: string[];
  tjm: number | null;
  model: string | null;
  available: boolean | null;
  availability_date: string | null;
  admin_rating: number | null;
  super_tam: boolean | null;
  tech_specialties: string[];
  intro_text: string | null;
  missions: { client_name?: string; profile_types?: string; kpis?: string; duration?: string }[];
  languages: { language: string; level: string }[];
  has_linkedin_license: boolean | null;
  sectors: string[];
  match_score: number;
  match_reasons: string[];
}

const remotePolicyLabels: Record<string, string> = {
  "on-site": "Sur site",
  "hybrid": "Hybride",
  "full-remote": "Full remote",
  "flexible": "Flexible",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  active: { label: "Actif", variant: "default" },
  staffed: { label: "Staffé", variant: "default" },
  closed: { label: "Clôturé", variant: "outline" },
};

const PIPELINE_STEPS = [
  { key: "suggested", label: "Suggéré", icon: Circle, color: "text-muted-foreground" },
  { key: "shortlisted", label: "Shortlisté", icon: Award, color: "text-purple-500" },
  { key: "interview", label: "Entretien", icon: Users, color: "text-amber-500" },
  { key: "validated", label: "Validé", icon: CheckCircle2, color: "text-green-500" },
];

const getPipelineStep = (status: string) => {
  const idx = PIPELINE_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

const ProfileDetailPopup = ({ profile, open, onClose }: { profile: AnonymizedProfile | null; open: boolean; onClose: () => void }) => {
  if (!open || !profile) return null;

  const missions = Array.isArray(profile.missions) ? profile.missions : [];
  const languages = Array.isArray(profile.languages) ? profile.languages : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-xl border border-border bg-card shadow-xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-4 top-4 z-10">
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:h-16 sm:w-16">
              <span className="text-base font-semibold sm:text-lg">{profile.first_name[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold sm:text-xl">{profile.first_name}</h2>
                {profile.super_tam && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground sm:text-xs">
                    <Medal className="h-3 w-3" /> Super TAM
                  </span>
                )}
              </div>
              {profile.job_title && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{profile.job_title}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium">{profile.match_score}% de matching</span>
                <Progress value={profile.match_score} className="h-2 w-24" />
              </div>
            </div>
          </div>

          <Separator className="my-5" />

          {/* Key info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {profile.model && <Badge variant={profile.model === "RPO" ? "default" : "secondary"}>{profile.model}</Badge>}
            {profile.tjm && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-muted-foreground" /> {profile.tjm}€/j</span>}
            {profile.available !== false ? (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> Disponible</span>
            ) : profile.availability_date ? (
              <span className="flex items-center gap-1 text-orange-500"><Clock className="h-4 w-4" /> Dispo. {new Date(profile.availability_date).toLocaleDateString("fr-FR")}</span>
            ) : (
              <span className="flex items-center gap-1 text-orange-500"><Clock className="h-4 w-4" /> Indisponible</span>
            )}
            {(profile.admin_rating ?? 0) > 0 && (
              <span className="flex items-center gap-0.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span>{profile.admin_rating}/5</span></span>
            )}
            {profile.has_linkedin_license && <span className="text-muted-foreground text-xs">Licence Recruiter</span>}
          </div>

          {/* Mobility */}
          {profile.mobility.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" /> {profile.mobility.join(", ")}
            </div>
          )}

          {/* Match reasons */}
          {profile.match_reasons.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Pourquoi ce profil</h3>
              <ul className="space-y-1">
                {profile.match_reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Presentation */}
          {profile.intro_text && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Présentation</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{profile.intro_text}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Métiers recrutés</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Sectors */}
          {profile.sectors.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Secteurs</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.sectors.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Clients */}
          {profile.clients.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Clients majeurs</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.clients.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
              </div>
            </div>
          )}

          {/* Missions */}
          {missions.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Missions réalisées</h3>
              <div className="space-y-3">
                {missions.map((m, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="font-medium">{m.client_name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {m.profile_types && <span>Profils : {m.profile_types}</span>}
                      {m.kpis && <span>KPIs : {m.kpis}</span>}
                      {m.duration && <span>Durée : {m.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Langues</h3>
              <div className="flex flex-wrap gap-2">
                {languages.map((l, i) => (
                  <span key={i} className="flex items-center gap-1 text-sm">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    {l.language} <span className="text-xs text-muted-foreground">({l.level})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tech specialties */}
          {profile.tech_specialties.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Spécialités Tech</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.tech_specialties.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [needs, setNeeds] = useState<ClientNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, ProfileSuggestion[]>>({});
  const [matchingNeedId, setMatchingNeedId] = useState<string | null>(null);
  const [expandedNeedId, setExpandedNeedId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const unreadCount = useUnreadCount(userId);
  const [selectedProfile, setSelectedProfile] = useState<AnonymizedProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"needs" | "missions">("needs");

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/client");
      return;
    }
    setUserId(session.user.id);
    const { data: adminId } = await supabase.rpc("get_admin_user_id" as any);
    if (adminId) setAdminUserId(adminId as string);
    await Promise.all([loadNeeds(session.user.id), loadSuggestions()]);
  };

  const loadNeeds = async (uid: string) => {
    const { data, error } = await supabase
      .from("client_needs" as any)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setNeeds((data as any) || []);
    }
    setLoading(false);
  };

  const loadSuggestions = async () => {
    const { data, error } = await supabase
      .from("profile_suggestions" as any)
      .select("id, need_id, anonymous_label, match_score, match_reasons, pipeline_status, status_updated_at, super_tam, created_at, recruiter_first_name");

    if (!error && data) {
      const grouped: Record<string, ProfileSuggestion[]> = {};
      (data as any[]).forEach((s) => {
        if (!grouped[s.need_id]) grouped[s.need_id] = [];
        grouped[s.need_id].push(s);
      });
      // Sort by match_score descending
      Object.values(grouped).forEach((arr) => arr.sort((a, b) => b.match_score - a.match_score));
      setSuggestions(grouped);
    }
  };

  const handleViewProfile = async (suggestionId: string) => {
    setProfileLoading(suggestionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("get-suggestion-profile", {
        body: { suggestion_id: suggestionId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.profile) {
        setSelectedProfile(data.profile);
      } else {
        toast({ title: "Erreur", description: data?.error || "Profil introuvable", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProfileLoading(null);
    }
  };

  const handleMatch = async (needId: string) => {
    setMatchingNeedId(needId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("match-profiles", {
        body: { need_id: needId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: "Erreur", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Analyse terminée !", description: `${data.suggestions?.length || 0} profils suggérés.` });
        await loadSuggestions();
        setExpandedNeedId(needId);
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'analyser les profils.", variant: "destructive" });
    } finally {
      setMatchingNeedId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("client_needs" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setNeeds(needs.filter((n) => n.id !== id));
      toast({ title: "Besoin supprimé" });
    }
  };

  const handleShortlist = async (suggestionId: string, needId: string, anonymousLabel: string) => {
    const { error } = await supabase
      .from("profile_suggestions" as any)
      .update({ pipeline_status: "shortlisted", status_updated_at: new Date().toISOString() })
      .eq("id", suggestionId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    setSuggestions((prev) => {
      const updated = { ...prev };
      if (updated[needId]) {
        updated[needId] = updated[needId].map((s) =>
          s.id === suggestionId ? { ...s, pipeline_status: "shortlisted" } : s
        );
      }
      return updated;
    });

    toast({ title: "Profil shortlisté !", description: "L'équipe Connect2 va revenir vers vous rapidement." });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke("notify-shortlist", {
          body: { suggestion_id: suggestionId, need_id: needId, anonymous_label: anonymousLabel },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (e) {
      console.error("Failed to notify admin:", e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/client");
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
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Mon espace recrutement</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez vos besoins, missions et CRA.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/client/new-need")} className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Nouveau besoin</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/client/profile")} className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Mon profil</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
          <button
            onClick={() => setActiveTab("needs")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "needs"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mes besoins
          </button>
          <button
            onClick={() => setActiveTab("missions")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "missions"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              Missions en cours
            </span>
          </button>
        </div>

        {activeTab === "missions" ? (
          userId ? <ClientMissionsSection userId={userId} /> : null
        ) : (
        <>
        {needs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">Aucun besoin déposé</h2>
            <p className="mb-6 text-center text-muted-foreground">
              Déposez votre premier besoin en recrutement pour trouver le bon profil.
            </p>
            <Button onClick={() => navigate("/client/new-need")} className="gap-2">
              <Plus className="h-4 w-4" />
              Déposer un besoin
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {needs.map((need) => {
              const statusInfo = statusLabels[need.status] || statusLabels.pending;
              const needSuggestions = suggestions[need.id] || [];
              const isExpanded = expandedNeedId === need.id;
              const isMatching = matchingNeedId === need.id;

              return (
                <div key={need.id} className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
                  <div className="p-6">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold sm:text-lg">{need.job_title}</h3>
                        <p className="text-sm text-muted-foreground">{need.company_name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => navigate(`/client/edit-need/${need.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(need.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {need.profile_types.length > 0 && (
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{need.profile_types.join(", ")}</span>
                      )}
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{need.mission_location}</span>
                      <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5" />{remotePolicyLabels[need.remote_policy] || need.remote_policy}</span>
                      {(need.budget_tjm_min || need.budget_tjm_max) && (
                        <span className="flex items-center gap-1">
                          <Euro className="h-3.5 w-3.5" />
                          {need.budget_tjm_min && need.budget_tjm_max ? `${need.budget_tjm_min} - ${need.budget_tjm_max} €/j` : need.budget_tjm_max ? `Max ${need.budget_tjm_max} €/j` : `Min ${need.budget_tjm_min} €/j`}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(need.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>

                    {need.description && <p className="mt-3 text-sm text-foreground/80">{need.description}</p>}

                    <div className="mt-4 flex items-center gap-3">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => handleMatch(need.id)} disabled={isMatching}>
                        <Sparkles className="h-4 w-4" />
                        {isMatching ? "Analyse en cours..." : needSuggestions.length > 0 ? "Relancer l'analyse" : "Trouver des profils"}
                      </Button>
                      {needSuggestions.length > 0 && (
                        <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => setExpandedNeedId(isExpanded ? null : need.id)}>
                          {needSuggestions.length} profil{needSuggestions.length > 1 ? "s" : ""} suggéré{needSuggestions.length > 1 ? "s" : ""}
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Suggestions with pipeline */}
                  {isExpanded && needSuggestions.length > 0 && (
                    <div className="border-t border-border bg-muted/30 p-6">
                      <h4 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Profils suggérés — Pipeline
                      </h4>
                      <div className="space-y-4">
                        {needSuggestions.map((s) => {
                          const stepIdx = getPipelineStep(s.pipeline_status);
                          const currentStep = PIPELINE_STEPS[stepIdx];
                          const StepIcon = currentStep.icon;
                          const displayName = s.recruiter_first_name || s.anonymous_label;

                          return (
                            <div
                              key={s.id}
                              className="rounded-lg border border-border bg-card p-3 sm:p-4 cursor-pointer transition-colors hover:bg-accent/5"
                              onClick={() => handleViewProfile(s.id)}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                                <div className="flex items-center gap-3 sm:block">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                                    <User className="h-5 w-5 text-accent" />
                                  </div>
                                  <div className="sm:hidden flex-1 min-w-0">
                                    <span className="font-semibold text-sm flex items-center gap-1.5">
                                      {displayName}
                                      {s.super_tam && <span title="Super TAM">🥇</span>}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs font-medium text-muted-foreground">{s.match_score}%</span>
                                      <Progress value={s.match_score} className="h-2 w-20" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="hidden sm:flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm flex items-center gap-1.5">
                                      {displayName}
                                      {s.super_tam && <span title="Super TAM">🥇</span>}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-muted-foreground">{s.match_score}%</span>
                                      <Progress value={s.match_score} className="h-2 w-20" />
                                    </div>
                                  </div>

                                  {/* Pipeline stepper with timeline */}
                                  <div className="mt-1 mb-3 overflow-x-auto sm:overflow-visible">
                                    <div className="flex items-center gap-0 min-w-0">
                                      {PIPELINE_STEPS.map((step, i) => {
                                        const isActive = i <= stepIdx;
                                        const isCurrent = i === stepIdx;
                                        const Icon = step.icon;
                                        // Show date for current step
                                        const stepDate = isCurrent && (s.status_updated_at || s.created_at)
                                          ? new Date(s.status_updated_at || s.created_at!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                                          : i === 0 && isActive && s.created_at
                                          ? new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                                          : null;
                                        return (
                                          <div key={step.key} className="flex items-center">
                                            <div className="flex flex-col items-center">
                                              <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 transition-colors ${
                                                isCurrent
                                                  ? `border-current ${step.color} bg-current/10`
                                                  : isActive
                                                  ? "border-green-500 bg-green-500/10 text-green-500"
                                                  : "border-border bg-background text-muted-foreground/40"
                                              }`}>
                                                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                              </div>
                                              <span className={`mt-1 text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${
                                                isCurrent ? step.color : isActive ? "text-green-500" : "text-muted-foreground/40"
                                              }`}>
                                                {step.label}
                                              </span>
                                              {stepDate && (
                                                <span className="text-[8px] sm:text-[9px] text-muted-foreground whitespace-nowrap">
                                                  {stepDate}
                                                </span>
                                              )}
                                            </div>
                                            {i < PIPELINE_STEPS.length - 1 && (
                                              <div className={`mx-0.5 sm:mx-1 mb-6 h-0.5 w-3 sm:w-6 ${
                                                i < stepIdx ? "bg-green-500" : "bg-border"
                                              }`} />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <ul className="space-y-1">
                                    {s.match_reasons.map((reason, i) => (
                                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                        {reason}
                                      </li>
                                    ))}
                                  </ul>

                                  {/* Shortlist button */}
                                  {s.pipeline_status === "suggested" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-3 gap-2 text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                                      onClick={(e) => { e.stopPropagation(); handleShortlist(s.id, need.id, s.anonymous_label); }}
                                    >
                                      <HandHeart className="h-4 w-4" />
                                      Je souhaite en savoir plus
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {profileLoading === s.id && (
                                <div className="mt-2 text-xs text-muted-foreground animate-pulse">Chargement du profil...</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </main>

      {/* Profile detail popup */}
      <ProfileDetailPopup profile={selectedProfile} open={!!selectedProfile} onClose={() => setSelectedProfile(null)} />

      {/* Floating chat button */}
      {userId && adminUserId && (
        <>
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
            title="Messages"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </button>
          <ChatPanel
            open={chatOpen}
            onOpenChange={setChatOpen}
            currentUserId={userId}
            otherUserId={adminUserId}
            otherUserName="Connect2"
          />
        </>
      )}
    </div>
  );
};

export default ClientDashboard;
