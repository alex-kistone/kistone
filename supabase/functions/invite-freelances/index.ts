/**
 * invite-freelances — l'admin invite des freelances pas encore inscrits à rejoindre Kistone.
 *
 * Corps : { invitations: [{ email, first_name? }], audience: "ai" | "rpo", mode: "individual" | "bcc", message?, subject? }
 * - audience : modèle experts IA (AI Engineer, AI Product, AI Leader) ou Tech recruiters (RPO) ;
 * - individual : un email par personne, personnalisé avec le prénom ;
 * - bcc : un seul envoi par groupe de 49 adresses en copie cachée (« Bonjour, »).
 * Les adresses déjà inscrites (freelance ou client) sont écartées. Les réponses arrivent chez
 * l'admin qui envoie (reply-to). Chaque invitation est journalisée dans freelance_invitations.
 * Réponse : { sent, skipped: [{ email, reason }], failed: [{ email, error }] }
 */
import { requireAdmin } from "../_shared/adminAuth.ts";
import { APP_URL, emailConfigured, sendEmail } from "../_shared/email.ts";
import { INVITATION_TEMPLATES, invitationEmail } from "../_shared/invitationEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const MAX_PER_CALL = 200;
const BCC_CHUNK = 49; // Resend : 50 destinataires au plus par email, dont le destinataire visible
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Réservé aux administrateurs." }, 403);
  if (!emailConfigured()) return json({ error: "Envoi d'emails non configuré (RESEND_API_KEY manquante)." }, 503);

  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "bcc" ? "bcc" : "individual";
  const audience = body.audience === "rpo" ? "rpo" : "ai";
  const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";
  const subject = typeof body.subject === "string" && body.subject.trim() ? body.subject.trim().slice(0, 200) : INVITATION_TEMPLATES[audience].subject;

  // Adresses valides, dédoublonnées
  const seen = new Set<string>();
  const skipped: { email: string; reason: string }[] = [];
  const list: { email: string; first_name: string | null }[] = [];
  for (const i of Array.isArray(body.invitations) ? body.invitations : []) {
    const email = String(i?.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { if (email) skipped.push({ email, reason: "adresse invalide" }); continue; }
    if (seen.has(email)) continue;
    seen.add(email);
    list.push({ email, first_name: typeof i?.first_name === "string" && i.first_name.trim() ? i.first_name.trim().slice(0, 60) : null });
  }
  if (!list.length) return json({ error: "Aucune adresse valide.", skipped }, 400);
  if (list.length > MAX_PER_CALL) return json({ error: `${MAX_PER_CALL} adresses au maximum par envoi.` }, 400);

  // Déjà inscrits sur la plateforme : on ne les invite pas
  const emails = list.map((l) => l.email);
  const [{ data: freelances }, { data: clients }] = await Promise.all([
    admin.db.from("recruiter_profiles").select("email").in("email", emails),
    admin.db.from("client_profiles").select("email").in("email", emails),
  ]);
  const registered = new Set([...(freelances ?? []), ...(clients ?? [])].map((r: { email: string | null }) => (r.email ?? "").toLowerCase()));
  const targets = list.filter((l) => {
    if (registered.has(l.email)) { skipped.push({ email: l.email, reason: "déjà inscrit" }); return false; }
    return true;
  });
  if (!targets.length) return json({ sent: 0, skipped, failed: [] });

  const { data: { user } } = await admin.db.auth.admin.getUserById(admin.userId);
  const replyTo = user?.email ?? undefined;
  const failed: { email: string; error: string }[] = [];
  const log: { email: string; first_name: string | null; mode: string; audience: string; invited_by: string; error: string | null }[] = [];

  if (mode === "individual") {
    for (const t of targets) {
      const r = await sendEmail({ to: [t.email], replyTo, subject, html: invitationEmail({ audience, firstName: t.first_name, message, appUrl: APP_URL }) });
      if (!r.sent) failed.push({ email: t.email, error: r.error ?? "non envoyé" });
      log.push({ email: t.email, first_name: t.first_name, mode, audience, invited_by: admin.userId, error: r.sent ? null : r.error ?? "non envoyé" });
      await sleep(550); // limite de débit Resend (2 envois par seconde)
    }
  } else {
    const html = invitationEmail({ audience, message, appUrl: APP_URL });
    const visible = replyTo ?? "notifications@kistone.fr";
    for (let i = 0; i < targets.length; i += BCC_CHUNK) {
      const chunk = targets.slice(i, i + BCC_CHUNK);
      const r = await sendEmail({ to: [visible], bcc: chunk.map((c) => c.email), replyTo, subject, html });
      for (const c of chunk) {
        if (!r.sent) failed.push({ email: c.email, error: r.error ?? "non envoyé" });
        log.push({ email: c.email, first_name: c.first_name, mode, audience, invited_by: admin.userId, error: r.sent ? null : r.error ?? "non envoyé" });
      }
      await sleep(550);
    }
  }

  const { error: logError } = await admin.db.from("freelance_invitations").insert(log);
  if (logError) console.error("invite-freelances log:", logError.message);
  return json({ sent: targets.length - failed.length, skipped, failed });
});
