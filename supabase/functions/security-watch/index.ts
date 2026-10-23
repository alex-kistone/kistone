/**
 * security-watch — veille de sécurité, par email à Alex.
 *
 *   - mode « alert » (appelé par les déclencheurs de la base) : envoie les événements pas encore
 *     signalés (compte passé admin ou retiré, suppression massive) ;
 *   - mode « weekly » (pg_cron, le lundi) : rapport de la semaine. Admins, événements, inscriptions
 *     (pic éventuel), tables sans RLS, en-têtes de sécurité de kistone.fr.
 *
 * Accès : en-tête x-cron-secret égal au secret CRON_SECRET, ou un admin connecté.
 * Corps : { mode: "alert" | "weekly", dry_run?: boolean } ; dry_run renvoie l'email sans l'envoyer.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { APP_URL, esc, layout, sendEmail } from "../_shared/email.ts";

const NOTIFY_TO = "aguego@kistone.fr";
const SITE = "https://kistone.fr/";
/** En-têtes attendus sur kistone.fr (vercel.json). */
const EXPECTED_HEADERS = [
  "content-security-policy", "strict-transport-security", "x-frame-options",
  "x-content-type-options", "referrer-policy", "permissions-policy",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type SecurityEvent = { id?: string; kind: string; detail: Record<string, unknown>; created_at: string };
type Snapshot = {
  admins: { email: string; last_sign_in_at: string | null }[];
  tables_without_rls: string[];
  signups_7d: number;
  signups_prev_7d: number;
  events_7d: SecurityEvent[];
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }) : "jamais";

function describe(e: SecurityEvent): string {
  const d = e.detail;
  const who = d.by ? "par un utilisateur connecté" : "hors application (console, migration ou suppression de compte)";
  if (e.kind === "admin_granted") return `<strong>Nouvel admin</strong> : ${esc(String(d.email ?? d.user_id))}, ${who}, le ${fmtDate(e.created_at)}.`;
  if (e.kind === "admin_revoked") return `<strong>Admin retiré</strong> : ${esc(String(d.email ?? d.user_id))}, ${who}, le ${fmtDate(e.created_at)}.`;
  if (e.kind === "mass_delete") return `<strong>Suppression massive</strong> : ${esc(String(d.rows))} lignes de « ${esc(String(d.table))} », ${who}, le ${fmtDate(e.created_at)}.`;
  return esc(e.kind);
}

/** Vérifie les en-têtes de sécurité du site. La protection anti-robots de Vercel peut répondre à la place du site. */
async function checkHeaders(): Promise<{ ok: boolean; text: string }> {
  try {
    const res = await fetch(SITE, { redirect: "manual", headers: { "User-Agent": "Kistone security-watch" } });
    if (res.headers.get("x-vercel-mitigated")) {
      return { ok: true, text: "Vérification impossible : la protection anti-robots de Vercel a répondu à la place du site (ce n'est pas une anomalie)." };
    }
    const missing = EXPECTED_HEADERS.filter((h) => !res.headers.get(h));
    return missing.length
      ? { ok: false, text: `En-têtes absents sur kistone.fr : ${missing.join(", ")}.` }
      : { ok: true, text: "Tous les en-têtes de sécurité sont présents sur kistone.fr." };
  } catch (e) {
    return { ok: false, text: `kistone.fr injoignable : ${esc(e instanceof Error ? e.message : String(e))}.` };
  }
}

function weeklyEmail(s: Snapshot, headers: { ok: boolean; text: string }) {
  const alerts: string[] = [];
  if (s.events_7d.length) alerts.push(`${s.events_7d.length} événement(s) de sécurité cette semaine`);
  if (s.tables_without_rls.length) alerts.push(`${s.tables_without_rls.length} table(s) sans RLS`);
  if (!headers.ok) alerts.push("en-têtes de sécurité");
  // Pic d'inscriptions : plus du triple de la semaine précédente, et au moins 20
  const spike = s.signups_7d >= 20 && s.signups_7d > 3 * Math.max(1, s.signups_prev_7d);
  if (spike) alerts.push("pic d'inscriptions");

  const paragraphs = [
    alerts.length ? `<strong>À regarder</strong> : ${alerts.join(", ")}.` : "Rien d'anormal cette semaine.",
    `<strong>Admins (${s.admins.length})</strong> :<br>${s.admins.map((a) => `· ${esc(a.email)} (dernière connexion : ${fmtDate(a.last_sign_in_at)})`).join("<br>")}`,
    `<strong>Événements de la semaine</strong> :<br>${s.events_7d.length ? s.events_7d.map((e) => `· ${describe(e)}`).join("<br>") : "aucun."}`,
    `<strong>Inscriptions</strong> : ${s.signups_7d} cette semaine (${s.signups_prev_7d} la semaine précédente)${spike ? ". Pic inhabituel : vérifiez qu'il ne s'agit pas de comptes robots." : "."}`,
    `<strong>Base de données</strong> : ${s.tables_without_rls.length ? `tables sans RLS : ${s.tables_without_rls.map(esc).join(", ")}.` : "toutes les tables sont protégées par RLS."}`,
    `<strong>Site</strong> : ${headers.text}`,
    "Les failles des dépendances du site arrivent séparément, en pull requests Dependabot sur GitHub.",
  ];
  return {
    subject: alerts.length ? `Sécurité Kistone : ${alerts.length} point(s) à regarder` : "Sécurité Kistone : rapport de la semaine, rien d'anormal",
    html: layout({ title: "Rapport de sécurité hebdomadaire", paragraphs, cta: { label: "Ouvrir l'admin", href: `${APP_URL}/admin` } }),
  };
}

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
  const { mode = "alert", dry_run = false } = await req.json().catch(() => ({}));

  if (mode === "weekly") {
    const { data, error } = await db.rpc("security_snapshot");
    if (error) return json({ error: error.message }, 500);
    const email = weeklyEmail(data as Snapshot, await checkHeaders());
    if (dry_run) return json({ dry_run: true, ...email });
    const r = await sendEmail({ to: [NOTIFY_TO], ...email });
    return json({ sent: r.sent, error: r.error });
  }

  // Alerte : événements pas encore signalés
  const { data: events, error } = await db
    .from("security_events")
    .select("id, kind, detail, created_at")
    .is("notified_at", null)
    .order("created_at");
  if (error) return json({ error: error.message }, 500);
  if (!events?.length) return json({ sent: false, reason: "aucun événement" });

  const email = {
    subject: `Alerte sécurité Kistone : ${events.length === 1 ? describe(events[0]).replace(/<[^>]+>/g, "").split(" : ")[0].toLowerCase() : `${events.length} événements`}`,
    html: layout({
      title: "Alerte de sécurité",
      paragraphs: [
        ...events.map((e) => describe(e)),
        "Si ce n'est pas vous, changez votre mot de passe Supabase et vérifiez les rôles dans la table user_roles.",
      ],
    }),
  };
  if (dry_run) return json({ dry_run: true, ...email });
  const r = await sendEmail({ to: [NOTIFY_TO], ...email });
  if (r.sent) await db.from("security_events").update({ notified_at: new Date().toISOString() }).in("id", events.map((e) => e.id));
  return json({ sent: r.sent, error: r.error, events: events.length });
});
