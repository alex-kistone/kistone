import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Cta from "@/components/site/Cta";
import Logo from "@/components/site/Logo";
import SmartLink from "@/components/site/SmartLink";
import { ROUTES } from "@/content/site";
import "@/site/site.css";

/** En-tête des pages de la plateforme (auth, espaces client / freelance, backoffice), au design du site. */
const KistoneHeader = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [dashboardPath, setDashboardPath] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setDashboardPath(null); return; }
    const userId = session.user.id;
    (async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (isAdmin) { setDashboardPath("/dashboard"); return; }
      const { data: profile } = await supabase
        .from("recruiter_profiles").select("id").eq("user_id", userId).maybeSingle();
      setDashboardPath(profile ? "/profile" : "/client/dashboard");
    })();
  }, [session]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  const loggedIn = Boolean(session && dashboardPath);
  const linkClass = "rounded-full px-3.5 py-2 text-[15px] text-ks-ink-2 transition-colors hover:bg-[rgba(20,19,18,0.05)]";

  return (
    <header className="ks-site sticky top-0 z-50 border-b border-ks-line bg-[rgba(245,241,234,0.82)] backdrop-blur-[16px]">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Plateforme" className="hidden md:flex">
            <SmartLink href="/open-needs" className={linkClass}>Besoins ouverts</SmartLink>
          </nav>
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          {loggedIn ? (
            <>
              <button type="button" onClick={handleLogout} className={linkClass}>Se déconnecter</button>
              <Cta href={dashboardPath!} variant="dark">Mon espace</Cta>
            </>
          ) : (
            <>
              <SmartLink href={ROUTES.login} className={linkClass}>Se connecter</SmartLink>
              <Cta href={ROUTES.freelance} variant="secondary">Je suis freelance</Cta>
              <Cta href={ROUTES.recruit}>Je recrute</Cta>
            </>
          )}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Ouvrir le menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ks-line-strong bg-white md:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="ks-site flex w-full flex-col gap-0 border-l-0 bg-ks-bg p-5 sm:max-w-sm">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="pr-10"><Logo /></div>
            <nav aria-label="Plateforme (mobile)" className="mt-8 flex flex-col gap-1">
              <SmartLink href="/open-needs" onClick={() => setMenuOpen(false)} className="rounded-[14px] px-3 py-2.5 text-base font-medium hover:bg-white">
                Besoins ouverts
              </SmartLink>
              {!loggedIn && (
                <SmartLink href={ROUTES.login} onClick={() => setMenuOpen(false)} className="rounded-[14px] px-3 py-2.5 text-base font-medium hover:bg-white">
                  Se connecter
                </SmartLink>
              )}
            </nav>
            <div className="mt-auto flex flex-col gap-2.5 pt-8">
              {loggedIn ? (
                <>
                  <Cta href={dashboardPath!} variant="dark" size="lg" onClick={() => setMenuOpen(false)}>Mon espace</Cta>
                  <button type="button" onClick={handleLogout} className="h-14 rounded-full border border-ks-line-strong bg-white text-base font-medium">
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Cta href={ROUTES.recruit} size="lg" onClick={() => setMenuOpen(false)}>Je recrute</Cta>
                  <Cta href={ROUTES.freelance} variant="secondary" size="lg" onClick={() => setMenuOpen(false)}>Je suis freelance</Cta>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default KistoneHeader;
