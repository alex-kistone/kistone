/**
 * remind-cra — relances quotidiennes des CRA (appelée chaque matin par pg_cron).
 *
 *   - Freelance, fin de mois (J-5 et J-1) : CRA du mois en cours pas encore envoyé.
 *   - Freelance, début de mois (le 2 et le 5) : CRA du mois précédent pas encore envoyé.
 *   - Client : CRA envoyé depuis plus de 48 h et pas encore validé, puis toutes les 48 h.
 *
 * Accès : en-tête x-cron-secret égal au secret CRON_SECRET, ou un admin connecté.
 * Corps optionnel { today: "AAAA-MM-JJ" } (admin seulement) pour simuler une date.
 * Sans RESEND_API_KEY, rien ne part : la réponse liste ce qui aurait été envoyé.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { APP_URL, esc, layout, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DONE = ["submitted", "client_approved", "admin_invoiced"];
const CLIENT_DELAY_MS = 48 * 3600 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const cronSecret = Deno.env.get("CRON_SECRET");
  let isAdmin = false;
  if (!(cronSecret && req.headers.get("x-cron-secret") === cronSecret)) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = token
      ? await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token)
      : { data: { user: null } };
    const { data } = user ? await db.rpc("has_role", { _user_id: user.id, _role: "admin" }) : { data: false };
    if (!data) return json({ error: "Accès refusé" }, 401);
    isAdmin = true;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const today = isAdmin && typeof body.today === "string" ? new Date(`${body.today}T08:00:00Z`) : now;
    const y = today.getUTCFullYear(), m = today.getUTCMonth() + 1, d = today.getUTCDate();
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const prev = m === 1 ? { m: 12, y: y - 1 } : { m: m - 1, y };

    // Quel mois relancer côté freelance aujourd'hui ?
    let target: { m: number; y: number; kind: "end" | "late" } | null = null;
    if (lastDay - d === 5 || lastDay - d === 1) target = { m, y, kind: "end" };
    else if (d === 2 || d === 5) target = { ...prev, kind: "late" };

    const report = { date: today.toISOString().slice(0, 10), freelance: [] as string[], client: [] as string[], errors: [] as string[] };
    const emailOf = async (userId: string) => (await db.auth.admin.getUserById(userId)).data.user?.email ?? null;

    if (target) {
      const monthStart = `${target.y}-${String(target.m).padStart(2, "0")}-01`;
      const monthEnd = new Date(Date.UTC(target.y, target.m, 0)).toISOString().slice(0, 10);
      const { data: missions } = await db.from("missions")
        .select("id, title, company_name, start_date, end_date, recruiter_profile_id")
        .eq("status", "active").lte("start_date", monthEnd);
      const covering = (missions ?? []).filter((x) => !x.end_date || x.end_date >= monthStart);
      const { data: done } = await db.from("timesheets").select("mission_id")
        .in("mission_id", covering.map((x) => x.id)).eq("month", target.m).eq("year", target.y).in("status", DONE);
      const doneIds = new Set((done ?? []).map((t) => t.mission_id));
      for (const mission of covering.filter((x) => !doneIds.has(x.id))) {
        const { data: rp } = await db.from("recruiter_profiles").select("user_id, first_name").eq("id", mission.recruiter_profile_id).single();
        const email = rp ? await emailOf(rp.user_id) : null;
        if (!email) continue;
        const label = `${MONTHS[target.m - 1]} ${target.y}`;
        const res = await sendEmail({
          to: [email],
          subject: target.kind === "late" ? `CRA de ${label} en retard` : `Pensez à votre CRA de ${label}`,
          html: layout({
            title: target.kind === "late" ? `Votre CRA de ${label} n'est pas encore envoyé` : `Votre CRA de ${label}`,
            paragraphs: [
              `Bonjour ${esc(rp!.first_name ?? "")},`,
              target.kind === "late"
                ? `Le CRA de <strong>${esc(label)}</strong> pour la mission <strong>${esc(mission.title)}</strong> (${esc(mission.company_name)}) n'a pas encore été envoyé. Sans lui, la facturation du mois est bloquée.`
                : `Le mois se termine : pensez à saisir et envoyer votre CRA de <strong>${esc(label)}</strong> pour la mission <strong>${esc(mission.title)}</strong> (${esc(mission.company_name)}).`,
            ],
            cta: { label: "Remplir mon CRA", href: `${APP_URL}/profile?tab=missions` },
          }),
        });
        report.freelance.push(`${mission.id}:${res.sent ? "envoyé" : "non envoyé"}`);
        if (res.error) report.errors.push(res.error);
      }
    }

    // Client : CRA en attente depuis plus de 48 h, relance toutes les 48 h.
    const threshold = new Date(today.getTime() - CLIENT_DELAY_MS).toISOString();
    const { data: pending } = await db.from("timesheets")
      .select("id, month, year, need_id, mission_id, submitted_at, client_reminded_at, total_days")
      .eq("status", "submitted").lte("submitted_at", threshold);
    for (const ts of (pending ?? []).filter((t) => !t.client_reminded_at || t.client_reminded_at <= threshold)) {
      const [{ data: need }, { data: mission }] = await Promise.all([
        db.from("client_needs").select("user_id").eq("id", ts.need_id).single(),
        db.from("missions").select("title").eq("id", ts.mission_id).single(),
      ]);
      const email = need ? await emailOf(need.user_id) : null;
      if (!email) continue;
      const label = `${MONTHS[ts.month - 1]} ${ts.year}`;
      const res = await sendEmail({
        to: [email],
        subject: `CRA de ${label} à valider`,
        html: layout({
          title: `Un CRA attend votre validation`,
          paragraphs: [
            `Le CRA de <strong>${esc(label)}</strong> pour la mission <strong>${esc(mission?.title ?? "")}</strong> (${String(ts.total_days).replace(".", ",")} j) attend votre validation.`,
            "Vous pouvez le valider en deux minutes avec un code reçu par email, ou le refuser en indiquant ce qui doit être corrigé.",
          ],
          cta: { label: "Valider le CRA", href: `${APP_URL}/client/dashboard?tab=missions` },
        }),
      });
      await db.from("timesheets").update({ client_reminded_at: today.toISOString() }).eq("id", ts.id);
      report.client.push(`${ts.id}:${res.sent ? "envoyé" : "non envoyé"}`);
      if (res.error) report.errors.push(res.error);
    }

    return json(report);
  } catch (e) {
    console.error("remind-cra", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
