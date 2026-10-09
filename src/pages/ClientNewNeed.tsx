import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, Mic, MicOff, Plus, X } from "lucide-react";
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
import NeedFunctionFields from "@/components/platform/NeedFunctionFields";
import { isVertical, verticalOf, type Vertical } from "@/lib/verticals";
import DesiredStartField from "@/components/platform/DesiredStartField";
import AppShell from "@/components/platform/AppShell";
import Header from "@/components/KistoneHeader";
import OnboardingSteps from "@/components/platform/OnboardingSteps";
import TagInput from "@/components/platform/TagInput";
import { METIERS, SECTEURS } from "@/lib/taxonomy";


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
  const [generating, setGenerating] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Non supporté", description: "Votre navigateur ne supporte pas la reconnaissance vocale.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = freeText;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interim = transcript;
        }
      }
      setFreeText(finalTranscript + (interim ? " " + interim : ""));
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [freeText, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
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
  const [sectors, setSectors] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/client"); return; }
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

  const handleGenerate = async () => {
    if (freeText.trim().length < 10) {
      toast({ title: "Texte trop court", description: "Décrivez votre besoin en au moins quelques phrases.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("parse-need", {
        body: { freeText: freeText.trim() },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.job_title) setJobTitle(data.job_title);
      // L'IA ne peut proposer que des valeurs du référentiel : on écarte tout le reste.
      // Fonction détectée par l'IA : spécialités de cette fonction uniquement
      const detected: Vertical = isVertical(data.vertical) ? data.vertical : vertical;
      setVertical(detected);
      setSpecialties((data.specialties ?? []).filter((t: string) => verticalOf(detected).specialties.includes(t)));
      if (typeof data.days_per_week === "number" && data.days_per_week >= 1 && data.days_per_week <= 5) setDays(String(data.days_per_week));
      const metiers = (data.profile_types ?? []).filter((t: string) => (METIERS as readonly string[]).includes(t));
      if (metiers.length) setProfileTypes(metiers);
      const secteurs = (data.sectors ?? []).filter((t: string) => (SECTEURS as readonly string[]).includes(t));
      if (secteurs.length) setSectors(secteurs);
      if (data.budget_tjm_min) setBudgetMin(String(data.budget_tjm_min));
      if (data.budget_tjm_max) setBudgetMax(String(data.budget_tjm_max));
      if (data.mission_location) setMissionLocations(data.mission_location.split(",").map((s: string) => s.trim()).filter(Boolean));
      if (data.remote_policy) setRemotePolicy(data.remote_policy);
      if (typeof data.desired_start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.desired_start)) setStart({ asap: false, date: data.desired_start });
      if (data.description) setDescription(data.description);

      toast({ title: "Fiche générée !", description: "Vérifiez et complétez les champs ci-dessous." });
    } catch (err: any) {
      toast({ title: "Erreur IA", description: err.message || "Impossible de générer la fiche.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const budgetIssue = budgetError(budgetMin, budgetMax);
    if (budgetIssue) {
      toast({ title: "Budget TJM", description: budgetIssue, variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase
        .from("client_needs" as any)
        .insert({
          user_id: userId,
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
          job_title: jobTitle,
          vertical,
          profile_types: vertical === "rpo" ? profileTypes : [],
          specialties: vertical === "rpo" ? [] : specialties,
          days_per_week: Number(days) < 5 ? Number(days) : null,
          budget_tjm_min: budgetMin ? parseInt(budgetMin) : null,
          budget_tjm_max: budgetMax ? parseInt(budgetMax) : null,
          mission_location: missionLocations.join(", "),
          remote_policy: remotePolicy,
          desired_start: start.asap || !start.date ? null : start.date,
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
    <div className={onboarding ? "min-h-screen bg-background" : "min-h-screen bg-background lg:pl-[248px]"}>
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
          Décrivez votre besoin en recrutement — nos recruteurs freelances prendront le relais.
          {onboarding && (
            <>
              {" "}
              <button type="button" onClick={() => navigate("/client/dashboard")} className="underline underline-offset-2 hover:text-foreground">
                Passer cette étape
              </button>
            </>
          )}
        </p>

        {/* AI Generation Block */}
        <div className="mb-8 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold">Décrivez votre besoin librement</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Rédigez en quelques phrases ce que vous recherchez. L'IA pré-remplira le formulaire pour vous.
          </p>
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Ex : Je recherche un RPO senior, spécialiste des profils Dev Fullstack en startup, 3 jours sur site à Paris, budget autour des 500-600€/jour, pour une mission de 6 mois..."
            rows={4}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isListening ? "destructive" : "secondary"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={isListening ? stopListening : startListening}
              title={isListening ? "Arrêter la dictée" : "Dicter"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleGenerate}
            disabled={generating || freeText.trim().length < 10}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Générer la fiche
              </>
            )}
          </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job info */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Intitulé du poste recherché</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={vertical === "rpo" ? "Ex : RPO Tech" : `Ex : ${verticalOf(vertical).short} fractional`} required />
          </div>

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

          {/* Budget TJM */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Budget TJM min (€/jour)</Label>
              <Input id="budgetMin" type="number" min={1} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="450" aria-invalid={!!budgetError(budgetMin, budgetMax)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Budget TJM max (€/jour)</Label>
              <Input
                id="budgetMax"
                type="number"
                min={1}
                aria-invalid={!!budgetError(budgetMin, budgetMax)}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="550"
              />
            </div>
          </div>
          {budgetError(budgetMin, budgetMax) && (
            <p className="-mt-4 text-sm text-destructive">{budgetError(budgetMin, budgetMax)}</p>
          )}

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
              placeholder="Décrivez le contexte, les compétences clés, la durée de la mission..."
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
