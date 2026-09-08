import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Building2, Users, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/connect2/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import kistoneLogo from "@/assets/kistone_logo_black.png";

const navLinks = [
  { to: "/", label: "Accueil" },
  { to: "/blog", label: "Blog" },
];

type HeaderProps = { logoSrc?: string; logoAlt?: string; logoClassName?: string };

const Header = ({ logoSrc, logoAlt = "Kistone Studio", logoClassName }: HeaderProps = {}) => {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [dashboardPath, setDashboardPath] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setDashboardPath(null);
      return;
    }
    const userId = session.user.id;
    const resolve = async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (isAdmin) { setDashboardPath("/dashboard"); return; }

      const { data: profile } = await supabase
        .from("recruiter_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (profile) { setDashboardPath("/profile"); return; }

      setDashboardPath("/client/dashboard");
    };
    resolve();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSrc ?? kistoneLogo} alt={logoAlt} className={logoClassName ?? "h-28 dark:invert"} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground first:text-foreground">
              {l.label}
            </Link>
          ))}
          {!session && (
            <>
              <span className="mx-1 h-5 w-px bg-border" />
              <Link to="/login?type=client" className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">
                <Building2 className="h-3.5 w-3.5" />
                Espace Client
              </Link>
              <Link to="/login?type=recruiter" className="flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-secondary/20">
                <Users className="h-3.5 w-3.5" />
                Espace Freelance
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <div className="hidden items-center gap-2 md:flex">
              {dashboardPath && (
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <Link to={dashboardPath}>
                    <LayoutDashboard className="h-4 w-4" />
                    Mon espace
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/login">Se connecter</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t bg-background px-4 pb-4 pt-2 md:hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <ul className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  {l.label}
                </Link>
              </li>
            ))}
            {!session ? (
              <>
                <li className="mt-2 border-t pt-2">
                  <Link to="/login?type=client" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
                    <Building2 className="h-4 w-4" />
                    Espace Client
                  </Link>
                </li>
                <li>
                  <Link to="/login?type=recruiter" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5">
                    <Users className="h-4 w-4" />
                    Espace Freelance
                  </Link>
                </li>
                <li className="mt-2 border-t pt-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                    Se connecter
                  </Link>
                </li>
              </>
            ) : (
              <>
                {dashboardPath && (
                  <li className="mt-2 border-t pt-2">
                    <Link to={dashboardPath} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
                      <LayoutDashboard className="h-4 w-4" />
                      Mon espace
                    </Link>
                  </li>
                )}
                <li className={dashboardPath ? "" : "mt-2 border-t pt-2"}>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5">
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
