import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import Header from "@/components/KistoneHeader";

const FreelancerAuth = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");


  useEffect(() => {
    let isMounted = true;
    let hasRedirected = false;

    const redirectWithSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!isMounted || !session || hasRedirected) return;
      hasRedirected = true;

      // Check for conflicting client role
      try {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin" as const,
        });
        if (isAdmin) {
          window.location.replace("/dashboard");
          return;
        }

        const { data: isClient } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "client" as const,
        });
        if (isClient) {
          await supabase.auth.signOut();
          hasRedirected = false;
          toast({
            title: "Compte client détecté",
            description: "Cette adresse email est déjà utilisée pour un compte client. Connectez-vous via l'espace client.",
            variant: "destructive",
          });
          return;
        }
      } catch {
        // fallback
      }

      window.location.replace("/profile");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          await redirectWithSession(session);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      redirectWithSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${window.location.pathname}`,
      extraParams: { prompt: "select_account" },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Erreur", description: String(error), variant: "destructive" });
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else if (data.session) {
        // The onAuthStateChange handler will handle role check and redirect
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Compte créé !", description: "Vérifiez votre email pour confirmer votre inscription." });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-3 my-8 flex max-w-[480px] flex-col items-center rounded-[28px] border border-border bg-card px-5 py-10 shadow-md sm:mx-auto sm:my-16 sm:px-10 sm:py-12">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-ks-pink-100">
          <img src="/logos/bolt-black.png" alt="" aria-hidden="true" width={244} height={400} className="h-11 w-auto" />
        </div>
        <h1 className="mb-3 text-center font-heading text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[40px]">
          {isLogin ? "Connexion freelance" : "Rejoignez le réseau Kistone"}
        </h1>
        <p className="mb-8 text-center text-muted-foreground">
          {isLogin
            ? "Connectez-vous pour gérer votre profil."
            : "Créez votre compte pour intégrer notre base de freelances."}
        </p>

        {/* Google */}
        <Button
          variant="outline"
          size="lg"
          className="mb-4 w-full gap-3"
          onClick={handleGoogle}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuer avec Google
        </Button>

        <div className="mb-4 flex w-full items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>

        {/* Email/Password */}
        <form onSubmit={handleEmail} className="w-full space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {!isLogin && (
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
          )}
          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            <Mail className="h-4 w-4" />
            {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        {isLogin && (
          <Link to="/forgot-password" className="mt-4 text-sm text-muted-foreground hover:text-foreground">
            Mot de passe oublié ?
          </Link>
        )}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </main>
    </div>
  );
};

export default FreelancerAuth;
