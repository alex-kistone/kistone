import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Email envoyé", description: "Consultez votre boîte mail pour réinitialiser votre mot de passe." });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-3 my-8 flex max-w-[480px] flex-col items-center rounded-[28px] border border-border bg-card px-5 py-10 shadow-md sm:mx-auto sm:my-16 sm:px-10 sm:py-12">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-ks-pink-100">
          <KeyRound className="h-6 w-6 text-foreground" strokeWidth={1.8} />
        </div>
        <h1 className="mb-3 text-center font-heading text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[40px]">Mot de passe oublié</h1>
        <p className="mb-8 text-center text-muted-foreground">
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>

        {sent ? (
          <div className="w-full space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Un email a été envoyé à <strong>{email}</strong>. Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-1 inline h-3 w-3" />
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default ForgotPassword;
