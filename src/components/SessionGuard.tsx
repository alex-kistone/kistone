import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Déconnecte une session dont le compte n'existe plus (supprimé côté serveur) : son jeton reste
 * valide jusqu'à expiration, et toute écriture échouerait alors sur une contrainte d'intégrité.
 * Seules les réponses « compte introuvable » déclenchent la déconnexion, jamais une erreur réseau.
 */
export default function SessionGuard() {
  useEffect(() => {
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
    return () => subscription.unsubscribe();
  }, []);
  return null;
}
