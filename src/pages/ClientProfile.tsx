import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteAccountButton from "@/components/connect2/DeleteAccountButton";
import ExportDataButton from "@/components/connect2/ExportDataButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";
import CompanySearch, { type CompanyData } from "@/components/connect2/CompanySearch";

const ClientProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [siren, setSiren] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeTitle, setRepresentativeTitle] = useState("");

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
        setCompanyName(p.company_name || "");
        setCities(p.cities || []);
        setFirstName(p.first_name || "");
        setLastName(p.last_name || "");
        setJobTitle(p.job_title || "");
        setPhone(p.phone || "");
        setEmail(p.email || session.user.email || "");
        setSiren(p.siren || "");
        setCompanyAddress(p.company_address || "");
        setLegalForm(p.legal_form || "");
        setRepresentativeName(p.representative_name || "");
        setRepresentativeTitle(p.representative_title || "");
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
      company_name: companyName,
      cities,
      first_name: firstName,
      last_name: lastName,
      job_title: jobTitle,
      phone: phone || null,
      email,
      siren: siren || null,
      company_address: companyAddress || null,
      legal_form: legalForm || null,
      representative_name: representativeName || null,
      representative_title: representativeTitle || null,
    };

    try {
      let error;
      if (isNew) {
        ({ error } = await supabase.from("client_profiles" as any).insert(payload));
      } else {
        ({ error } = await supabase
          .from("client_profiles" as any)
          .update(payload)
          .eq("user_id", userId));
      }
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

        <h1 className="mb-2 text-3xl font-bold">Mon profil entreprise</h1>
        <p className="mb-8 text-muted-foreground">
          Ces informations seront pré-remplies lors de la création de vos besoins.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l'entreprise</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex : Acme Corp"
              required
            />
          </div>

          {/* Legal info */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Informations légales (pour les contrats)</h3>

            <CompanySearch
              onSelect={(data: CompanyData) => {
                setCompanyName(data.companyName);
                setSiren(data.siren);
                setLegalForm(data.legalForm);
                setCompanyAddress(data.companyAddress);
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalForm">Forme juridique</Label>
                <Input id="legalForm" value={legalForm} onChange={(e) => setLegalForm(e.target.value)} placeholder="SAS, SARL, SA..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siren">SIREN</Label>
                <Input id="siren" value={siren} onChange={(e) => setSiren(e.target.value)} placeholder="XXX XXX XXX" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="companyAddress">Adresse du siège</Label>
                <Input id="companyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Adresse complète" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representativeName">Représentant légal</Label>
                <Input id="representativeName" value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} placeholder="Nom complet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representativeTitle">Qualité</Label>
                <Input id="representativeTitle" value={representativeTitle} onChange={(e) => setRepresentativeTitle(e.target.value)} placeholder="DG, PDG, DRH..." />
              </div>
            </div>
          </div>

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
