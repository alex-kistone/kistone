/**
 * cra-sign — validation signée d'un CRA.
 *
 * Actions (corps JSON { action, timesheet_id, … }) :
 *   - request_code : le client de la mission reçoit un code à 6 chiffres par email (10 min).
 *   - sign         : le client saisit le code, son nom et coche la certification ; le CRA passe
 *                    « client_approved », un PDF de preuve est stocké avec son empreinte SHA-256.
 *   - admin_approve: validation de secours par l'admin, motif obligatoire, même preuve.
 *   - proof_url    : URL signée (5 min) du PDF de preuve, pour l'admin ou le client.
 *
 * La preuve porte le TJM client : jamais envoyée ni ouverte au freelance.
 * Sans RESEND_API_KEY, aucun code ne part par email ; seuls les comptes de test
 * (@….invalid, qui ne reçoivent pas d'email) récupèrent le code dans la réponse.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { APP_URL, emailConfigured, esc, layout, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

class Refusal extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BUCKET = "timesheet-proofs";
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const CATEGORY: Record<string, string> = { transport: "Transport", hebergement: "Hébergement", repas: "Repas", autre: "Autre" };

const sha256 = async (data: string | Uint8Array) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const euro = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const monthLabel = (m: number, y: number) => `${MONTHS[m - 1]} ${y}`;
const parisTime = (iso: string) => new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

interface Loaded {
  ts: Record<string, any>;
  mission: { id: string; title: string; company_name: string; client_tjm: number };
  clientUserId: string;
  consultantFirstName: string;
  days: { day_date: string; value: number }[];
  expenses: { expense_date: string; category: string; label: string; amount_ht: number; vat_amount: number }[];
}

async function load(db: SupabaseClient, timesheetId: string): Promise<Loaded> {
  const { data: ts } = await db.from("timesheets").select("*").eq("id", timesheetId).maybeSingle();
  if (!ts || !ts.mission_id) throw new Refusal("CRA introuvable", 404);
  const [{ data: mission }, { data: need }, { data: rp }, { data: days }, { data: expenses }] = await Promise.all([
    db.from("missions").select("id, title, company_name, client_tjm").eq("id", ts.mission_id).single(),
    db.from("client_needs").select("user_id").eq("id", ts.need_id).single(),
    db.from("recruiter_profiles").select("first_name").eq("id", ts.recruiter_profile_id).single(),
    db.from("timesheet_days").select("day_date, value").eq("timesheet_id", timesheetId).order("day_date"),
    db.from("timesheet_expenses").select("expense_date, category, label, amount_ht, vat_amount").eq("timesheet_id", timesheetId).order("expense_date"),
  ]);
  if (!mission || !need) throw new Refusal("Mission introuvable", 404);
  return {
    ts, mission, clientUserId: need.user_id, consultantFirstName: rp?.first_name ?? "Consultant",
    days: (days ?? []).map((d) => ({ day_date: d.day_date, value: Number(d.value) })),
    expenses: (expenses ?? []).map((e) => ({ ...e, amount_ht: Number(e.amount_ht), vat_amount: Number(e.vat_amount) })),
  };
}

// Les polices standard de pdf-lib n'encodent que WinAnsi : on ramène le reste vers l'ASCII.
const clean = (s: string) => s
  .replace(/[‘’]/g, "'").replace(/[“”«»]/g, '"').replace(/…/g, "...")
  .replace(/[–—→]/g, "-").replace(/[   ]/g, " ")
  .replace(/[^\x20-\x7EÀ-ÿ€·]/g, "?");

async function buildProof(l: Loaded, sig: {
  name: string; email: string; signedAt: string; method: "otp_email" | "admin";
  ip: string | null; userAgent: string | null; reference: string; reason?: string; comment?: string | null;
}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`CRA ${monthLabel(l.ts.month, l.ts.year)} - ${l.mission.title}`);
  pdf.setProducer("Kistone");
  let page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);
  const ink = rgb(0.043, 0.043, 0.059);
  const grey = rgb(0.45, 0.45, 0.5);
  const pink = rgb(1, 0.18, 0.43);
  const left = 56;
  let y = 790;

  const ensure = (h: number) => { if (y - h < 60) { page = pdf.addPage([595.28, 841.89]); y = 790; } };
  const text = (t: string, size = 11, f = font, color = ink, x = left) => {
    ensure(size + 6);
    page.drawText(clean(t), { x, y, size, font: f, color, maxWidth: 483 });
    y -= size + 6;
  };
  const row = (a: string, b: string, f = font, size = 11) => {
    ensure(size + 6);
    page.drawText(clean(a), { x: left, y, size, font: f, color: ink, maxWidth: 330 });
    page.drawText(clean(b), { x: 400, y, size, font: f === font ? mono : f, color: ink });
    y -= size + 6;
  };
  const label = (t: string) => { ensure(20); y -= 4; page.drawText(clean(t.toUpperCase()), { x: left, y, size: 8, font: mono, color: grey }); y -= 14; };
  const rule = () => { ensure(14); page.drawLine({ start: { x: left, y: y + 4 }, end: { x: 539, y: y + 4 }, thickness: 1, color: ink }); y -= 10; };

  page.drawText("kistone", { x: left, y, size: 14, font: bold, color: ink });
  page.drawRectangle({ x: left, y: y - 4, width: 22, height: 2, color: pink });
  y -= 30;
  text(`Compte rendu d'activité - ${monthLabel(l.ts.month, l.ts.year)}`, 18, bold);
  y -= 4;
  rule();
  label("Mission");
  text(l.mission.title, 12, bold);
  label("Client");
  text(l.mission.company_name);
  label("Consultant");
  text(l.consultantFirstName);
  label("Taux journalier HT");
  text(`${euro(l.mission.client_tjm)} / jour`);
  rule();

  label("Jours déclarés");
  for (const d of l.days) {
    const date = new Date(`${d.day_date}T12:00:00Z`);
    row(date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }), d.value === 1 ? "1 j" : "0,5 j");
  }
  const total = l.days.reduce((s, d) => s + d.value, 0);
  y -= 4;
  row("Total", `${String(total).replace(".", ",")} j`, bold, 12);
  row("Montant HT", euro(total * l.mission.client_tjm), bold, 12);

  if (l.expenses.length) {
    label("Frais de mission");
    for (const e of l.expenses) {
      row(`${new Date(`${e.expense_date}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" })} · ${CATEGORY[e.category] ?? e.category} · ${e.label}`, `${euro(e.amount_ht)} HT`, font, 10);
    }
    const ht = l.expenses.reduce((s, e) => s + e.amount_ht, 0);
    const vat = l.expenses.reduce((s, e) => s + e.vat_amount, 0);
    row("Total frais", `${euro(ht)} HT`, bold, 11);
    if (vat > 0) text(`dont TVA récupérable : ${euro(vat)}`, 9, font, grey);
  }
  if (l.ts.freelancer_comment) { label("Commentaire du consultant"); text(l.ts.freelancer_comment, 10); }
  if (sig.comment) { label("Commentaire du client"); text(sig.comment, 10); }
  if (l.ts.submitted_at) text(`Envoyé par le consultant le ${parisTime(l.ts.submitted_at)}`, 9, font, grey);
  y -= 6;
  rule();

  if (sig.method === "otp_email") {
    label("Signature électronique du client");
    text(`Signé par ${sig.name} (${sig.email})`, 11, bold);
    text(`Le ${parisTime(sig.signedAt)} (heure de Paris)`);
    text("Le signataire certifie l'exactitude des jours déclarés et valide ce CRA.", 10);
    text(`Méthode : connexion au compte + code à usage unique envoyé à ${sig.email}`, 9, font, grey);
  } else {
    label("Validation par l'administration Kistone");
    text(`Validé par ${sig.name} (${sig.email})`, 11, bold);
    text(`Le ${parisTime(sig.signedAt)} (heure de Paris)`);
    text(`Motif : ${sig.reason}`, 10);
  }
  if (sig.ip) text(`Adresse IP : ${sig.ip}`, 9, font, grey);
  if (sig.userAgent) text(`Navigateur : ${sig.userAgent.slice(0, 90)}`, 9, font, grey);
  text(`Référence : ${sig.reference}`, 9, mono, grey);

  for (const p of pdf.getPages()) {
    p.drawText("Document généré par Kistone. Son empreinte SHA-256 est enregistrée avec la validation.", { x: left, y: 36, size: 8, font, color: grey });
  }
  return await pdf.save();
}

async function finalize(db: SupabaseClient, l: Loaded, signer: { id: string; name: string; email: string }, opts: {
  method: "otp_email" | "admin"; ip: string | null; userAgent: string | null; reason?: string; comment?: string | null;
}) {
  const signedAt = new Date().toISOString();
  const reference = `KS-CRA-${l.ts.year}${String(l.ts.month).padStart(2, "0")}-${l.ts.id.slice(0, 8).toUpperCase()}`;
  const bytes = await buildProof(l, { ...signer, signedAt, method: opts.method, ip: opts.ip, userAgent: opts.userAgent, reference, reason: opts.reason, comment: opts.comment });
  const digest = await sha256(bytes);
  const path = `${l.clientUserId}/${l.ts.id}.pdf`;
  const { error: upErr } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`Stockage de la preuve : ${upErr.message}`);

  // Passage à « validé » uniquement depuis « soumis » : deux validations simultanées ne passent pas.
  const { data: updated, error: tsErr } = await db.from("timesheets").update({
    status: "client_approved",
    signed_at: signedAt,
    approval_method: opts.method,
    admin_approval_reason: opts.method === "admin" ? opts.reason : null,
    client_reviewed_at: signedAt,
    client_reviewed_by: opts.method === "otp_email" ? signer.id : null,
    ...(opts.comment ? { client_comment: opts.comment } : {}),
  }).eq("id", l.ts.id).eq("status", "submitted").select("id");
  if (tsErr) throw new Error(tsErr.message);
  if (!updated?.length) throw new Refusal("Ce CRA n'est plus en attente de validation.", 409);

  const { error: sigErr } = await db.from("timesheet_signatures").upsert({
    timesheet_id: l.ts.id, signer_id: signer.id, signer_name: signer.name, signer_email: signer.email,
    method: opts.method, signed_at: signedAt, ip: opts.ip, user_agent: opts.userAgent,
    document_path: path, document_sha256: digest,
    certificate: {
      reference, method: opts.method, reason: opts.reason ?? null,
      signer, ip: opts.ip, user_agent: opts.userAgent, signed_at: signedAt,
      document: { path, sha256: digest },
      timesheet: { id: l.ts.id, mission_id: l.mission.id, month: l.ts.month, year: l.ts.year, total_days: l.days.reduce((s, d) => s + d.value, 0) },
    },
  }, { onConflict: "timesheet_id" });
  if (sigErr) throw new Error(sigErr.message);

  // Emails : preuve au client et aux admins ; au freelance, la validation sans montant client.
  const month = monthLabel(l.ts.month, l.ts.year);
  const { data: admins } = await db.from("user_roles").select("user_id").eq("role", "admin");
  const ids = [...new Set([l.clientUserId, ...(admins ?? []).map((a) => a.user_id)])];
  const emails = (await Promise.all(ids.map((id) => db.auth.admin.getUserById(id))))
    .map((r) => r.data.user?.email).filter((e): e is string => !!e);
  await sendEmail({
    to: emails,
    subject: `CRA ${month} validé — ${l.mission.title}`,
    html: layout({
      title: `CRA de ${month} validé`,
      paragraphs: [
        `Mission : <strong>${esc(l.mission.title)}</strong> — ${esc(l.mission.company_name)}.`,
        `${opts.method === "admin" ? "Validé par l'administration Kistone" : `Signé par ${esc(signer.name)}`} le ${esc(parisTime(signedAt))}. La preuve est jointe (référence ${reference}).`,
      ],
    }),
    attachments: [{ filename: `CRA-${l.ts.year}-${String(l.ts.month).padStart(2, "0")}.pdf`, content: bytes }],
  });
  const { data: rp } = await db.from("recruiter_profiles").select("user_id").eq("id", l.ts.recruiter_profile_id).single();
  const freelanceEmail = rp ? (await db.auth.admin.getUserById(rp.user_id)).data.user?.email : null;
  if (freelanceEmail) {
    await sendEmail({
      to: [freelanceEmail],
      subject: `Votre CRA de ${month} est validé`,
      html: layout({
        title: `CRA de ${month} validé`,
        paragraphs: [`Votre CRA pour la mission <strong>${esc(l.mission.title)}</strong> a été validé le ${esc(parisTime(signedAt))}.`],
        cta: { label: "Voir mes missions", href: `${APP_URL}/profile?tab=missions` },
      }),
    });
  }
  return { reference, signed_at: signedAt, sha256: digest };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Non authentifié" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);
    if (!user) return json({ error: "Non authentifié" }, 401);
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });

    const body = await req.json().catch(() => ({}));
    const { action, timesheet_id } = body as { action?: string; timesheet_id?: string };
    if (!timesheet_id) throw new Refusal("timesheet_id requis");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    const userAgent = req.headers.get("user-agent");
    const l = await load(db, timesheet_id);
    const isClient = l.clientUserId === user.id;

    if (action === "proof_url") {
      if (!isAdmin && !isClient) throw new Refusal("Accès refusé", 403);
      const { data: sig } = await db.from("timesheet_signatures").select("document_path").eq("timesheet_id", timesheet_id).maybeSingle();
      if (!sig) throw new Refusal("Pas encore de preuve pour ce CRA", 404);
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(sig.document_path, 300);
      if (error || !data) throw new Error(error?.message ?? "URL impossible");
      return json({ url: data.signedUrl });
    }

    if (action === "admin_approve") {
      if (!isAdmin) throw new Refusal("Réservé à l'administration", 403);
      const reason = String(body.reason ?? "").trim();
      if (reason.length < 5) throw new Refusal("Indiquez le motif de la validation de secours.");
      if (l.ts.status !== "submitted") throw new Refusal("Ce CRA n'est pas en attente de validation.", 409);
      const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Administration";
      return json(await finalize(db, l, { id: user.id, name, email: user.email ?? "" }, { method: "admin", ip, userAgent, reason }));
    }

    // Actions du client de la mission
    if (!isClient) throw new Refusal("Ce CRA ne vous concerne pas.", 403);
    if (l.ts.status !== "submitted") throw new Refusal("Ce CRA n'est pas en attente de validation.", 409);
    const email = user.email ?? "";

    if (action === "request_code") {
      const testAccount = email.endsWith(".invalid");
      if (!emailConfigured() && !testAccount) {
        throw new Refusal("L'envoi des codes par email n'est pas encore activé. Contactez Kistone pour faire valider ce CRA.", 503);
      }
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      const now = new Date();
      await db.from("timesheet_signature_codes").update({ used_at: now.toISOString() })
        .eq("timesheet_id", timesheet_id).is("used_at", null);
      const { error } = await db.from("timesheet_signature_codes").insert({
        timesheet_id, signer_id: user.id, code_hash: await sha256(`${timesheet_id}:${code}`),
        expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
      });
      if (error) throw new Error(error.message);
      const month = monthLabel(l.ts.month, l.ts.year);
      const sent = await sendEmail({
        to: [email],
        subject: `${code} — code de validation du CRA de ${month}`,
        html: layout({
          title: "Votre code de validation",
          paragraphs: [
            `Pour valider le CRA de <strong>${esc(month)}</strong> (${esc(l.mission.title)}), saisissez ce code :`,
            `<span style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</span>`,
            "Il est valable 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
          ],
        }),
      });
      if (!sent.sent && !testAccount) throw new Error(sent.error ?? "Envoi de l'email impossible");
      return json({ sent_to: email, expires_in: CODE_TTL_MS / 1000, ...(testAccount ? { test_code: code } : {}) });
    }

    if (action === "sign") {
      const fullName = String(body.full_name ?? "").trim();
      const code = String(body.code ?? "").trim();
      const comment = String(body.comment ?? "").trim() || null;
      if (body.accepted !== true) throw new Refusal("Cochez la certification pour valider le CRA.");
      if (fullName.length < 3) throw new Refusal("Indiquez votre nom complet.");
      const { data: pending } = await db.from("timesheet_signature_codes").select("*")
        .eq("timesheet_id", timesheet_id).eq("signer_id", user.id).is("used_at", null)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!pending) throw new Refusal("Aucun code en attente : demandez un nouveau code.");
      if (new Date(pending.expires_at).getTime() < Date.now()) throw new Refusal("Code expiré : demandez un nouveau code.");
      if (pending.attempts >= MAX_ATTEMPTS) throw new Refusal("Trop d'essais : demandez un nouveau code.");
      if (await sha256(`${timesheet_id}:${code}`) !== pending.code_hash) {
        await db.from("timesheet_signature_codes").update({ attempts: pending.attempts + 1 }).eq("id", pending.id);
        const left = MAX_ATTEMPTS - pending.attempts - 1;
        throw new Refusal(left > 0 ? `Code incorrect (${left} essai${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}).` : "Code incorrect : demandez un nouveau code.");
      }
      await db.from("timesheet_signature_codes").update({ used_at: new Date().toISOString() }).eq("id", pending.id);
      return json(await finalize(db, l, { id: user.id, name: fullName, email }, { method: "otp_email", ip, userAgent, comment }));
    }

    throw new Refusal("Action inconnue");
  } catch (e) {
    if (e instanceof Refusal) return json({ error: e.message }, e.status);
    console.error("cra-sign", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
