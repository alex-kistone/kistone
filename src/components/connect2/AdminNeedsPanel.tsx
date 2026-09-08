import { useState, useEffect, useMemo } from "react";
import { Building2, User, Plus, Trash2, ChevronDown, GripVertical, Users, Award, CheckCircle2, Circle, Search, Filter, X, Star, AlertTriangle } from "lucide-react";
import CreateMissionDialog from "./CreateMissionDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ClientNeed {
  id: string;
  company_name: string;
  contact_name: string;
  job_title: string;
  profile_types: string[];
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
  mission_location: string;
  remote_policy: string;
  status: string;
  created_at: string;
  user_id: string;
}

interface ProfileSuggestion {
  id: string;
  need_id: string;
  anonymous_label: string;
  match_score: number;
  match_reasons: string[];
  pipeline_status: string;
  recruiter_profile_id: string;
  super_tam?: boolean;
  created_at?: string;
}

interface RecruiterProfile {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  skills: string[] | null;
  sectors: string[] | null;
  model: string | null;
  mobility: string[] | null;
  tjm: number | null;
  admin_rating: number | null;
  languages: any;
  available: boolean | null;
  availability_date: string | null;
  super_tam: boolean | null;
}

const SKILLS_OPTIONS = [
  "Tech", "Data", "Product", "Sales", "Life Science", "Industrie",
  "Energies", "Digital & Marketing", "Fonctions support", "CFO",
  "Banque/Assurance", "Autre",
];

const SECTORS_OPTIONS = [
  "Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie",
];

const PIPELINE_STEPS = [
  { key: "suggested", label: "Suggéré", icon: Circle, color: "text-muted-foreground", bg: "bg-muted/50" },
  { key: "shortlisted", label: "Shortlisté", icon: Award, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { key: "interview", label: "Entretien", icon: Users, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "validated", label: "Validé", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
];

interface AdminNeedsPanelProps {
  initialNeedId?: string | null;
}

const AdminNeedsPanel = ({ initialNeedId }: AdminNeedsPanelProps = {}) => {
  const { toast } = useToast();
  const [needs, setNeeds] = useState<ClientNeed[]>([]);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [recruiterNames, setRecruiterNames] = useState<Record<string, string>>({});
  const [recruiterProfiles, setRecruiterProfiles] = useState<RecruiterProfile[]>([]);
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [addingToNeedId, setAddingToNeedId] = useState<string | null>(null);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<string | null>(null);
  // Mission creation dialog
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [missionDialogData, setMissionDialogData] = useState<{
    suggestionId: string;
    needId: string;
    recruiterProfileId: string;
    recruiterName: string;
    recruiterTjm: number | null;
    needTitle: string;
    companyName: string;
    missionLocation: string;
  } | null>(null);
  // Suggestion filters
  const [suggestSearch, setSuggestSearch] = useState("");
  const [suggestModel, setSuggestModel] = useState("all");
  const [suggestMobility, setSuggestMobility] = useState("");
  const [suggestSkills, setSuggestSkills] = useState<string[]>([]);
  const [suggestSectors, setSuggestSectors] = useState<string[]>([]);
  const [suggestRating, setSuggestRating] = useState(0);
  const [suggestTjmRange, setSuggestTjmRange] = useState<[number, number]>([0, 1500]);
  const [suggestTjmActive, setSuggestTjmActive] = useState(false);
  const [suggestAvailability, setSuggestAvailability] = useState("all"); // "all" | "available" | "soon"

  useEffect(() => {
    loadData();
  }, []);

  // Auto-select first need (or initialNeedId if provided and exists)
  useEffect(() => {
    if (needs.length > 0 && !selectedNeedId) {
      if (initialNeedId && needs.some((n) => n.id === initialNeedId)) {
        setSelectedNeedId(initialNeedId);
      } else {
        setSelectedNeedId(needs[0].id);
      }
    }
  }, [needs, selectedNeedId, initialNeedId]);

  // React to initialNeedId change after load
  useEffect(() => {
    if (initialNeedId && needs.some((n) => n.id === initialNeedId)) {
      setSelectedNeedId(initialNeedId);
    }
  }, [initialNeedId, needs]);

  const loadData = async () => {
    const [needsRes, suggestionsRes, profilesRes] = await Promise.all([
      supabase.from("client_needs" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("profile_suggestions" as any).select("id, need_id, anonymous_label, match_score, match_reasons, pipeline_status, recruiter_profile_id, super_tam, created_at"),
      supabase.from("recruiter_profiles" as any).select("id, first_name, last_name, job_title, skills, sectors, model, mobility, tjm, admin_rating, languages, available, availability_date, super_tam"),
    ]);

    if (!needsRes.error) setNeeds((needsRes.data as any) || []);
    if (!suggestionsRes.error) setSuggestions((suggestionsRes.data as any) || []);
    if (!profilesRes.error && profilesRes.data) {
      const names: Record<string, string> = {};
      (profilesRes.data as any[]).forEach((p) => {
        names[p.id] = `${p.first_name} ${p.last_name}`;
      });
      setRecruiterNames(names);
      setRecruiterProfiles(profilesRes.data as any);
    }
    setLoading(false);
  };

  const updatePipelineStatus = async (suggestionId: string, newStatus: string) => {
    const { error } = await supabase
      .from("profile_suggestions" as any)
      .update({ pipeline_status: newStatus, status_updated_at: new Date().toISOString() })
      .eq("id", suggestionId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestionId ? { ...s, pipeline_status: newStatus } : s))
      );
    }
  };

  const deleteSuggestion = async (suggestionId: string) => {
    const { error } = await supabase
      .from("profile_suggestions" as any)
      .delete()
      .eq("id", suggestionId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      toast({ title: "Suggestion supprimée" });
    }
  };

  const addManualSuggestion = async (needId: string) => {
    if (!selectedRecruiterId) return;
    const existingCount = suggestions.filter((s) => s.need_id === needId).length;
    const label = `Profil ${String.fromCharCode(65 + existingCount)}`;

    // Build descriptive match_reasons from profile data
    const profile = recruiterProfiles.find((p) => p.id === selectedRecruiterId);
    const reasons: string[] = [];
    if (profile) {
      if (profile.job_title) reasons.push(profile.job_title);
      if (profile.model) reasons.push(`Modèle : ${profile.model}`);
      if (profile.skills?.length) reasons.push(`Métiers : ${profile.skills.slice(0, 4).join(", ")}`);
      if (profile.sectors?.length) reasons.push(`Secteurs : ${profile.sectors.slice(0, 3).join(", ")}`);
      if (profile.mobility?.length) reasons.push(`Mobilité : ${profile.mobility.slice(0, 3).join(", ")}`);
      if (profile.tjm) reasons.push(`TJM : ${profile.tjm}€/jour`);
      if (profile.available) {
        reasons.push("Disponible immédiatement");
      } else if (profile.availability_date) {
        reasons.push(`Disponible le ${new Date(profile.availability_date).toLocaleDateString("fr-FR")}`);
      }
      if (profile.super_tam) reasons.push("Super TAM");
    }
    if (reasons.length === 0) reasons.push("Sélection manuelle par l'admin");

    const { data, error } = await supabase
      .from("profile_suggestions" as any)
      .insert({
        need_id: needId,
        recruiter_profile_id: selectedRecruiterId,
        anonymous_label: label,
        match_score: 100,
        match_reasons: reasons,
        pipeline_status: "suggested",
        recruiter_first_name: profile?.first_name || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      // Insert at the beginning so it appears on top
      setSuggestions((prev) => [data as any, ...prev]);
      toast({ title: "Profil ajouté", description: `${recruiterNames[selectedRecruiterId]} suggéré au client` });
      setAddingToNeedId(null);
      setSelectedRecruiterId("");
    }
  };

  const getAvailableRecruiters = (needId: string) => {
    const alreadySuggested = suggestions.filter((s) => s.need_id === needId).map((s) => s.recruiter_profile_id);
    return recruiterProfiles.filter((p) => !alreadySuggested.includes(p.id));
  };

  // #11 - Duplicate detection: was this profile already proposed to the SAME client on ANOTHER need?
  const getDuplicateInfo = (recruiterProfileId: string, currentNeedId: string) => {
    const currentNeed = needs.find((n) => n.id === currentNeedId);
    if (!currentNeed) return null;
    // Other needs from the same client (same user_id)
    const otherNeedsForClient = needs.filter(
      (n) => n.id !== currentNeedId && n.user_id === currentNeed.user_id
    );
    if (otherNeedsForClient.length === 0) return null;
    const otherNeedIds = new Set(otherNeedsForClient.map((n) => n.id));
    const matches = suggestions.filter(
      (s) => s.recruiter_profile_id === recruiterProfileId && otherNeedIds.has(s.need_id)
    );
    if (matches.length === 0) return null;
    // Build summary of where it was proposed
    const details = matches.map((m) => {
      const need = needs.find((n) => n.id === m.need_id);
      const step = PIPELINE_STEPS.find((p) => p.key === m.pipeline_status);
      return {
        jobTitle: need?.job_title || "—",
        statusLabel: step?.label || m.pipeline_status,
      };
    });
    return { count: matches.length, details };
  };

  const filteredAvailableRecruiters = useMemo(() => {
    if (!selectedNeedId) return [];
    let result = getAvailableRecruiters(selectedNeedId);

    if (suggestSearch) {
      const q = suggestSearch.toLowerCase();
      result = result.filter(
        (p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          p.job_title?.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (suggestModel !== "all") {
      result = result.filter((p) => p.model?.includes(suggestModel));
    }
    if (suggestMobility) {
      result = result.filter((p) =>
        p.mobility?.some((c) => c.toLowerCase() === suggestMobility.toLowerCase())
      );
    }
    if (suggestTjmActive) {
      result = result.filter(
        (p) => p.tjm != null && p.tjm >= suggestTjmRange[0] && p.tjm <= suggestTjmRange[1]
      );
    }
    if (suggestSkills.length > 0) {
      result = result.filter((p) =>
        suggestSkills.some((skill) => p.skills?.includes(skill))
      );
    }
    if (suggestSectors.length > 0) {
      result = result.filter((p) =>
        suggestSectors.some((sector) => p.sectors?.includes(sector))
      );
    }
    if (suggestRating > 0) {
      result = result.filter((p) => (p.admin_rating ?? 0) >= suggestRating);
    }

    if (suggestAvailability === "available") {
      result = result.filter((p) => p.available === true);
    } else if (suggestAvailability === "soon") {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      result = result.filter((p) => {
        if (p.available) return true;
        if (p.availability_date) {
          return new Date(p.availability_date) <= in30Days;
        }
        return false;
      });
    }

    return result;
  }, [selectedNeedId, recruiterProfiles, suggestions, suggestSearch, suggestModel, suggestMobility, suggestTjmActive, suggestTjmRange, suggestSkills, suggestSectors, suggestRating, suggestAvailability]);

  const allCitiesForSuggest = useMemo(() => {
    const cities = new Set<string>();
    recruiterProfiles.forEach((p) => p.mobility?.forEach((c) => cities.add(c)));
    return Array.from(cities).sort();
  }, [recruiterProfiles]);

  const suggestFilterCount = [
    suggestModel !== "all",
    suggestMobility !== "",
    suggestTjmActive,
    suggestSkills.length > 0,
    suggestSectors.length > 0,
    suggestRating > 0,
    suggestAvailability !== "all",
  ].filter(Boolean).length;

  const clearSuggestFilters = () => {
    setSuggestSearch("");
    setSuggestModel("all");
    setSuggestMobility("");
    setSuggestTjmRange([0, 1500]);
    setSuggestTjmActive(false);
    setSuggestSkills([]);
    setSuggestSectors([]);
    setSuggestRating(0);
    setSuggestAvailability("all");
  };

  const getNeedSuggestions = (needId: string, stepKey: string) =>
    suggestions
      .filter((s) => s.need_id === needId && s.pipeline_status === stepKey)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const handleDragStart = (suggestionId: string) => {
    setDragItem(suggestionId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stepKey: string) => {
    e.preventDefault();
    if (dragItem) {
      if (stepKey === "validated") {
        // Open mission creation dialog instead of directly updating
        const suggestion = suggestions.find((s) => s.id === dragItem);
        if (suggestion) {
          const need = needs.find((n) => n.id === suggestion.need_id);
          const profile = recruiterProfiles.find((p) => p.id === suggestion.recruiter_profile_id);
          setMissionDialogData({
            suggestionId: suggestion.id,
            needId: suggestion.need_id,
            recruiterProfileId: suggestion.recruiter_profile_id,
            recruiterName: recruiterNames[suggestion.recruiter_profile_id] || suggestion.anonymous_label,
            recruiterTjm: profile?.tjm || null,
            needTitle: need?.job_title || "Mission",
            companyName: need?.company_name || "",
            missionLocation: need?.mission_location || "",
          });
          setMissionDialogOpen(true);
        }
      } else {
        updatePipelineStatus(dragItem, stepKey);
      }
      setDragItem(null);
    }
  };

  const selectedNeed = needs.find((n) => n.id === selectedNeedId);
  const totalSuggestionsForNeed = selectedNeedId
    ? suggestions.filter((s) => s.need_id === selectedNeedId).length
    : 0;

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement des besoins clients...</div>;

  if (needs.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Aucun besoin client déposé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Need selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Select value={selectedNeedId || ""} onValueChange={setSelectedNeedId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Sélectionner un besoin..." />
            </SelectTrigger>
            <SelectContent>
              {needs.map((n) => {
                const count = suggestions.filter((s) => s.need_id === n.id).length;
                return (
                  <SelectItem key={n.id} value={n.id}>
                    <span className="flex items-center gap-2">
                      {n.job_title} — {n.company_name}
                      {count > 0 && (
                        <Badge variant="secondary" className="text-[10px] ml-1">{count}</Badge>
                      )}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {selectedNeed && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{selectedNeed.mission_location}</span>
              <span>•</span>
              <span>{selectedNeed.remote_policy}</span>
              {(selectedNeed.budget_tjm_min || selectedNeed.budget_tjm_max) && (
                <>
                  <span>•</span>
                  <span>{selectedNeed.budget_tjm_min || "?"}-{selectedNeed.budget_tjm_max || "?"} €/j</span>
                </>
              )}
            </div>
          )}
        </div>

        {selectedNeedId && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={() => {
              setAddingToNeedId(addingToNeedId === selectedNeedId ? null : selectedNeedId);
              setSelectedRecruiterId("");
              clearSuggestFilters();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Suggérer un profil
          </Button>
        )}
      </div>

      {/* Add manual suggestion with filters */}
      {addingToNeedId && selectedNeedId && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
          {/* Search + filters row */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={suggestSearch}
                onChange={(e) => setSuggestSearch(e.target.value)}
                placeholder="Rechercher par nom, compétence..."
                className="pl-10 h-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />

              <Select value={suggestAvailability} onValueChange={setSuggestAvailability}>
                <SelectTrigger className="h-7 w-auto min-w-[110px] text-xs">
                  <SelectValue placeholder="Disponibilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="soon">Dispo. sous 30j</SelectItem>
                </SelectContent>
              </Select>

              <Select value={suggestModel} onValueChange={setSuggestModel}>
                <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
                  <SelectValue placeholder="Modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous modèles</SelectItem>
                  <SelectItem value="RPO">RPO</SelectItem>
                  
                </SelectContent>
              </Select>

              <Select value={suggestMobility || "all"} onValueChange={(v) => setSuggestMobility(v === "all" ? "" : v)}>
                <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
                  <SelectValue placeholder="Mobilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes villes</SelectItem>
                  {allCitiesForSuggest.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-7 text-xs ${suggestTjmActive ? "border-primary text-primary" : ""}`}>
                    {suggestTjmActive ? `${suggestTjmRange[0]}€ - ${suggestTjmRange[1]}€` : "TJM"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3" align="start">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">TJM (€/jour)</Label>
                    <div className="flex items-center gap-1.5">
                      <Checkbox checked={suggestTjmActive} onCheckedChange={(c) => setSuggestTjmActive(!!c)} />
                      <span className="text-[10px] text-muted-foreground">Activer</span>
                    </div>
                  </div>
                  <Slider min={0} max={1500} step={50} value={suggestTjmRange} onValueChange={(v) => { setSuggestTjmRange(v as [number, number]); setSuggestTjmActive(true); }} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{suggestTjmRange[0]}€</span><span>{suggestTjmRange[1]}€</span>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-7 text-xs ${suggestSkills.length > 0 ? "border-primary text-primary" : ""}`}>
                    Métiers {suggestSkills.length > 0 && `(${suggestSkills.length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 space-y-2" align="start">
                  <Label className="text-xs font-medium">Métiers recrutés</Label>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {SKILLS_OPTIONS.map((skill) => (
                      <label key={skill} className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={suggestSkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) setSuggestSkills([...suggestSkills, skill]);
                            else setSuggestSkills(suggestSkills.filter((s) => s !== skill));
                          }}
                        />
                        <span className="text-xs">{skill}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-7 text-xs ${suggestSectors.length > 0 ? "border-primary text-primary" : ""}`}>
                    Secteurs {suggestSectors.length > 0 && `(${suggestSectors.length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 space-y-2" align="start">
                  <Label className="text-xs font-medium">Secteurs</Label>
                  <div className="space-y-1">
                    {SECTORS_OPTIONS.map((sector) => (
                      <label key={sector} className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={suggestSectors.includes(sector)}
                          onCheckedChange={(checked) => {
                            if (checked) setSuggestSectors([...suggestSectors, sector]);
                            else setSuggestSectors(suggestSectors.filter((s) => s !== sector));
                          }}
                        />
                        <span className="text-xs">{sector}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-7 gap-1 text-xs ${suggestRating > 0 ? "border-primary text-primary" : ""}`}>
                    <Star className={`h-3 w-3 ${suggestRating > 0 ? "fill-amber-400 text-amber-400" : ""}`} />
                    {suggestRating > 0 ? `≥ ${suggestRating}★` : "Note"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 space-y-2" align="start">
                  <Label className="text-xs font-medium">Note admin min.</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setSuggestRating(suggestRating === star ? 0 : star)} className="transition-transform hover:scale-110">
                        <Star className={`h-4 w-4 ${suggestRating >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {suggestFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] text-muted-foreground" onClick={clearSuggestFilters}>
                  <X className="h-3 w-3" /> Réinitialiser ({suggestFilterCount})
                </Button>
              )}
            </div>
          </div>

          {/* Filtered results */}
          <ScrollArea className="max-h-[240px]">
            <div className="space-y-1.5">
              {filteredAvailableRecruiters.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">Aucun profil trouvé avec ces filtres.</p>
              ) : (
                filteredAvailableRecruiters.map((p) => {
                  const dup = selectedNeedId ? getDuplicateInfo(p.id, selectedNeedId) : null;
                  return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer transition-colors text-sm",
                      selectedRecruiterId === p.id
                        ? "border-primary bg-primary/10"
                        : dup
                        ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                        : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedRecruiterId(p.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-xs truncate">{p.first_name} {p.last_name}</span>
                        {p.super_tam && <span title="Super TAM">🥇</span>}
                        {p.model && <Badge variant="secondary" className="text-[9px] h-4">{p.model}</Badge>}
                        {p.available ? (
                          <Badge variant="outline" className="text-[9px] h-4 text-green-600 border-green-300">Dispo</Badge>
                        ) : p.availability_date ? (
                          <Badge variant="outline" className="text-[9px] h-4 text-orange-500 border-orange-300">
                            {new Date(p.availability_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </Badge>
                        ) : null}
                        {dup && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 gap-0.5 text-orange-700 border-orange-400 bg-orange-100/60 dark:text-orange-300 dark:bg-orange-950/40"
                            title={dup.details.map((d) => `${d.jobTitle} → ${d.statusLabel}`).join("\n")}
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Déjà proposé ×{dup.count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        {p.job_title && <span className="truncate">{p.job_title}</span>}
                        {p.tjm && <span>{p.tjm}€/j</span>}
                        {(p.admin_rating ?? 0) > 0 && <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{p.admin_rating}</span>}
                      </div>
                      {dup && (
                        <p className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5 truncate">
                          → {dup.details.map((d) => `${d.jobTitle} (${d.statusLabel})`).join(" • ")}
                        </p>
                      )}
                    </div>
                    {selectedRecruiterId === p.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">{filteredAvailableRecruiters.length} profil(s) disponible(s)</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAddingToNeedId(null); setSelectedRecruiterId(""); clearSuggestFilters(); }}>
                Annuler
              </Button>
              <Button size="sm" className="h-8" disabled={!selectedRecruiterId} onClick={() => addManualSuggestion(selectedNeedId)}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      {selectedNeedId && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STEPS.map((step) => {
            const StepIcon = step.icon;
            const items = getNeedSuggestions(selectedNeedId, step.key);

            return (
              <div
                key={step.key}
                className={cn(
                  "flex min-w-[220px] flex-1 flex-col rounded-xl border border-border",
                  step.bg
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, step.key)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
                  <StepIcon className={cn("h-4 w-4", step.color)} />
                  <span className="text-xs font-semibold">{step.label}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] h-5 min-w-5 justify-center">
                    {items.length}
                  </Badge>
                </div>

                {/* Column content */}
                <div className="flex-1 space-y-2 p-2 min-h-[120px]">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => handleDragStart(s.id)}
                      className={cn(
                        "group relative rounded-lg border border-border bg-card p-3 cursor-grab shadow-sm transition-shadow hover:shadow-md",
                        dragItem === s.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">
                              {recruiterNames[s.recruiter_profile_id] || s.anonymous_label}
                            </span>
                            {s.super_tam && <span title="Super TAM">🥇</span>}
                          </div>
                          <span className="text-[10px] text-muted-foreground">({recruiterProfiles.find((p) => p.id === s.recruiter_profile_id)?.first_name || s.anonymous_label})</span>
                          {s.match_score > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Progress value={s.match_score} className="h-1.5 flex-1" />
                              <span className="text-[10px] text-muted-foreground font-medium">{s.match_score}%</span>
                            </div>
                          )}
                          {s.match_reasons.length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {s.match_reasons.slice(0, 2).map((r, i) => (
                                <p key={i} className="text-[10px] text-muted-foreground leading-tight">• {r}</p>
                              ))}
                              {s.match_reasons.length > 2 && (
                                <p className="text-[10px] text-muted-foreground/60">+{s.match_reasons.length - 2} autre{s.match_reasons.length - 2 > 1 ? "s" : ""}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Retirer cette suggestion ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Le profil {recruiterNames[s.recruiter_profile_id] || s.anonymous_label} sera retiré des suggestions pour ce besoin.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSuggestion(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Retirer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[80px] rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground/50">
                      Glissez ici
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!selectedNeedId && (
        <div className="py-12 text-center text-muted-foreground">
          Sélectionnez un besoin pour voir le pipeline.
        </div>
      )}

      {/* Mission creation dialog */}
      {missionDialogData && (
        <CreateMissionDialog
          open={missionDialogOpen}
          onClose={() => { setMissionDialogOpen(false); setMissionDialogData(null); }}
          suggestionId={missionDialogData.suggestionId}
          needId={missionDialogData.needId}
          recruiterProfileId={missionDialogData.recruiterProfileId}
          recruiterName={missionDialogData.recruiterName}
          recruiterTjm={missionDialogData.recruiterTjm}
          needTitle={missionDialogData.needTitle}
          companyName={missionDialogData.companyName}
          missionLocation={missionDialogData.missionLocation}
          onMissionCreated={() => {
            // Update local state: suggestion to validated, need to staffed
            setSuggestions((prev) =>
              prev.map((s) => s.id === missionDialogData.suggestionId ? { ...s, pipeline_status: "validated" } : s)
            );
            setNeeds((prev) =>
              prev.map((n) => n.id === missionDialogData.needId ? { ...n, status: "staffed" } : n)
            );
            setMissionDialogData(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminNeedsPanel;
