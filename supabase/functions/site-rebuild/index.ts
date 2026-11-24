/**
 * site-rebuild — relance la construction de kistone.fr sur Vercel (admin uniquement).
 *
 * Les pages publiques (blog, sitemap.xml, llms.txt) sont pré-rendues au build : publier,
 * modifier ou dépublier un article depuis le back office ne se voit en ligne qu'après un
 * nouveau build. Le panneau Blog appelle cette fonction après chaque changement visible.
 *
 * Secret : VERCEL_DEPLOY_HOOK — URL du Deploy Hook Vercel (Project Settings > Git >
 * Deploy Hooks, branche main). Sans secret, 503 : rien n'est relancé.
 */
import { requireAdmin } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Réservé aux administrateurs." }, 403);

  const hook = Deno.env.get("VERCEL_DEPLOY_HOOK");
  if (!hook) return json({ error: "Deploy Hook Vercel non configuré (secret VERCEL_DEPLOY_HOOK)." }, 503);

  const res = await fetch(hook, { method: "POST" });
  if (!res.ok) {
    console.error("site-rebuild", res.status, await res.text().catch(() => ""));
    return json({ error: "Vercel a refusé la mise à jour du site." }, 502);
  }
  return json({ ok: true });
});
