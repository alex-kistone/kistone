/**
 * assign-freelance-role — donne le rôle freelance ('user') au compte connecté.
 * Symétrique de assign-client-role : un compte est soit freelance, soit client.
 * Appelée à l'arrivée sur l'espace freelance (/register) et avant la création du profil.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    const { data: { user }, error: userError } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) return json({ error: "Invalid token" }, 401);

    const { data: existing } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const roles = (existing ?? []).map((r: { role: string }) => r.role);

    if (roles.includes("client")) {
      return json({
        error: "ROLE_CONFLICT",
        message: "Ce compte est déjà enregistré en tant que client. Vous ne pouvez pas créer un espace freelance avec la même adresse email.",
      }, 409);
    }
    if (roles.includes("user")) return json({ message: "Role already assigned" });
    if (roles.includes("admin")) return json({ message: "Admin user, skipping freelance role" });

    const { error } = await admin.from("user_roles").insert({ user_id: user.id, role: "user" });
    if (error) throw error;

    return json({ message: "Freelance role assigned" });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erreur inconnue" }, 500);
  }
});
