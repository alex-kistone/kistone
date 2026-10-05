/**
 * notify-dispatch — envoie par email les notifications en attente (pg_cron, toutes les 5 min).
 *
 * Prend les notifications `email = true` pas encore traitées et de moins de 24 h, les regroupe
 * par destinataire (une notification : email dédié ; plusieurs : un récapitulatif) et marque
 * chacune `sent`, `skipped` (pas de clé Resend, compte de test) ou `error`.
 * Accès : en-tête x-cron-secret (CRON_SECRET) ou admin connecté.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { APP_URL, emailConfigured, esc, layout, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

interface Pending { id: string; user_id: string; title: string; body: string | null; link: string | null }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!(cronSecret && req.headers.get("x-cron-secret") === cronSecret)) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = token
      ? await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token)
      : { data: { user: null } };
    const { data } = user ? await db.rpc("has_role", { _user_id: user.id, _role: "admin" }) : { data: false };
    if (!data) return json({ error: "Accès refusé" }, 401);
  }

  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: pending, error } = await db.from("notifications")
      .select("id, user_id, title, body, link")
      .eq("email", true).is("email_status", null).gte("created_at", since)
      .order("created_at").limit(500);
    if (error) throw error;

    const byUser = new Map<string, Pending[]>();
    for (const n of (pending ?? []) as Pending[]) byUser.set(n.user_id, [...(byUser.get(n.user_id) ?? []), n]);

    const report = { sent: 0, skipped: 0, errors: [] as string[] };
    const mark = (ids: string[], status: "sent" | "skipped" | "error") =>
      db.from("notifications").update({ email_status: status, email_sent_at: new Date().toISOString() }).in("id", ids);

    for (const [userId, items] of byUser) {
      const ids = items.map((i) => i.id);
      const email = (await db.auth.admin.getUserById(userId)).data.user?.email;
      if (!email || email.endsWith(".invalid") || !emailConfigured()) {
        await mark(ids, "skipped");
        report.skipped += ids.length;
        continue;
      }
      const single = items.length === 1 ? items[0] : null;
      const res = await sendEmail({
        to: [email],
        subject: single ? single.title : `${items.length} nouveautés sur Kistone`,
        html: single
          ? layout({
            title: single.title,
            // Les retours à la ligne du message (relances de l'admin : liste des éléments manquants) sont conservés
            paragraphs: esc(single.body ?? "").split(/\n{2,}/).map((p) => p.replace(/\n/g, "<br>")),
            cta: single.link ? { label: "Ouvrir mon espace", href: `${APP_URL}${single.link}` } : undefined,
          })
          : layout({
            title: `${items.length} nouveautés vous attendent`,
            paragraphs: items.map((i) => `<strong>${esc(i.title)}</strong> — ${esc(i.body ?? "")}`),
            cta: { label: "Ouvrir mon espace", href: `${APP_URL}${items[0].link ?? "/"}` },
          }),
      });
      await mark(ids, res.sent ? "sent" : "error");
      if (res.sent) report.sent += ids.length;
      else report.errors.push(res.error ?? "échec");
    }
    return json(report);
  } catch (e) {
    console.error("notify-dispatch", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
