import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { budgetError } from "@/lib/budget";
import BudgetRangeField from "@/components/platform/BudgetRangeField";
import NeedFunctionFields from "@/components/platform/NeedFunctionFields";
import { isVertical, type Vertical } from "@/lib/verticals";
import { generateNeedTitle } from "@/lib/needTitle";
import DesiredStartField from "@/components/platform/DesiredStartField";
import MissionDurationField from "@/components/platform/MissionDurationField";
import EnglishLevelField from "@/components/platform/EnglishLevelField";
import AppShell from "@/components/platform/AppShell";
import Header from "@/components/KistoneHeader";
import OnboardingSteps from "@/components/platform/OnboardingSteps";
import { SECTEURS } from "@/lib/taxonomy";


const SECTORS = SECTEURS;

const REMOTE_OPTIONS = [
  { value: "on-site", label: "Sur site" },
  { value: "hybrid", label: "Hybride" },
  { value: "full-remote", label: "Full remote" },
  { value: "flexible", label: "Flexible" },
];


const ClientNewNeed = () => {
  const navigate = useNavigate();
  // Étape 2 de l'onboarding client : même formulaire, sans la navigation de l'espace.
  const [searchParams] = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);


  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [profileTypes, setProfileTypes] = useState<string[]>([]);
  // Fonction recherchée (RPO ou département C-Level), spécialités et rythme
  const [vertical, setVertical] = useState<Vertical>(() => {
    let stored: string | null = null;
    try { stored = sessionStorage.getItem("kistone-fonction"); } catch { /* stockage indisponible */ }
    const f = searchParams.get("fonction") ?? stored;
    return isVertical(f) ? f : "rpo";
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [days, setDays] = useState("5");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [missionLocations, setMissionLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [remotePolicy, setRemotePolicy] = useState("on-site");
  // Date d'arrivée souhaitée : dès que possible (desired_start NULL) ou une date précise
  const [start, setStart] = useState<{ asap: boolean; date: string }>({ asap: true, date: "" });
  const [description, setDescription] = useState("");
  const [durationMonths, setDurationMonths] = useState<number | null>(null);
  const [englishLevel, setEnglishLevel] = useState<number | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/client");
        return;
      }
      setUserId(session.user.id);
      setContactEmail(session.user.email || "");

      // Load client profile to pre-fill company & contact
      const { data: profile } = await supabase
        .from("client_profiles" as any)
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        const p = profile as any;
        if (p.company_name) setCompanyName(p.company_name);
        if (p.first_name || p.last_name) setContactName(`${p.first_name} ${p.last_name}`.trim());
        if (p.email) setContactEmail(p.email);
      }
    };
    init();
  }, [navigate]);

  // Arrivée depuis l'accueil (démo ou catalogue de rôles) : toujours en haut de la page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetIssue = budgetError(budgetMin, budgetMax);
    if (budgetIssue) {
      toast({ title: "Budget TJM", description: budgetIssue, variant: "destructive" });
      return;
    }
    setSaving(true);
    // Intitulé rédigé par l'IA à partir du formulaire, pour l'admin et le suivi du besoin
    const title = await generateNeedTitle({
      vertical,
      profileTypes,
      specialties,
      days: Number(days) < 5 ? Number(days) : null,
      location: missionLocations.join(", "),
      remotePolicy,
      durationMonths,
      description: description || null,
    });
    try {
      const { error } = await supabase
        .from("client_needs" as any)
        .insert({
          user_id: userId,
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
          job_title: title,
          vertical,
          profile_types: vertical === "rpo" ? profileTypes : [],
          specialties: vertical === "rpo" ? [] : specialties,
          days_per_week: Number(days) < 5 ? Number(days) : null,
          budget_tjm_min: budgetMin ? parseInt(budgetMin) : null,
          budget_tjm_max: budgetMax ? parseInt(budgetMax) : null,
          mission_location: missionLocations.join(", "),
          remote_policy: remotePolicy,
          desired_start: start.asap || !start.date ? null : start.date,
          duration_months: durationMonths,
          english_level: englishLevel,
          description: description || null,
          sectors,
        });

      if (error) throw error;

      toast({ title: "Besoin déposé !", description: "Votre besoin a été enregistré avec succès." });
      navigate("/client/dashboard");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={onboarding ? "relative isolate min-h-screen overflow-x-clip bg-background" : "min-h-screen bg-background lg:pl-[248px]"}>
      {onboarding ? <Header /> : <AppShell role="client" />}
      <main className="container mx-auto max-w-2xl px-4 py-12">
        {onboarding ? (
          <OnboardingSteps current={2} />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/client/dashboard")}
            className="mb-6 gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Button>
        )}

        <h1 className="mb-2 text-3xl font-bold">{onboarding ? "Déposez votre premier besoin" : "Déposer un besoin"}</h1>
        <p className="mb-8 text-muted-foreground">
          {vertical === "rpo"
            ? "Décrivez votre besoin en recrutement : nos recruteurs freelances prennent le relais."
            : "Décrivez votre besoin : nos experts freelance prennent le relais."}
          {onboarding && (
            <>
              {" "}
              <button type="button" onClick={() => navigate("/client/dashboard")} className="underline underline-offset-2 hover:text-foreground">
                Passer cette étape
              </button>
            </>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile types - mirrors recruiter skills */}
          <NeedFunctionFields
            vertical={vertical}
            onVertical={setVertical}
            profileTypes={profileTypes}
            onProfileTypes={setProfileTypes}
            specialties={specialties}
            onSpecialties={setSpecialties}
            days={days}
            onDays={setDays}
          />

          {/* Secteurs */}
          <div className="space-y-3">
            <Label>Secteur / Environnement</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SECTORS.map((sector) => (
                <label key={sector} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={sectors.includes(sector)}
                    onCheckedChange={(checked) => {
                      if (checked) setSectors([...sectors, sector]);
                      else setSectors(sectors.filter((s) => s !== sector));
                    }}
                  />
                  <span className="text-sm">{sector}</span>
                </label>
              ))}
            </div>
          </div>

          <DesiredStartField asap={start.asap} date={start.date} onChange={setStart} />

          <MissionDurationField value={durationMonths} onChange={setDurationMonths} />
          <EnglishLevelField value={englishLevel} onChange={setEnglishLevel} />

          {/* Budget TJM */}
          <BudgetRangeField
            min={budgetMin}
            max={budgetMax}
            onChange={(lo, hi) => {
              setBudgetMin(lo);
              setBudgetMax(hi);
            }}
          />

          {/* Lieux de mission */}
          <div className="space-y-2">
            <Label>Lieu(x) de la mission</Label>
            <div className="flex gap-2">
              <Input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = locationInput.trim();
                    if (trimmed && !missionLocations.includes(trimmed)) {
                      setMissionLocations([...missionLocations, trimmed]);
                    }
                    setLocationInput("");
                  }
                }}
                placeholder="Ajouter une ville"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const trimmed = locationInput.trim();
                  if (trimmed && !missionLocations.includes(trimmed)) {
                    setMissionLocations([...missionLocations, trimmed]);
                  }
                  setLocationInput("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {missionLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {missionLocations.map((loc) => (
                  <Badge key={loc} variant="secondary" className="gap-1 pr-1">
                    {loc}
                    <button
                      type="button"
                      onClick={() => setMissionLocations(missionLocations.filter((l) => l !== loc))}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Remote policy */}
          <div className="space-y-2">
            <Label>Politique de remote</Label>
            <Select value={remotePolicy} onValueChange={setRemotePolicy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMOTE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description du besoin (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le contexte, les enjeux et les compétences clés..."
              rows={4}
            />
          </div>

          <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={saving}>
            {saving ? "Enregistrement..." : "Déposer mon besoin"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ClientNewNeed;
