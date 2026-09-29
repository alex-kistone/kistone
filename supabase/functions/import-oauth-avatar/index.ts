/**
 * import-oauth-avatar — copie la photo du compte LinkedIn / Google dans le bucket
 * profile-photos, puis renvoie son URL publique.
 *
 * Les URL de photo LinkedIn expirent et ne se téléchargent pas depuis le navigateur
 * (CORS) : on les copie côté serveur. L'adresse de l'image est lue dans la session de
 * l'utilisateur (user_metadata), jamais dans la requête, et seuls les hôtes LinkedIn
 * et Google sont acceptés.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED_HOSTS = [/(^|\.)licdn\.com$/, /(^|\.)googleusercontent\.com$/];
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non authentifié" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    const { data: { user } } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Non authentifié" }, 401);

    const source = (user.user_metadata?.picture ?? user.user_metadata?.avatar_url) as string | undefined;
    if (!source) return json({ photo_url: null, reason: "Aucune photo fournie par le compte" });

    let url: URL;
    try { url = new URL(source); } catch { return json({ photo_url: null, reason: "Adresse de photo invalide" }); }
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.some((h) => h.test(url.hostname))) {
      return json({ photo_url: null, reason: "Hôte de photo non autorisé" });
    }

    const res = await fetch(url, { redirect: "follow" });
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !EXTENSIONS[type]) return json({ photo_url: null, reason: "Photo indisponible" });

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) return json({ photo_url: null, reason: "Photo trop lourde" });

    const path = `${user.id}/${crypto.randomUUID()}.${EXTENSIONS[type]}`;
    const { error } = await admin.storage.from("profile-photos").upload(path, bytes, { contentType: type });
    if (error) throw error;

    const { data } = admin.storage.from("profile-photos").getPublicUrl(path);
    return json({ photo_url: data.publicUrl });
  } catch (err) {
    console.error("import-oauth-avatar:", err);
    return json({ error: err instanceof Error ? err.message : "Erreur inconnue" }, 500);
  }
});
