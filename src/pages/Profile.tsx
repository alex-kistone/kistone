import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarIcon, Upload, Linkedin, LogOut, MessageCircle, Plus, Trash2, Globe, X, Sparkles, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DeleteAccountButton from "@/components/platform/DeleteAccountButton";
import ExportDataButton from "@/components/platform/ExportDataButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/platform/AppShell";
import TagInput from "@/components/platform/TagInput";
import LinkedinRequiredDialog from "@/components/platform/LinkedinRequiredDialog";
import { LINKEDIN_HINT, normalizeLinkedinUrl } from "@/lib/linkedin";
import ChatPanel from "@/components/platform/ChatPanel";
import { useUnreadCount } from "@/hooks/useChat";
import { Badge } from "@/components/ui/badge";
import FreelanceMissionsSection from "@/components/platform/FreelanceMissionsSection";
import KycDossierPanel from "@/components/platform/KycDossierPanel";
import ProfileCompletionChecklist from "@/components/platform/ProfileCompletionChecklist";
import { METIERS } from "@/lib/taxonomy";
import { functionErrorMessage } from "@/components/platform/admin/adv";
import { LANGUAGES, MAX_CHOICES, MODELS } from "@/lib/jarvi";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  // Profil existant sans URL LinkedIn valide : fenêtre bloquante jusqu'à la saisie
  const [linkedinGate, setLinkedinGate] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const [firstVisit, setFirstVisit] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [mobility, setMobility] = useState<string[]>([]);
  const [tjm, setTjm] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [available, setAvailable] = useState(true);
  const [availability, setAvailability] = useState<Date>();
  const [introText, setIntroText] = useState("");
  const [missions, setMissions] = useState<{ client_name: string; profile_types: string; kpis: string; duration: string; tools?: string[]; tools_input?: string }[]>([]);
  const [languages, setLanguages] = useState<{ language: string; level: string }[]>([]);
  const [hasLinkedinLicense, setHasLinkedinLicense] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [remotePreference, setRemotePreference] = useState<string>("");
  const [sectorOther, setSectorOther] = useState("");
  // Informations société : gérées par « Mon dossier » ; lues ici pour la liste de complétion
  // Onglet piloté par le menu latéral (?tab=missions | admin)
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const requestedTab: "profile" | "missions" | "admin" = tabParam === "missions" || tabParam === "admin" ? tabParam : "profile";
  // Missions et dossier n'existent qu'une fois le profil créé
  const activeTab = existingId ? requestedTab : "profile";
  const [optimizing, setOptimizing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const unreadCount = useUnreadCount(userId);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/register");
      return;
    }
    setUserId(session.user.id);
    setEmail(session.user.email || "");

    // /profile est l'espace freelance : l'admin et le client sont renvoyés vers le leur
    const [{ data: isAdmin }, { data: isClient }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "client" }),
    ]);
    if (isAdmin || isClient) {
      navigate(isAdmin ? "/dashboard" : "/client/dashboard", { replace: true });
      return;
    }

    // Load existing profile
    const { data } = await supabase
      .from("recruiter_profiles" as any)
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data) {
      const p = data as any;
      setExistingId(p.id);
      setFirstName(p.first_name || "");
      setLastName(p.last_name || "");
      setPhone(p.phone || "");
      setLinkedin(p.linkedin_url || "");
      if (!normalizeLinkedinUrl(p.linkedin_url)) setLinkedinGate(true);
      setJobTitle(p.job_title || "");
      setSkills(p.skills || []);
      setClients(p.clients || []);
      setMobility(p.mobility || []);
      setTjm(p.tjm?.toString() || "");
      setModels(p.model ? (p.model.includes(",") ? p.model.split(",") : [p.model]) : []);
      setAvailable(p.available !== false);
      setPhotoPreview(p.photo_url || null);
      if (p.availability_date) setAvailability(new Date(p.availability_date));
      setIntroText(p.intro_text || "");
      setMissions(p.missions || []);
      setLanguages(p.languages || []);
      setHasLinkedinLicense(p.has_linkedin_license || false);
      const loadedSectors: string[] = p.sectors || [];
      const knownSectors = ["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie"];
      setSectors(loadedSectors.filter((s: string) => knownSectors.includes(s)));
      const otherSector = loadedSectors.find((s: string) => !knownSectors.includes(s));
      if (otherSector) {
        setSectors((prev) => [...prev, "Autre"]);
        setSectorOther(otherSector);
      }
      setRemotePreference(p.remote_preference || "");
    } else {
      // Première connexion : on pré-remplit avec le compte LinkedIn / Google, puis
      // on exige l'URL LinkedIn avant d'accéder au profil.
      const meta = (session.user.user_metadata ?? {}) as Record<string, string | undefined>;
      const fullName = (meta.full_name ?? meta.name ?? "").trim();
      setFirstName(meta.given_name ?? fullName.split(" ")[0] ?? "");
      setLastName(meta.family_name ?? fullName.split(" ").slice(1).join(" "));
      setFirstVisit(true);
      setLinkedinGate(true);
    }

    // Load admin user_id for chat
    const { data: adminId } = await supabase.rpc("get_admin_user_id" as any);
    if (adminId) setAdminUserId(adminId as string);

    setLoading(false);
  };

  /**
   * Enregistre l'URL LinkedIn dès la saisie (clé de synchronisation Jarvi). À la
   * première visite, crée le profil freelance, encore incomplet : il n'entre dans le
   * matching qu'une fois le TJM et les métiers renseignés.
   */
  const saveLinkedinUrl = async (url: string): Promise<string | null> => {
    if (existingId) {
      const { error } = await supabase.from("recruiter_profiles").update({ linkedin_url: url }).eq("id", existingId);
      if (error) return error.message;
    } else {
      const { data, error } = await supabase
        .from("recruiter_profiles")
        .insert({ user_id: userId, email, first_name: firstName, last_name: lastName, linkedin_url: url })
        .select("id")
        .single();
      if (error) return error.message.includes("ROLE_CONFLICT")
        ? "Cette adresse est déjà utilisée pour un espace client."
        : error.message;
      setExistingId(data.id);
      importAccountPhoto(data.id);
    }
    setLinkedin(url);
    setLinkedinGate(false);
    return null;
  };

  /** Copie la photo du compte LinkedIn / Google dans notre stockage (le lien d'origine expire). */
  const importAccountPhoto = async (profileId: string) => {
    const { data } = await supabase.functions.invoke("import-oauth-avatar");
    const url = (data as { photo_url?: string | null } | null)?.photo_url;
    if (!url) return;
    await supabase.from("recruiter_profiles").update({ photo_url: url }).eq("id", profileId);
    setPhotoPreview(url);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  /** Checklist : amène à la section manquante, met le curseur dans le champ et la fait briller. */
  const scrollToSection = (key: string) => {
    const targets: Record<string, string> = {
      photo: "section-photo", identity: phone ? "firstName" : "phone", linkedin: "linkedin", jobTitle: "jobTitle",
      tjm: "tjm", skills: "section-skills", sectors: "section-sectors", intro: "introText",
      missions: "section-missions", languages: "section-languages", mobility: "section-mobility",
    };
    const el = document.getElementById(targets[key] ?? "");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
    const box = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.parentElement ?? el : el;
    box.classList.add("ring-2", "ring-primary", "ring-offset-4");
    window.setTimeout(() => box.classList.remove("ring-2", "ring-primary", "ring-offset-4"), 1800);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // URL LinkedIn obligatoire et normalisée (clé de synchronisation avec l'ATS)
    const linkedinUrl = normalizeLinkedinUrl(linkedin);
    if (!linkedinUrl) {
      setLinkedinError(LINKEDIN_HINT);
      document.getElementById("linkedin")?.focus();
      toast({ title: "Profil LinkedIn requis", description: LINKEDIN_HINT, variant: "destructive" });
      return;
    }
    setLinkedin(linkedinUrl);
    if (phone.replace(/\D/g, "").length < 9) {
      document.getElementById("phone")?.focus();
      toast({ title: "Téléphone requis", description: "Indiquez un numéro de téléphone valide.", variant: "destructive" });
      return;
    }
    if (skills.length > MAX_CHOICES || sectors.length > MAX_CHOICES) {
      toast({ title: "Trop de choix", description: `${MAX_CHOICES} métiers et ${MAX_CHOICES} secteurs maximum.`, variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      let photoUrl = photoPreview;

      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, photo, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const profileData = {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        linkedin_url: linkedinUrl,
        photo_url: photoUrl,
        job_title: jobTitle || null,
        skills,
        clients,
        mobility,
        tjm: tjm ? parseInt(tjm) : null,
        model: models.length > 0 ? models.join(",") : null,
        available,
        availability_date: !available && availability ? availability.toISOString().split("T")[0] : null,
        intro_text: introText || null,
        missions: missions.filter((m) => m.client_name.trim()).map(({ tools_input, ...rest }) => rest),
        languages: languages.filter((l) => l.language.trim()),
        has_linkedin_license: hasLinkedinLicense,
        sectors: sectors.map((s) => s === "Autre" && sectorOther.trim() ? sectorOther.trim() : s).filter((s) => s !== "Autre"),
        remote_preference: remotePreference || null,
      };

      let error;
      if (existingId) {
        ({ error } = await supabase
          .from("recruiter_profiles" as any)
          .update(profileData)
          .eq("id", existingId));
      } else {
        ({ error } = await supabase
          .from("recruiter_profiles" as any)
          .insert(profileData));
      }

      if (error) throw error;

      // Synchro vers Jarvi en arrière-plan : un échec est noté sur le profil, jamais bloquant.
      supabase.functions.invoke("jarvi-sync", { body: {} }).catch(() => undefined);

      toast({
        title: existingId && !firstVisit ? "Profil mis à jour !" : "Profil créé !",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
      setFirstVisit(false);

      if (!existingId) loadProfile();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/register");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background lg:pl-[248px]">
        <AppShell role="freelance" />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pl-[248px]">
      <AppShell role="freelance" />
      <LinkedinRequiredDialog open={linkedinGate} firstVisit={firstVisit} onSubmit={saveLinkedinUrl} />
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {activeTab === "missions" ? "Mes missions & CRA" : activeTab === "admin" ? "Mon dossier" : existingId && !firstVisit ? "Mon profil" : "Complétez votre profil"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {activeTab === "missions"
                ? "Vos missions en cours et vos comptes rendus d'activité."
                : activeTab === "admin"
                ? "Les informations et documents administratifs de votre société."
                : existingId && !firstVisit
                ? "Modifiez vos informations à tout moment."
                : "Renseignez vos informations pour intégrer le réseau Kistone."}
            </p>
          </div>
        </div>


        {activeTab === "missions" && userId ? (
          <FreelanceMissionsSection userId={userId} />
        ) : activeTab === "admin" && userId ? (
          <KycDossierPanel party="freelance" userId={userId} email={email} />
        ) : (
        <>
        {existingId && (
          <ProfileCompletionChecklist
            profile={{
              first_name: firstName,
              last_name: lastName,
              phone,
              linkedin_url: linkedin,
              photo_url: photoPreview,
              job_title: jobTitle,
              skills,
              clients,
              tjm: tjm ? parseInt(tjm) : null,
              model: models.join(",") || null,
              intro_text: introText,
              missions,
              languages,
              sectors,
              mobility,
            }}
            onScrollTo={scrollToSection}
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Photo */}
          <div id="section-photo" className="flex flex-col items-center gap-3 rounded-xl transition-shadow">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted">
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
            <span className="text-sm text-muted-foreground">Cliquez pour ajouter une photo</span>
          </div>

          {/* Identity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" required />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">Profil LinkedIn *</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="linkedin"
                value={linkedin}
                onChange={(e) => { setLinkedin(e.target.value); setLinkedinError(null); }}
                placeholder="https://www.linkedin.com/in/votre-profil"
                className="pl-10"
                required
                aria-invalid={Boolean(linkedinError)}
                aria-describedby={linkedinError ? "linkedin-help" : undefined}
              />
            </div>
            {linkedinError ? <p id="linkedin-help" className="text-sm text-destructive">{linkedinError}</p> : null}
          </div>

          {/* Intitulé de poste */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Intitulé de poste</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex : Talent Acquisition Manager" />
          </div>




          {/* TJM + Model */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tjm">TJM (€/jour)</Label>
              <Input id="tjm" type="number" value={tjm} onChange={(e) => setTjm(e.target.value)} placeholder="450" required />
            </div>
            <div className="space-y-3">
              <Label>Modèle</Label>
              <div className="flex flex-col gap-2">
                {MODELS.map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={models.includes(m)}
                      onCheckedChange={(checked) => {
                        if (checked) setModels([...models, m]);
                        else setModels(models.filter((v) => v !== m));
                      }}
                    />
                    <span className="text-sm">{m}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Préférence de remote</Label>
              <Select value={remotePreference} onValueChange={setRemotePreference}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-site">Sur site</SelectItem>
                  <SelectItem value="hybrid">Hybride</SelectItem>
                  <SelectItem value="full-remote">Full remote uniquement</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-3">
            <Label>Je suis disponible</Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={available}
                onCheckedChange={setAvailable}
                className={cn(
                  available ? "bg-green-500 data-[state=checked]:bg-green-500" : "bg-orange-400 data-[state=unchecked]:bg-orange-400"
                )}
              />
              <span className={cn("text-sm font-medium", available ? "text-green-600" : "text-orange-500")}>
                {available ? "Oui" : "Non"}
              </span>
            </div>
            {!available && (
              <div className="space-y-2">
                <Label>Date de prochaine disponibilité</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !availability && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {availability ? format(availability, "PPP", { locale: fr }) : "Sélectionnez une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={availability} onSelect={setAvailability} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Mobilité */}
          <div id="section-mobility" className="space-y-2 rounded-xl transition-shadow">
            <Label>Mobilité</Label>
            <TagInput tags={mobility} onTagsChange={setMobility} placeholder="Ajoutez une ville" />
          </div>

          {/* Skills - Multi-select checkboxes */}
          <div id="section-skills" className="space-y-3 rounded-xl transition-shadow">
            <Label>Les métiers sur lesquels je recrute *</Label>
            <p className="text-xs text-muted-foreground">{MAX_CHOICES} choix maximum ({skills.length}/{MAX_CHOICES})</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {METIERS.map((skill) => (
                <label key={skill} className={cn("flex items-center gap-2", !skills.includes(skill) && skills.length >= MAX_CHOICES ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
                  <Checkbox
                    disabled={!skills.includes(skill) && skills.length >= MAX_CHOICES}
                    checked={skills.includes(skill)}
                    onCheckedChange={(checked) => {
                      if (checked) setSkills([...skills, skill]);
                      else setSkills(skills.filter((s) => s !== skill));
                    }}
                  />
                  <span className="text-sm">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Secteurs / Environnements */}
          <div id="section-sectors" className="space-y-3 rounded-xl transition-shadow">
            <Label>Secteurs / Environnements</Label>
            <p className="text-xs text-muted-foreground">{MAX_CHOICES} choix maximum ({sectors.length}/{MAX_CHOICES})</p>
            <div className="flex flex-col gap-2">
              {["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie", "Autre"].map((sector) => (
                <label key={sector} className={cn("flex items-center gap-2", !sectors.includes(sector) && sectors.length >= MAX_CHOICES ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
                  <Checkbox
                    disabled={!sectors.includes(sector) && sectors.length >= MAX_CHOICES}
                    checked={sectors.includes(sector)}
                    onCheckedChange={(checked) => {
                      if (checked) setSectors([...sectors, sector]);
                      else {
                        setSectors(sectors.filter((s) => s !== sector));
                        if (sector === "Autre") setSectorOther("");
                      }
                    }}
                  />
                  <span className="text-sm">{sector === "Autre" ? "Autre, précisez :" : sector}</span>
                </label>
              ))}
              {sectors.includes("Autre") && (
                <Input
                  value={sectorOther}
                  onChange={(e) => setSectorOther(e.target.value)}
                  placeholder="Précisez votre secteur..."
                  className="ml-6 max-w-xs"
                />
              )}
            </div>
          </div>

          {/* LinkedIn Recruiter License */}
          <div className="flex items-center gap-3">
            <Switch checked={hasLinkedinLicense} onCheckedChange={setHasLinkedinLicense} id="linkedin-license" />
            <Label htmlFor="linkedin-license" className="flex items-center gap-2 text-sm font-medium">
              <Linkedin className="h-4 w-4" />
              Je possède ma propre licence LinkedIn Recruiter
            </Label>
          </div>

          {/* Clients */}
          <div className="space-y-2">
            <Label>Clients majeurs</Label>
            <TagInput tags={clients} onTagsChange={setClients} placeholder="Ajoutez un client" />
          </div>

          {/* Missions */}
          <div id="section-missions" className="space-y-3 rounded-xl transition-shadow">
            <div className="flex items-center justify-between">
              <Label>Missions réalisées</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setMissions([...missions, { client_name: "", profile_types: "", kpis: "", duration: "", tools: [], tools_input: "" }])}
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {missions.map((mission, idx) => (
              <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setMissions(missions.filter((_, i) => i !== idx))}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nom du client</Label>
                    <Input
                      value={mission.client_name}
                      onChange={(e) => {
                        const updated = [...missions];
                        updated[idx] = { ...updated[idx], client_name: e.target.value };
                        setMissions(updated);
                      }}
                      placeholder="Ex : BNP Paribas"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type de profils recrutés</Label>
                    <Input
                      value={mission.profile_types}
                      onChange={(e) => {
                        const updated = [...missions];
                        updated[idx] = { ...updated[idx], profile_types: e.target.value };
                        setMissions(updated);
                      }}
                      placeholder="Ex : Développeurs Full-Stack"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre de recrutements réalisés</Label>
                    <Input
                      type="number"
                      min="0"
                      value={mission.kpis}
                      onChange={(e) => {
                        const updated = [...missions];
                        updated[idx] = { ...updated[idx], kpis: e.target.value };
                        setMissions(updated);
                      }}
                      placeholder="Ex : 12"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Durée</Label>
                    <Input
                      value={mission.duration}
                      onChange={(e) => {
                        const updated = [...missions];
                        updated[idx] = { ...updated[idx], duration: e.target.value };
                        setMissions(updated);
                      }}
                      placeholder="Ex : 6 mois"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Outils utilisés</Label>
                    <div className="flex gap-2">
                      <Input
                        value={mission.tools_input || ""}
                        onChange={(e) => {
                          const updated = [...missions];
                          updated[idx] = { ...updated[idx], tools_input: e.target.value };
                          setMissions(updated);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = (mission.tools_input || "").trim();
                            if (val && !(mission.tools || []).includes(val)) {
                              const updated = [...missions];
                              updated[idx] = { ...updated[idx], tools: [...(mission.tools || []), val], tools_input: "" };
                              setMissions(updated);
                            }
                          }
                        }}
                        placeholder="Ex : LinkedIn Recruiter, Teamtailor, Kalent..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!(mission.tools_input || "").trim()}
                        onClick={() => {
                          const val = (mission.tools_input || "").trim();
                          const updated = [...missions];
                          updated[idx] = { ...updated[idx], tools: (mission.tools || []).includes(val) ? mission.tools : [...(mission.tools || []), val], tools_input: "" };
                          setMissions(updated);
                        }}
                      >
                        Valider
                      </Button>
                    </div>
                    {(mission.tools || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(mission.tools as string[]).map((tool: string) => (
                          <Badge key={tool} variant="secondary" className="gap-1 pr-1 text-xs">
                            {tool}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...missions];
                                updated[idx] = { ...updated[idx], tools: (mission.tools as string[]).filter((t: string) => t !== tool) };
                                setMissions(updated);
                              }}
                              className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {missions.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune mission ajoutée. Cliquez sur "Ajouter" pour enrichir votre profil.</p>
            )}
          </div>

          {/* Languages */}
          <div id="section-languages" className="space-y-3 rounded-xl transition-shadow">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Globe className="h-4 w-4" />Langues</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setLanguages([...languages, { language: "", level: "courant" }])}
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {languages.map((lang, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Select
                  value={lang.language || undefined}
                  onValueChange={(val) => {
                    const updated = [...languages];
                    updated[idx] = { ...updated[idx], language: val };
                    setLanguages(updated);
                  }}
                >
                  <SelectTrigger className="flex-1" aria-label="Langue">
                    <SelectValue placeholder="Langue" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...LANGUAGES, ...(lang.language && !LANGUAGES.includes(lang.language) ? [lang.language] : [])].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={lang.level}
                  onValueChange={(val) => {
                    const updated = [...languages];
                    updated[idx] = { ...updated[idx], level: val };
                    setLanguages(updated);
                  }}
                >
                  <SelectTrigger className="w-[160px]" aria-label="Niveau">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="débutant">Débutant</SelectItem>
                    <SelectItem value="intermédiaire">Intermédiaire</SelectItem>
                    <SelectItem value="avancé">Avancé</SelectItem>
                    <SelectItem value="courant">Courant</SelectItem>
                    <SelectItem value="natif">Natif</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Intro / Présentation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="introText">Texte de présentation</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={optimizing}
                onClick={async () => {
                  setOptimizing(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;
                    const { data, error } = await supabase.functions.invoke("optimize-intro", {
                      body: {
                        profile: {
                          firstName,
                          lastName,
                          jobTitle,
                          skills,
                          sectors,
                          clients,
                          models,
                          tjm,
                          mobility,
                          languages,
                          missions: missions.filter((m) => m.client_name.trim()),
                          hasLinkedinLicense,
                          currentIntro: introText,
                        },
                      },
                    });
                    if (error) throw new Error(await functionErrorMessage(error));
                    if (data?.intro) setIntroText(data.intro);
                    else throw new Error("Pas de résultat");
                  } catch (err: any) {
                    toast({ title: "Erreur", description: err.message || "Impossible d'optimiser la présentation.", variant: "destructive" });
                  } finally {
                    setOptimizing(false);
                  }
                }}
              >
                {optimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {optimizing ? "Génération..." : "Optimiser avec l'IA"}
              </Button>
            </div>
            <Textarea
              id="introText"
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder="Présentez-vous en quelques lignes : votre parcours, votre expertise, ce qui vous différencie..."
              rows={4}
            />
          </div>

          <p className="-mt-4 text-xs text-muted-foreground">« Optimiser avec l'IA » reprend tout ce que vous avez renseigné ci-dessus.</p>

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? "Sauvegarde..." : existingId ? "Mettre à jour mon profil" : "Envoyer mon profil"}
          </Button>
        </form>

        {existingId && (
          <div className="mt-8 flex items-center justify-between">
            <ExportDataButton userId={userId} profileType="freelance" />
            <DeleteAccountButton userId={userId} navigate={navigate} />
          </div>
        )}
        </>
        )}
      </main>

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
            otherUserName="Kistone"
          />
        </>
      )}
    </div>
  );
};

export default Profile;
