import { useEffect } from "react";
import { getSupabase, hasStoredSession } from "@/integrations/supabase/lazy";

/**
 * Déconnecte une session dont le compte n'existe plus (supprimé côté serveur) : son jeton reste
 * valide jusqu'à expiration, et toute écriture échouerait alors sur une contrainte d'intégrité.
 * Seules les réponses « compte introuvable » déclenchent la déconnexion, jamais une erreur réseau.
 * Visiteur sans session enregistrée : rien à vérifier, le SDK Supabase n'est pas chargé.
 */
export default function SessionGuard() {
  useEffect(() => {
    if (!hasStoredSession()) return;
    let unsubscribe = () => {};
    let alive = true;
    getSupabase().then((supabase) => {
      if (!alive) return;
      const check = async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        const { error } = await supabase.auth.getUser();
        if (error && (error.code === "user_not_found" || error.status === 403 || /does not exist/i.test(error.message))) {
          await supabase.auth.signOut({ scope: "local" });
        }
      };
      check();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") check();
      });
      unsubscribe = () => subscription.unsubscribe();
    });
    return () => { alive = false; unsubscribe(); };
  }, []);
  return null;
}
