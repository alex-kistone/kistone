/**
 * remind-signup — relance les freelances qui ont commencé leur inscription (étape LinkedIn) sans
 * remplir leur fiche (onboarding_completed = false). Appelée chaque matin par pg_cron.
 *
 *   - 1er rappel : au moins 24 h après l'inscription ;
 *   - 2e rappel : au moins 3 jours après le premier ; jamais plus de deux.
 *
 * Accès : en-tête x-cron-secret égal au secret CRON_SECRET, ou un admin connecté.
 * Corps optionnel { dry_run: true } (admin) : liste ce qui serait envoyé, sans rien envoyer.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { APP_URL, sendEmail } from "../_shared/email.ts";
import { signupReminderEmail } from "../_shared/signupReminderEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DAY = 24 * 3600 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    const { data: isAdmin } = user ? await db.rpc("has_role", { _user_id: user.id, _role: "admin" }) : { data: false };
    if (!isAdmin) return json({ error: "Accès refusé" }, 401);
  }
  const { dry_run } = await req.json().catch(() => ({}));

  const now = Date.now();
  const { data: profiles, error } = await db
    .from("recruiter_profiles")
    .select("id, email, created_at, signup_reminders, signup_reminded_at")
    .eq("onboarding_completed", false)
    .lt("signup_reminders", 2)
    .lte("created_at", new Date(now - DAY).toISOString());
  if (error) return json({ error: error.message }, 500);

  const due = (profiles ?? []).filter((p) =>
    p.email && (p.signup_reminders === 0 || (p.signup_reminded_at && now - new Date(p.signup_reminded_at).getTime() >= 3 * DAY))
  );

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const p of due) {
    const attempt = (p.signup_reminders + 1) as 1 | 2;
    if (dry_run) { sent.push(`${p.email} (rappel ${attempt})`); continue; }
    const { subject, html } = signupReminderEmail({ attempt, appUrl: APP_URL });
    const r = await sendEmail({ to: [p.email], subject, html });
    if (!r.sent) { failed.push({ email: p.email, error: r.error ?? "non envoyé" }); continue; }
    await db.from("recruiter_profiles").update({ signup_reminders: attempt, signup_reminded_at: new Date().toISOString() }).eq("id", p.id);
    sent.push(`${p.email} (rappel ${attempt})`);
    await sleep(550); // limite de débit Resend
  }
  return json({ dry_run: !!dry_run, sent, failed });
});
