import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";

const PROFILE_TYPES = [
  "Tech", "Data", "Product", "Sales", "Life Science",
  "Industrie", "Energies", "Digital & Marketing",
  "Fonctions support", "CFO", "Banque/Assurance", "Autre",
];

const REMOTE_OPTIONS = [
  { value: "on-site", label: "Sur site" },
  { value: "hybrid", label: "Hybride" },
  { value: "full-remote", label: "Full remote" },
  { value: "flexible", label: "Flexible" },
];

const ClientEditNeed = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profileTypes, setProfileTypes] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [missionLocation, setMissionLocation] = useState("");
  const [remotePolicy, setRemotePolicy] = useState("on-site");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/client"); return; }

      const { data, error } = await supabase
        .from("client_needs" as any)
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        toast({ title: "Erreur", description: "Besoin introuvable.", variant: "destructive" });
        navigate("/client/dashboard");
        return;
      }

      const need = data as any;
      setCompanyName(need.company_name);
      setContactName(need.contact_name);
      setContactEmail(need.contact_email);
      setJobTitle(need.job_title);
      setProfileTypes(need.profile_types || []);
      setBudgetMin(need.budget_tjm_min?.toString() || "");
      setBudgetMax(need.budget_tjm_max?.toString() || "");
      setMissionLocation(need.mission_location);
      setRemotePolicy(need.remote_policy);
      setDescription(need.description || "");
      setLoading(false);
    };
    load();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("client_needs" as any)
        .update({
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
          job_title: jobTitle,
          profile_types: profileTypes,
          budget_tjm_min: budgetMin ? parseInt(budgetMin) : null,
          budget_tjm_max: budgetMax ? parseInt(budgetMax) : null,
          mission_location: missionLocation,
          remote_policy: remotePolicy,
          description: description || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Besoin mis à jour !", description: "Vos modifications ont été enregistrées." });
      navigate("/client/dashboard");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/client/dashboard")}
          className="mb-6 gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>

        <h1 className="mb-2 text-3xl font-bold">Modifier le besoin</h1>
        <p className="mb-8 text-muted-foreground">
          Mettez à jour les informations de votre besoin en recrutement.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Nom du contact</Label>
              <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email de contact</Label>
            <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Intitulé du poste recherché</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex : Développeur Full Stack Senior" required />
          </div>

          <div className="space-y-3">
            <Label>Typologies de profils recherchés</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PROFILE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={profileTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) setProfileTypes([...profileTypes, type]);
                      else setProfileTypes(profileTypes.filter((t) => t !== type));
                    }}
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Budget TJM min (€/jour)</Label>
              <Input id="budgetMin" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="350" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Budget TJM max (€/jour)</Label>
              <Input id="budgetMax" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="550" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="missionLocation">Lieu de la mission</Label>
            <Input id="missionLocation" value={missionLocation} onChange={(e) => setMissionLocation(e.target.value)} placeholder="Ex : Paris, Lyon" required />
          </div>

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
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ClientEditNeed;
