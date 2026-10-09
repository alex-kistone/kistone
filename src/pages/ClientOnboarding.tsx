import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";
import OnboardingSteps from "@/components/platform/OnboardingSteps";
import { submitPendingNeed } from "@/lib/pendingNeed";

/**
 * Onboarding d'un nouveau client, étape 1 : coordonnées et entreprise.
 * L'étape 2 est le dépôt du premier besoin (/client/new-need?onboarding=1).
 */
const ClientOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/client"); return; }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      const { data } = await supabase
        .from("client_profiles" as never)
        .select("first_name, last_name, phone, company_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const p = data as { first_name: string; last_name: string; phone: string | null; company_name: string } | null;
      if (p) {
        setFirstName(p.first_name ?? "");
        setLastName(p.last_name ?? "");
        setPhone(p.phone ?? "");
        setCompanyName(p.company_name ?? "");
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    // Le dossier (KYC) peut avoir créé la ligne : upsert sur user_id
    const { error } = await supabase.from("client_profiles" as never).upsert({
      user_id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      email,
      company_name: companyName.trim(),
    } as never, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    // Besoin qualifié avant l'inscription : il est enregistré maintenant, sinon étape 2 (premier besoin)
    if (await submitPendingNeed(userId, email)) {
      toast({ title: "Besoin envoyé !", description: "L'équipe Kistone revient vers vous rapidement." });
      navigate("/client/dashboard");
      return;
    }
    navigate("/client/new-need?onboarding=1");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <OnboardingSteps current={1} />
        <h1 className="mb-2 text-3xl font-bold">Bienvenue chez Kistone</h1>
        <p className="mb-8 text-muted-foreground">
          Quelques informations pour vous connaître, puis vous déposerez votre premier besoin.
        </p>

        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Chargement...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} readOnly disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input id="companyName" autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>

            <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={saving}>
              {saving ? "Enregistrement..." : "Continuer"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ClientOnboarding;
