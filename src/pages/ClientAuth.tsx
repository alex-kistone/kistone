import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Building2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import Header from "@/components/KistoneHeader";

const ClientAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");

  const checkRoleConflict = async (userId: string): Promise<"admin" | "freelance" | null> => {
    try {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin" as const,
      });
      if (isAdmin) return "admin";

      const { data: isFreelance } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "user" as const,
      });
      if (isFreelance) return "freelance";
    } catch {
      // fallback
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (session: any) => {
      if (!isMounted || !session) return;

      const conflict = await checkRoleConflict(session.user.id);

      if (conflict === "admin") {
        navigate("/dashboard");
        return;
      }

      if (conflict === "freelance") {
        await supabase.auth.signOut();
        toast({
          title: "Compte freelance détecté",
          description: "Cette adresse email est déjà utilisée pour un compte freelance. Connectez-vous via l'espace freelance.",
          variant: "destructive",
        });
        return;
      }

      // Assign client role
      try {
        const res = await supabase.functions.invoke("assign-client-role", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.data?.error === "ROLE_CONFLICT") {
          await supabase.auth.signOut();
          toast({
            title: "Compte freelance détecté",
            description: res.data.message,
            variant: "destructive",
          });
          return;
        }
      } catch (err) {
        console.error("Role assignment error:", err);
      }

      navigate("/client/dashboard");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN") {
          await handleSession(session);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
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
      <main className="container mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <Building2 className="h-7 w-7 text-accent-foreground" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">
          {isLogin ? "Espace Client" : "Créez votre espace client"}
        </h1>
        <p className="mb-8 text-center text-muted-foreground">
          {isLogin
            ? "Connectez-vous pour gérer vos besoins en recrutement."
            : "Inscrivez-vous pour déposer vos besoins en recrutement."}
        </p>


        {/* Google */}
        <Button
          variant="outline"
          size="lg"
          className="mb-4 w-full gap-3"
          onClick={async () => {
            setLoading(true);
            const { error } = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: `${window.location.origin}${window.location.pathname}`,
              extraParams: { prompt: "select_account" },
            });
            if (error) {
              setLoading(false);
              toast({ title: "Erreur", description: String(error), variant: "destructive" });
            }
          }}
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

        <form onSubmit={handleEmail} className="w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
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
          <Button type="submit" size="lg" className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
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

export default ClientAuth;
