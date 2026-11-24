import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, hasStoredSession } from "@/integrations/supabase/lazy";

/**
 * Session courante et espace de l'utilisateur : admin → /dashboard,
 * freelance (profil recruteur) → /profile, sinon client → /client/dashboard.
 * Sans session enregistrée (la plupart des visiteurs), le SDK Supabase n'est pas chargé.
 */
export function useAccount() {
  const [session, setSession] = useState<Session | null>(null);
  // La session a-t-elle été lue ? (évite d'afficher puis de masquer ce qui dépend de la connexion)
  const [ready, setReady] = useState(false);
  const [spacePath, setSpacePath] = useState<string | null>(null);

  useEffect(() => {
    if (!hasStoredSession()) { setReady(true); return; }
    let alive = true;
    let unsubscribe = () => {};
    getSupabase().then((supabase) => {
      if (!alive) return;
      supabase.auth.getSession().then(({ data }) => {
        if (!alive) return;
        setSession(data.session);
        setReady(true);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      unsubscribe = () => subscription.unsubscribe();
    });
    return () => { alive = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) { setSpacePath(null); return; }
    let cancelled = false;
    const userId = session.user.id;
    (async () => {
      const supabase = await getSupabase();
      if (cancelled) return;
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (cancelled) return;
      if (isAdmin) { setSpacePath("/dashboard"); return; }
      const { data: profile } = await supabase.from("recruiter_profiles").select("id").eq("user_id", userId).maybeSingle();
      if (!cancelled) setSpacePath(profile ? "/profile" : "/client/dashboard");
    })();
    return () => { cancelled = true; };
  }, [session]);

  const signOut = async () => { await (await getSupabase()).auth.signOut(); };

  // Tant que le rôle n'est pas résolu, /login redirige de lui-même vers le bon espace
  return { loggedIn: Boolean(session), ready, spacePath: spacePath ?? "/login", signOut };
}
