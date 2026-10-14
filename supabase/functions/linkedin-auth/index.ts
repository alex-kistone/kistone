/**
 * linkedin-auth — connexion du compte LinkedIn de l'admin (OAuth 2.0), pour publier les
 * cartes de besoins sur son profil.
 *
 * POST (admin, JWT) { action: "start" }      → { url } : page d'autorisation LinkedIn
 * POST (admin, JWT) { action: "status" }     → { connected, name, expires_at }
 * POST (admin, JWT) { action: "disconnect" } → { ok }
 * GET  ?code&state (retour de LinkedIn)      → enregistre le jeton, renvoie vers l'admin
 *
 * Secrets : LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET (app LinkedIn avec les produits
 * « Share on LinkedIn » et « Sign In with LinkedIn using OpenID Connect »).
 * URL de redirection à déclarer dans l'app : <SUPABASE_URL>/functions/v1/linkedin-auth
 * Déployée sans vérification JWT (le retour de LinkedIn n'en porte pas) : config.toml.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/adminAuth.ts";
import { APP_URL } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SCOPES = "openid profile w_member_social";
const redirectUri = () => `${Deno.env.get("SUPABASE_URL")}/functions/v1/linkedin-auth`;
const back = (status: string) => Response.redirect(`${APP_URL}/dashboard?tab=needs&linkedin=${status}`, 302);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
  const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET");

  // Retour de LinkedIn après autorisation
  if (req.method === "GET") {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || !clientId || !clientSecret) return back("error");
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row } = await db.from("linkedin_connections").select("user_id, state_expires_at").eq("oauth_state", state).maybeSingle();
    if (!row || !row.state_expires_at || new Date(row.state_expires_at) < new Date()) return back("expired");

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(), client_id: clientId, client_secret: clientSecret }),
    });
    const token = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !token.access_token) {
      console.error("linkedin-auth token", tokenRes.status, JSON.stringify(token).slice(0, 300));
      return back("error");
    }
    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
    const me = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !me.sub) return back("error");

    await db.from("linkedin_connections").update({
      access_token: token.access_token,
      expires_at: new Date(Date.now() + (Number(token.expires_in) || 5_184_000) * 1000).toISOString(),
      member_urn: `urn:li:person:${me.sub}`,
      member_name: me.name ?? null,
      oauth_state: null,
      state_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", row.user_id);
    return back("connected");
  }

  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Réservé aux administrateurs." }, 403);
  const { action } = await req.json().catch(() => ({}));

  if (action === "status") {
    const { data } = await admin.db.from("linkedin_connections").select("member_name, expires_at, access_token").eq("user_id", admin.userId).maybeSingle();
    const connected = !!data?.access_token && !!data.expires_at && new Date(data.expires_at) > new Date();
    return json({ connected, name: data?.member_name ?? null, expires_at: data?.expires_at ?? null, configured: !!clientId && !!clientSecret });
  }

  if (action === "disconnect") {
    await admin.db.from("linkedin_connections").delete().eq("user_id", admin.userId);
    return json({ ok: true });
  }

  if (action === "start") {
    if (!clientId || !clientSecret) return json({ error: "Application LinkedIn non configurée (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET)." }, 503);
    const state = crypto.randomUUID();
    await admin.db.from("linkedin_connections").upsert({
      user_id: admin.userId,
      oauth_state: state,
      state_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    const url = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri(), state, scope: SCOPES })}`;
    return json({ url });
  }

  return json({ error: "Action inconnue." }, 400);
});
