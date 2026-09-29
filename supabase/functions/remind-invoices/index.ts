/**
 * remind-invoices — relances des factures client impayées (appelée chaque matin par pg_cron).
 *
 * Après l'échéance : relance au client à J+1, J+8 et J+15 ; la troisième met l'administration
 * en copie. Accès : en-tête x-cron-secret (CRON_SECRET) ou admin connecté ; corps optionnel
 * { today: "AAAA-MM-JJ" } (admin) pour simuler une date. Sans RESEND_API_KEY, rien ne part.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { APP_URL, esc, layout, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Jours de retard à partir desquels part la relance n° (index + 1). */
const STEPS = [1, 8, 15];
const MIN_GAP_DAYS = 5;
const euro = (n: number) => `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const frDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" });

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
    const today = isAdmin && typeof body.today === "string" ? body.today : new Date().toISOString().slice(0, 10);
    const { data: overdue } = await db.from("client_invoices")
      .select("id, number, total_ttc, due_date, buyer, reminder_count, last_reminded_at")
      .eq("kind", "invoice").eq("status", "issued").lt("due_date", today);

    const { data: admins } = await db.from("user_roles").select("user_id").eq("role", "admin");
    const adminEmails = (await Promise.all((admins ?? []).map((a) => db.auth.admin.getUserById(a.user_id))))
      .map((r) => r.data.user?.email).filter((e): e is string => !!e);

    const report = { date: today, reminded: [] as string[], errors: [] as string[] };
    for (const inv of overdue ?? []) {
      const late = Math.round((Date.parse(today) - Date.parse(inv.due_date)) / 86_400_000);
      const step = inv.reminder_count;
      if (step >= STEPS.length || late < STEPS[step]) continue;
      // Au moins MIN_GAP_DAYS entre deux relances, même si la tâche a manqué des jours.
      if (inv.last_reminded_at && Date.parse(today) - Date.parse(inv.last_reminded_at.slice(0, 10)) < MIN_GAP_DAYS * 86_400_000) continue;
      const last = step === STEPS.length - 1;
      const to = [inv.buyer?.billing_email, ...(last ? adminEmails : [])].filter(Boolean) as string[];
      const res = await sendEmail({
        to,
        subject: `${last ? "Dernière relance" : "Relance"} : facture ${inv.number} échue le ${frDate(inv.due_date)}`,
        html: layout({
          title: `Facture ${inv.number} en attente de règlement`,
          paragraphs: [
            `Sauf erreur de notre part, la facture <strong>${esc(inv.number)}</strong> de ${esc(euro(inv.total_ttc))} TTC, échue le ${esc(frDate(inv.due_date))}, n'a pas encore été réglée (${late} jour${late > 1 ? "s" : ""} de retard).`,
            last
              ? "Sans règlement de votre part, des pénalités de retard et l'indemnité forfaitaire de 40 € pourront être appliquées."
              : "Si le virement est déjà parti, merci de ne pas tenir compte de ce message.",
          ],
          cta: { label: "Voir la facture", href: `${APP_URL}/client/dashboard?tab=invoices` },
        }),
      });
      await db.from("client_invoices").update({ reminder_count: step + 1, last_reminded_at: new Date().toISOString() }).eq("id", inv.id);
      report.reminded.push(`${inv.number}:relance ${step + 1}:${res.sent ? "envoyée" : "non envoyée"}`);
      if (res.error) report.errors.push(res.error);
    }
    return json(report);
  } catch (e) {
    console.error("remind-invoices", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
