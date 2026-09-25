import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Session courante et espace de l'utilisateur : admin → /dashboard,
 * freelance (profil recruteur) → /profile, sinon client → /client/dashboard.
 */
export function useAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [spacePath, setSpacePath] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setSpacePath(null); return; }
    let cancelled = false;
    const userId = session.user.id;
    (async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (cancelled) return;
      if (isAdmin) { setSpacePath("/dashboard"); return; }
      const { data: profile } = await supabase.from("recruiter_profiles").select("id").eq("user_id", userId).maybeSingle();
      if (!cancelled) setSpacePath(profile ? "/profile" : "/client/dashboard");
    })();
    return () => { cancelled = true; };
  }, [session]);

  const signOut = () => supabase.auth.signOut();

  // Tant que le rôle n'est pas résolu, /login redirige de lui-même vers le bon espace
  return { loggedIn: Boolean(session), spacePath: spacePath ?? "/login", signOut };
}
