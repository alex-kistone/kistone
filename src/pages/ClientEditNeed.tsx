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
import { budgetError } from "@/lib/budget";
import NeedFunctionFields from "@/components/platform/NeedFunctionFields";
import { isVertical, verticalOf, type Vertical } from "@/lib/verticals";
import DesiredStartField from "@/components/platform/DesiredStartField";
import AppShell from "@/components/platform/AppShell";
import { METIERS, SECTEURS } from "@/lib/taxonomy";


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
  // Fonction recherchée (RPO ou département C-Level), spécialités et rythme
  const [vertical, setVertical] = useState<Vertical>("rpo");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [days, setDays] = useState("5");
  const [sectors, setSectors] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [missionLocation, setMissionLocation] = useState("");
  const [remotePolicy, setRemotePolicy] = useState("on-site");
  // Date d'arrivée souhaitée : dès que possible (desired_start NULL) ou une date précise
  const [start, setStart] = useState<{ asap: boolean; date: string }>({ asap: true, date: "" });
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
      setVertical(isVertical(need.vertical) ? need.vertical : "rpo");
      setSpecialties(need.specialties || []);
      setDays(String(need.days_per_week ?? 5));
      setSectors(need.sectors || []);
      setBudgetMin(need.budget_tjm_min?.toString() || "");
      setBudgetMax(need.budget_tjm_max?.toString() || "");
      setMissionLocation(need.mission_location);
      setRemotePolicy(need.remote_policy);
      setStart(need.desired_start ? { asap: false, date: need.desired_start } : { asap: true, date: "" });
      setDescription(need.description || "");
      setLoading(false);
    };
    load();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetIssue = budgetError(budgetMin, budgetMax);
    if (budgetIssue) {
      toast({ title: "Budget TJM", description: budgetIssue, variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase
        .from("client_needs" as any)
        .update({
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
          job_title: jobTitle,
          vertical,
          profile_types: vertical === "rpo" ? profileTypes : [],
          specialties: vertical === "rpo" ? [] : specialties,
          days_per_week: Number(days) < 5 ? Number(days) : null,
          sectors,
          budget_tjm_min: budgetMin ? parseInt(budgetMin) : null,
          budget_tjm_max: budgetMax ? parseInt(budgetMax) : null,
          mission_location: missionLocation,
          remote_policy: remotePolicy,
          desired_start: start.asap || !start.date ? null : start.date,
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
      <div className="min-h-screen bg-background lg:pl-[248px]">
        <AppShell role="client" />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pl-[248px]">
      <AppShell role="client" />
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
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={vertical === "rpo" ? "Ex : RPO Tech" : `Ex : ${verticalOf(vertical).short} fractional`} required />
          </div>

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

          <div className="space-y-3">
            <Label>Secteur / Environnement</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SECTEURS.map((sector) => (
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Budget TJM min (€/jour)</Label>
              <Input id="budgetMin" type="number" min={1} aria-invalid={!!budgetError(budgetMin, budgetMax)} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="350" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Budget TJM max (€/jour)</Label>
              <Input id="budgetMax" type="number" min={1} aria-invalid={!!budgetError(budgetMin, budgetMax)} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="550" />
            </div>
          </div>
          {budgetError(budgetMin, budgetMax) && (
            <p className="-mt-4 text-sm text-destructive">{budgetError(budgetMin, budgetMax)}</p>
          )}

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
