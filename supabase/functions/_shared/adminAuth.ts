import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Client service et utilisateur de la requête, si c'est un admin ; sinon null. */
export async function requireAdmin(req: Request): Promise<{ db: SupabaseClient; userId: string } | null> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);
  if (!user) return null;
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return isAdmin ? { db, userId: user.id } : null;
}
