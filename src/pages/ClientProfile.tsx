import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteAccountButton from "@/components/platform/DeleteAccountButton";
import ExportDataButton from "@/components/platform/ExportDataButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/platform/AppShell";
import KycDossierPanel from "@/components/platform/KycDossierPanel";

const ClientProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/client"); return; }
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("client_profiles" as any)
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        const p = data as any;
        setCities(p.cities || []);
        setFirstName(p.first_name || "");
        setLastName(p.last_name || "");
        setJobTitle(p.job_title || "");
        setPhone(p.phone || "");
        setEmail(p.email || session.user.email || "");
      } else {
        setIsNew(true);
        setEmail(session.user.email || "");
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const addCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities([...cities, trimmed]);
    }
    setCityInput("");
  };

  const removeCity = (city: string) => {
    setCities(cities.filter((c) => c !== city));
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCity();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    const payload = {
      user_id: userId,
      cities,
      first_name: firstName,
      last_name: lastName,
      job_title: jobTitle,
      phone: phone || null,
      email,
    };

    try {
      // Le dossier (KYC) peut avoir créé la ligne : upsert sur user_id
      const { error } = await supabase.from("client_profiles" as any).upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      setIsNew(false);
      toast({ title: "Profil enregistré !", description: "Vos informations ont été mises à jour." });
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

        <h1 className="mb-2 text-3xl font-bold">Mon dossier</h1>
        <p className="mb-8 text-muted-foreground">
          Vos coordonnées, puis les informations de votre entreprise pour les contrats et la facturation.
        </p>

        <h2 className="mb-4 text-xl font-semibold">Vos coordonnées</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cities */}
          <div className="space-y-2">
            <Label>Villes</Label>
            <div className="flex gap-2">
              <Input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={handleCityKeyDown}
                placeholder="Ajouter une ville puis Entrée"
              />
              <Button type="button" variant="outline" size="icon" onClick={addCity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {cities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {cities.map((city) => (
                  <Badge key={city} variant="secondary" className="gap-1 pr-1">
                    {city}
                    <button
                      type="button"
                      onClick={() => removeCity(city)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Intitulé de poste</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ex : DRH, Talent Acquisition Manager"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={saving}
          >
            {saving ? "Enregistrement..." : "Enregistrer mon profil"}
          </Button>
        </form>

        {userId ? (
          <section aria-label="Dossier entreprise" className="mt-12 border-t border-border pt-10">
            <KycDossierPanel party="client" userId={userId} email={email} />
          </section>
        ) : null}

        {!isNew && (
          <div className="mt-8 flex items-center justify-between">
            <ExportDataButton userId={userId} profileType="client" />
            <DeleteAccountButton userId={userId} navigate={navigate} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientProfile;
