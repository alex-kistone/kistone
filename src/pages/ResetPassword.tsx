import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check URL hash for recovery token
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mot de passe mis à jour", description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." });
      navigate("/login");
    }

    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-3 my-8 flex max-w-[480px] flex-col items-center rounded-[28px] border border-border bg-card px-5 py-10 shadow-md sm:mx-auto sm:my-16 sm:px-10 sm:py-12">
          <p className="text-muted-foreground">Lien de réinitialisation invalide ou expiré.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/forgot-password")}>
            Demander un nouveau lien
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-3 my-8 flex max-w-[480px] flex-col items-center rounded-[28px] border border-border bg-card px-5 py-10 shadow-md sm:mx-auto sm:my-16 sm:px-10 sm:py-12">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-ks-pink-100">
          <KeyRound className="h-6 w-6 text-foreground" strokeWidth={1.8} />
        </div>
        <h1 className="mb-3 text-center font-heading text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[40px]">Nouveau mot de passe</h1>
        <p className="mb-8 text-center text-muted-foreground">
          Choisissez votre nouveau mot de passe.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ResetPassword;
