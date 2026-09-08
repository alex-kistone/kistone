import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Upload, Linkedin, LogOut, MessageCircle, Briefcase, Plus, Trash2, Globe, X, Sparkles, Loader2, FileText, Rocket } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DeleteAccountButton from "@/components/connect2/DeleteAccountButton";
import ExportDataButton from "@/components/connect2/ExportDataButton";
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
import Header from "@/components/KistoneHeader";
import TagInput from "@/components/connect2/TagInput";
import ChatPanel from "@/components/connect2/ChatPanel";
import { useUnreadCount } from "@/hooks/useChat";
import { Badge } from "@/components/ui/badge";
import FreelanceMissionsSection from "@/components/connect2/FreelanceMissionsSection";
import FreelanceAdminTab from "@/components/connect2/FreelanceAdminTab";
import ProfileCompletionChecklist from "@/components/connect2/ProfileCompletionChecklist";

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
  const [recruiterCompanyName, setRecruiterCompanyName] = useState("");
  const [recruiterSiren, setRecruiterSiren] = useState("");
  const [recruiterCompanyAddress, setRecruiterCompanyAddress] = useState("");
  const [recruiterLegalForm, setRecruiterLegalForm] = useState("");
  const [recruiterTvaNumber, setRecruiterTvaNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "missions" | "admin">("profile");
  const [optimizing, setOptimizing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [urssafDocUrl, setUrssafDocUrl] = useState<string | null>(null);
  const [insuranceDocUrl, setInsuranceDocUrl] = useState<string | null>(null);
  const [ribDocUrl, setRibDocUrl] = useState<string | null>(null);
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
      setRecruiterCompanyName(p.company_name || "");
      setRecruiterSiren(p.siren || "");
      setRecruiterCompanyAddress(p.company_address || "");
      setRecruiterLegalForm(p.legal_form || "");
      setRecruiterTvaNumber(p.tva_number || "");
      setUrssafDocUrl(p.urssaf_document_url || null);
      setInsuranceDocUrl(p.insurance_document_url || null);
      setRibDocUrl(p.rib_document_url || null);
    }

    // Load admin user_id for chat
    const { data: adminId } = await supabase.rpc("get_admin_user_id" as any);
    if (adminId) setAdminUserId(adminId as string);

    setLoading(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        linkedin_url: linkedin || null,
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
        company_name: recruiterCompanyName || null,
        siren: recruiterSiren || null,
        company_address: recruiterCompanyAddress || null,
        legal_form: recruiterLegalForm || null,
        tva_number: recruiterTvaNumber || null,
        urssaf_document_url: urssafDocUrl || null,
        insurance_document_url: insuranceDocUrl || null,
        rib_document_url: ribDocUrl || null,
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

      // Sync to Jarvi
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.functions.invoke("sync-to-jarvi", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      } catch (jarviErr) {
        console.error("Jarvi sync error (non-blocking):", jarviErr);
      }

      toast({
        title: existingId ? "Profil mis à jour !" : "Profil créé !",
        description: "Vos informations ont été sauvegardées avec succès.",
      });

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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {existingId ? "Mon profil" : "Complétez votre profil"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {existingId
                ? "Modifiez vos informations à tout moment."
                : "Renseignez vos informations pour intégrer le réseau Connect2."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/open-needs")}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70"
              size="sm"
            >
              <Rocket className="h-4 w-4" />
              Opportunités de missions
            </Button>
          </div>
        </div>

        {/* Tabs */}
        {existingId && (
          <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mon profil
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
                Missions
              </span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "admin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <FileText className="h-4 w-4" />
                Mon administratif
              </span>
            </button>
          </div>
        )}

        {activeTab === "missions" && userId ? (
          <FreelanceMissionsSection userId={userId} />
        ) : activeTab === "admin" && userId ? (
          <FreelanceAdminTab
            userId={userId}
            profileId={existingId}
            companyName={recruiterCompanyName}
            setCompanyName={setRecruiterCompanyName}
            legalForm={recruiterLegalForm}
            setLegalForm={setRecruiterLegalForm}
            siren={recruiterSiren}
            setSiren={setRecruiterSiren}
            tvaNumber={recruiterTvaNumber}
            setTvaNumber={setRecruiterTvaNumber}
            companyAddress={recruiterCompanyAddress}
            setCompanyAddress={setRecruiterCompanyAddress}
            urssafDocUrl={urssafDocUrl}
            setUrssafDocUrl={setUrssafDocUrl}
            insuranceDocUrl={insuranceDocUrl}
            setInsuranceDocUrl={setInsuranceDocUrl}
            ribDocUrl={ribDocUrl}
            setRibDocUrl={setRibDocUrl}
            onSave={() => handleSubmit()}
            saving={saving}
          />
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
              company_name: recruiterCompanyName,
              siren: recruiterSiren,
            }}
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
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
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">Profil LinkedIn</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/votre-profil" className="pl-10" />
            </div>
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
                {["RPO"].map((m) => (
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
          <div className="space-y-2">
            <Label>Mobilité</Label>
            <TagInput tags={mobility} onTagsChange={setMobility} placeholder="Ajoutez une ville puis Entrée" />
          </div>

          {/* Intro / Présentation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="introText">Texte d'introduction / Présentation</Label>
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
                    if (error) throw error;
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

          {/* Skills - Multi-select checkboxes */}
          <div className="space-y-3">
            <Label>Les métiers sur lesquels je recrute</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {["Tech", "Data", "Product", "Sales", "Life Science", "Industrie", "Energies", "Digital & Marketing", "Fonctions support", "CFO", "Banque/Assurance", "Autre"].map((skill) => (
                <label key={skill} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
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
          <div className="space-y-3">
            <Label>Secteurs / Environnements</Label>
            <div className="flex flex-col gap-2">
              {["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie", "Autre"].map((sector) => (
                <label key={sector} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
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
            <TagInput tags={clients} onTagsChange={setClients} placeholder="Ajoutez un client puis Entrée" />
          </div>

          {/* Missions */}
          <div className="space-y-3">
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
                        placeholder="Ex : LinkedIn Recruiter, Teamtailor, Jarvi, Kalent..."
                      />
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Globe className="h-4 w-4" />Langues</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setLanguages([...languages, { language: "", level: "intermédiaire" }])}
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {languages.map((lang, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Input
                  value={lang.language}
                  onChange={(e) => {
                    const updated = [...languages];
                    updated[idx] = { ...updated[idx], language: e.target.value };
                    setLanguages(updated);
                  }}
                  placeholder="Ex : Anglais"
                  className="flex-1"
                />
                <Select
                  value={lang.level}
                  onValueChange={(val) => {
                    const updated = [...languages];
                    updated[idx] = { ...updated[idx], level: val };
                    setLanguages(updated);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
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
            otherUserName="Connect2"
          />
        </>
      )}
    </div>
  );
};

export default Profile;
