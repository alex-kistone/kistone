import { useState, useEffect } from "react";

import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Building2, Users, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import Header from "@/components/KistoneHeader";

type UserType = "client" | "recruiter";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") === "recruiter" ? "recruiter" : "client";
  const redirectParam = searchParams.get("redirect");
  const [userType, setUserType] = useState<UserType>(initialType);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const getDefaultRedirectPath = () => (userType === "client" ? "/client/dashboard" : "/profile");

  const getRedirectPath = async (userId: string): Promise<string> => {
    if (redirectParam?.startsWith("/")) {
      return redirectParam;
    }

    const fallbackPath = getDefaultRedirectPath();

    const roleResolution = (async () => {
      try {
        const [{ data: isAdmin }, { data: isClient }, { data: isFreelance }] = await Promise.all([
          supabase.rpc("has_role", { _user_id: userId, _role: "admin" as const }),
          supabase.rpc("has_role", { _user_id: userId, _role: "client" as const }),
          supabase.rpc("has_role", { _user_id: userId, _role: "user" as const }),
        ]);
        if (isAdmin) return "/dashboard";
        if (isClient) return "/client/dashboard";
        if (isFreelance) return "/profile";
      } catch {
        // fallback below
      }
      return fallbackPath;
    })();

    const timeoutFallback = new Promise<string>((resolve) => {
      setTimeout(() => resolve(fallbackPath), 1800);
    });

    return Promise.race([roleResolution, timeoutFallback]);
  };

  useEffect(() => {
    let isMounted = true;
    let hasRedirected = false;

    const redirectWithSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!isMounted || !session || hasRedirected) return;
      hasRedirected = true;

      const path = await getRedirectPath(session.user.id);
      if (isMounted) navigate(path, { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        void redirectWithSession(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void redirectWithSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectParam, userType]);

  const handleGoogle = async () => {
    setLoading(true);

    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${window.location.pathname}${window.location.search}`,
        extraParams: { prompt: "select_account" },
      });

      if (result.error) {
        toast({ title: "Erreur", description: String(result.error), variant: "destructive" });
        setLoading(false);
        return;
      }

      if (result.redirected) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Assign client role if signing in via client tab
        if (userType === "client") {
          try {
            await supabase.functions.invoke("assign-client-role", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
          } catch (err) {
            console.error("Role assignment error:", err);
          }
        }
        const path = await getRedirectPath(session.user.id);
        navigate(path);
        return;
      }

      toast({
        title: "Connexion incomplète",
        description: "La session Google n'a pas pu être récupérée. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        setLoading(false);
      } else if (data.session) {
        // Assign client role if logging in via client tab and no role yet
        if (userType === "client") {
          try {
            await supabase.functions.invoke("assign-client-role", {
              headers: { Authorization: `Bearer ${data.session.access_token}` },
            });
          } catch (err) {
            console.error("Role assignment error:", err);
          }
        }
        const path = await getRedirectPath(data.session.user.id);
        navigate(path);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setLoading(false);
      } else {
        // Assign client role on signup only
        if (userType === "client" && data.session) {
          try {
            await supabase.functions.invoke("assign-client-role", {
              headers: { Authorization: `Bearer ${data.session.access_token}` },
            });
          } catch (err) {
            console.error("Role assignment error:", err);
          }
        }
        toast({
          title: "Compte créé !",
          description: userType === "client"
            ? "Vérifiez votre email pour confirmer votre inscription."
            : "Vous pouvez maintenant compléter votre profil.",
        });
        setLoading(false);
      }
    }
  };

  const tabs: { key: UserType; label: string; icon: typeof Building2; desc: string }[] = [
    {
      key: "client",
      label: "Je recrute",
      icon: Building2,
      desc: "Trouvez un recruteur freelance pour vos besoins.",
    },
    {
      key: "recruiter",
      label: "Je suis freelance",
      icon: Users,
      desc: "Accédez à des missions et développez votre activité.",
    },
  ];

  const activeTab = tabs.find((t) => t.key === userType)!;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-3 my-8 flex max-w-[480px] flex-col items-center rounded-[28px] border border-border bg-card px-5 py-10 shadow-md sm:mx-auto sm:my-16 sm:px-10 sm:py-12">

        <h1 className="mb-3 text-center font-heading text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[40px]">
          {isLogin ? "Connectez-vous" : "Créez votre compte"}
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Choisissez votre profil pour continuer
        </p>

        {/* Toggle tabs */}
        <div className="mb-8 flex w-full overflow-hidden rounded-full bg-secondary p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = userType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setUserType(tab.key)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive ? "text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={userType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <p className="mb-6 text-center text-sm text-muted-foreground">{activeTab.desc}</p>

            {/* Google auth */}
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
              <span className="text-xs text-muted-foreground">ou par email</span>
              <Separator className="flex-1" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmail} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {userType === "client" ? "Email professionnel" : "Email"}
                </Label>
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
              <Button
                type="submit"
                size="lg"
                className={`w-full gap-2 ${
                  userType === "client"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                }`}
                disabled={loading}
              >
                <Mail className="h-4 w-4" />
                {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer mon compte"}
              </Button>
            </form>

            {isLogin && (
              <Link to="/forgot-password" className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground">
                Mot de passe oublié ?
              </Link>
            )}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Login;
