import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
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
import { VERTICALS, isVertical, verticalOf, type Vertical } from "@/lib/verticals";
import { takeHomeBrief } from "@/lib/homeBrief";
import { INDICATIVE_BUDGET } from "@/lib/indicativeBudget";
import { generateNeedTitle } from "@/lib/needTitle";
import { BoltWatermark } from "@/components/brand/Bolt";
import Highlight from "@/components/site/Highlight";
import { loadPendingNeed, savePendingNeed, type PendingNeed } from "@/lib/pendingNeed";
import { palettes } from "@/lib/palettes";
import DesiredStartField from "@/components/platform/DesiredStartField";
import MissionDurationField from "@/components/platform/MissionDurationField";
import EnglishLevelField from "@/components/platform/EnglishLevelField";
import AppShell from "@/components/platform/AppShell";
import Header from "@/components/KistoneHeader";
import OnboardingSteps, { NEED_FIRST_STEPS } from "@/components/platform/OnboardingSteps";
import TagInput from "@/components/platform/TagInput";
import { METIERS, SECTEURS, normalizeMetiers } from "@/lib/taxonomy";


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
  // Parcours public « Partager un besoin » (/besoin) : on qualifie le besoin avant de créer le compte
  const isPublic = useLocation().pathname === "/besoin";
  const [picked, setPicked] = useState(() => !isPublic || isVertical(searchParams.get("fonction")));
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);


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
        if (!isPublic) navigate("/client");
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
  }, [navigate, isPublic]);

  // Arrivée depuis l'accueil (démo ou catalogue de rôles) : toujours en haut de la page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // « Modifier » depuis l'écran de compte : le besoin déjà saisi revient dans le formulaire
  useEffect(() => {
    if (!isPublic || searchParams.get("edit") !== "1") return;
    const draft = loadPendingNeed();
    if (!draft) return;
    if (isVertical(draft.vertical)) setVertical(draft.vertical);
    setProfileTypes(normalizeMetiers(draft.profile_types));
    setSpecialties(draft.specialties ?? []);
    setDays(draft.days_per_week ? String(draft.days_per_week) : "5");
    setBudgetMin(draft.budget_tjm_min ? String(draft.budget_tjm_min) : "");
    setBudgetMax(draft.budget_tjm_max ? String(draft.budget_tjm_max) : "");
    setMissionLocations(draft.mission_location ? draft.mission_location.split(",").map((x) => x.trim()).filter(Boolean) : []);
    setRemotePolicy(draft.remote_policy || "on-site");
    setStart(draft.desired_start ? { asap: false, date: draft.desired_start } : { asap: true, date: "" });
    setDurationMonths(draft.duration_months ?? null);
    setEnglishLevel(draft.english_level ?? null);
    setDescription(draft.description ?? "");
    setSectors(draft.sectors ?? []);
    setPicked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublic]);

  // Besoin tapé sur l'accueil : repris ici et analysé tout de suite par l'IA
  useEffect(() => {
    if (!isPublic) return;
    const brief = takeHomeBrief();
    if (!brief) return;
    handleGenerate(brief);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublic]);

  const handleGenerate = async (text: string) => {
    if (text.trim().length < 10) {
      toast({ title: "Texte trop court", description: "Décrivez votre besoin en au moins quelques phrases.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("parse-need", {
        body: { freeText: text.trim() },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // L'IA ne peut proposer que des valeurs du référentiel : on écarte tout le reste.
      // Fonction détectée par l'IA : spécialités de cette fonction uniquement
      const detected: Vertical = isVertical(data.vertical) ? data.vertical : vertical;
      setVertical(detected);
      setSpecialties((data.specialties ?? []).filter((t: string) => verticalOf(detected).specialties.includes(t)));
      if (typeof data.days_per_week === "number" && data.days_per_week >= 1 && data.days_per_week <= 5) setDays(String(data.days_per_week));
      const metiers = normalizeMetiers(data.profile_types);
      if (metiers.length) setProfileTypes(metiers);
      const secteurs = (data.sectors ?? []).filter((t: string) => (SECTEURS as readonly string[]).includes(t));
      if (secteurs.length) setSectors(secteurs);
      if (data.budget_tjm_min || data.budget_tjm_max) {
        if (data.budget_tjm_min) setBudgetMin(String(data.budget_tjm_min));
        if (data.budget_tjm_max) setBudgetMax(String(data.budget_tjm_max));
      } else {
        // Aucun budget dans le texte : fourchette indicative de la famille, modifiable
        const [lo, hi] = INDICATIVE_BUDGET[detected];
        setBudgetMin(String(lo));
        setBudgetMax(String(hi));
      }
      if (data.mission_location) setMissionLocations(data.mission_location.split(",").map((s: string) => s.trim()).filter(Boolean));
      if (data.remote_policy) setRemotePolicy(data.remote_policy);
      if (typeof data.desired_start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.desired_start)) setStart({ asap: false, date: data.desired_start });
      if (data.description) setDescription(data.description);
      if (typeof data.english_level === "number" && data.english_level >= 2 && data.english_level <= 5) setEnglishLevel(Math.round(data.english_level));
      if (typeof data.duration_months === "number" && data.duration_months >= 1) setDurationMonths(Math.min(12, Math.round(data.duration_months)));

      toast({ title: "Fiche générée !", description: "Vérifiez et complétez les champs ci-dessous." });
    } catch (err: any) {
      toast({ title: "Erreur IA", description: err.message || "Impossible de générer la fiche.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

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
    const need: PendingNeed = {
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
    };
    // Visiteur sans compte : le besoin est gardé, puis enregistré après l'inscription
    if (!userId) {
      setSaving(false);
      savePendingNeed(need);
      navigate("/client?mode=signup&besoin=1");
      return;
    }
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
    <div className={onboarding || isPublic ? "relative isolate min-h-screen overflow-x-clip bg-background" : "min-h-screen bg-background lg:pl-[248px]"}>
      {isPublic && (
        <>
          <BoltWatermark strokeWidth={14} className="-right-48 top-32 h-[820px] w-auto rotate-[14deg]" />
          <BoltWatermark className="-left-16 bottom-24 hidden h-[260px] w-auto rotate-[-18deg] md:block" />
        </>
      )}
      {onboarding || isPublic ? <Header /> : <AppShell role="client" />}
      {isPublic && !picked ? (
        <main className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">De quel profil avez-vous besoin ?</h1>
          <p className="mb-10 text-muted-foreground">Un expert IA en freelance, ou un recruteur pour internaliser vos talents : le formulaire s'adapte à votre besoin.</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {VERTICALS.map((v) => {
              const p = palettes[v.palette];
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => { setVertical(v.id); setPicked(true); window.scrollTo(0, 0); }}
                    className="flex h-full w-full flex-col items-start gap-4 rounded-[28px] border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className="text-xs font-semibold" style={{ color: p.ink }}>[{v.group}]</span>
                    <span className="text-xl font-bold leading-tight">Je recherche {v.seeking.split(" ")[0]} <Highlight>{v.seeking.split(" ").slice(1).join(" ")}</Highlight></span>
                    <span className="text-sm text-muted-foreground">{v.description}</span>
                    <span className="h-1 w-12 rounded-full" style={{ background: p.accent }} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-10 text-sm text-muted-foreground">
            Déjà client ? <Link to="/client" className="font-medium text-foreground underline underline-offset-2">Se connecter</Link>
          </p>
        </main>
      ) : (
      <main className="container mx-auto max-w-2xl px-4 py-12">
        {isPublic ? (
          <>
            <OnboardingSteps steps={NEED_FIRST_STEPS} current={1} />
            <Button variant="ghost" size="sm" onClick={() => setPicked(false)} className="-mt-2 mb-6 gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Changer de profil
            </Button>
          </>
        ) : onboarding ? (
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

        <h1 className="mb-2 text-3xl font-bold">{isPublic ? `Votre besoin ${verticalOf(vertical).short}` : onboarding ? "Déposez votre premier besoin" : "Déposer un besoin"}</h1>
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

        {/* Besoin tapé sur l'accueil : analysé par l'IA, qui pré-remplit le formulaire */}
        {generating && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Analyse de votre besoin en cours : le formulaire se remplit tout seul.
          </div>
        )}

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
            hideFunctionChoice={isPublic}
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
            {saving ? "Enregistrement..." : userId ? "Déposer mon besoin" : "Voir les profils correspondants"}
          </Button>
          {!userId && (
            <p className="text-center text-sm text-muted-foreground">
              Étape suivante : un aperçu des profils qui correspondent, puis votre compte pour les recevoir. Gratuit et sans engagement.
            </p>
          )}
        </form>
      </main>
      )}
    </div>
  );
};

export default ClientNewNeed;
