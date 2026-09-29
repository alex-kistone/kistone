/**
 * invoices — émission des factures client (admin uniquement).
 *
 * Actions (corps JSON { action, invoice_id, … }) :
 *   - issue       : émet un brouillon (numéro, dates, identités figées en base), produit le PDF,
 *                   l'envoie au client et, si activé, à Pennylane.
 *   - credit_note : avoir sur une facture émise (motif obligatoire), mêmes étapes pour l'avoir.
 *   - render      : reproduit le PDF d'une facture émise (si la production avait échoué).
 *
 * Refusé en mode Pennylane (company_settings.invoicing_mode) : les numéros viennent de Pennylane.
 * L'émission est refusée tant que l'identité de Kistone (SIREN, adresse, IBAN) n'est pas
 * complète dans company_settings : un numéro de facture ne se rend pas.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { APP_URL, esc, layout, sendEmail } from "../_shared/email.ts";
import { pennylaneEnabled, pushCustomerInvoice } from "../_shared/pennylane.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
class Refusal extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const BUCKET = "invoices";
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const euro = (n: number) => `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const frDate = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "—");
const sha256 = async (bytes: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
const clean = (s: string) => s
  .replace(/[‘’]/g, "'").replace(/[“”«»]/g, '"').replace(/…/g, "...")
  .replace(/[–—→]/g, "-").replace(/[   ]/g, " ")
  .replace(/[^\x20-\x7E¡-ÿ€]/g, "?");

async function sellerMissing(db: SupabaseClient) {
  const { data: cs } = await db.from("company_settings").select("siren, address, iban").eq("id", 1).single();
  const missing = [
    !cs?.siren && "SIREN",
    !cs?.address && "adresse du siège",
    !cs?.iban && "IBAN",
  ].filter(Boolean);
  return missing as string[];
}

async function buildPdf(inv: Record<string, any>, original: Record<string, any> | null) {
  const pdf = await PDFDocument.create();
  const isCredit = inv.kind === "credit_note";
  pdf.setTitle(`${isCredit ? "Avoir" : "Facture"} ${inv.number}`);
  pdf.setProducer("Kistone");
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.043, 0.043, 0.059);
  const grey = rgb(0.42, 0.42, 0.47);
  const pink = rgb(1, 0.18, 0.43);
  const L = 50, R = 545;
  const s = inv.seller ?? {};
  const b = inv.buyer ?? {};
  const draw = (t: string, x: number, y: number, size = 10, f = font, color = ink) =>
    page.drawText(clean(String(t)), { x, y, size, font: f, color });
  const right = (t: string, xr: number, y: number, size = 10, f = font, color = ink) =>
    draw(t, xr - f.widthOfTextAtSize(clean(String(t)), size), y, size, f, color);
  const wrap = (t: string, x: number, y: number, width: number, size = 10, f = font, color = ink) => {
    const words = clean(String(t)).split(" ");
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > width && line) { draw(line, x, y, size, f, color); y -= size + 4; line = w; }
      else line = next;
    }
    if (line) { draw(line, x, y, size, f, color); y -= size + 4; }
    return y;
  };

  // En-tête
  draw("kistone", L, 790, 18, bold);
  page.drawRectangle({ x: L, y: 784, width: 28, height: 2.5, color: pink });
  right(isCredit ? "AVOIR" : "FACTURE", R, 792, 18, bold);
  right(`N° ${inv.number}`, R, 772, 11, bold);
  right(`Date d'émission : ${frDate(inv.issue_date)}`, R, 757, 9, font, grey);
  if (!isCredit) right(`Échéance : ${frDate(inv.due_date)}`, R, 744, 9, font, grey);
  if (isCredit && original) right(`Sur la facture ${original.number} du ${frDate(original.issue_date)}`, R, 744, 9, font, grey);

  // Vendeur / client
  let y = 715;
  draw("ÉMETTEUR", L, y, 8, bold, grey);
  draw("CLIENT", 320, y, 8, bold, grey);
  y -= 15;
  let yl = y, yr = y;
  yl = wrap(String(s.legal_name ?? ""), L, yl, 240, 10, bold);
  const form = s.legal_form && !String(s.legal_name ?? "").includes(String(s.legal_form)) ? String(s.legal_form) : "";
  const capital = s.share_capital ? `${form || "Société"} au capital de ${Number(s.share_capital).toLocaleString("fr-FR")} €` : form;
  if (capital) yl = wrap(capital, L, yl, 240, 9);
  if (s.address) yl = wrap(s.address, L, yl, 240, 9);
  if (s.siren) yl = wrap(`SIREN ${s.siren}${s.rcs_city ? ` · RCS ${s.rcs_city}` : ""}`, L, yl, 240, 9);
  if (s.vat_number) yl = wrap(`TVA intracommunautaire ${s.vat_number}`, L, yl, 240, 9);
  if (s.contact_email) yl = wrap(s.contact_email, L, yl, 240, 9);
  yr = wrap(b.company_name ?? "", 320, yr, 225, 10, bold);
  if (b.address) yr = wrap(b.address, 320, yr, 225, 9);
  if (b.siren) yr = wrap(`SIREN ${b.siren}`, 320, yr, 225, 9);
  if (b.vat_number) yr = wrap(`TVA intracommunautaire ${b.vat_number}`, 320, yr, 225, 9);
  y = Math.min(yl, yr) - 14;

  const period = inv.period_month ? `${MONTHS[inv.period_month - 1]} ${inv.period_year}` : null;
  draw(`Nature : prestation de services${period ? ` · période : ${period}` : ""}`, L, y, 9, font, grey);
  y -= 22;

  // Lignes
  page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 20, color: rgb(0.95, 0.94, 0.92) });
  draw("Désignation", L + 6, y, 9, bold);
  right("Qté", 360, y, 9, bold);
  right("PU HT", 450, y, 9, bold);
  right("Total HT", R - 6, y, 9, bold);
  y -= 24;
  for (const l of inv.lines ?? []) {
    const top = y;
    const qty = `${String(l.quantity).replace(".", ",")} ${l.unit === "jour" ? "j" : ""}`.trim();
    right(qty, 360, top, 9);
    right(euro(l.unit_price_ht), 450, top, 9);
    right(euro(l.total_ht), R - 6, top, 9);
    y = wrap(l.label, L + 6, top, 250, 9) - 6;
  }
  page.drawLine({ start: { x: L, y: y + 6 }, end: { x: R, y: y + 6 }, thickness: 0.5, color: grey });
  y -= 10;
  const totals: [string, string, boolean][] = [
    ["Total HT", euro(inv.total_ht), false],
    [`TVA ${String(inv.vat_rate).replace(".", ",")} %`, euro(inv.total_vat), false],
    [isCredit ? "Total TTC à déduire" : "Total TTC", euro(inv.total_ttc), true],
  ];
  for (const [k, v, strong] of totals) {
    draw(k, 340, y, strong ? 11 : 10, strong ? bold : font);
    right(v, R - 6, y, strong ? 11 : 10, strong ? bold : font);
    y -= strong ? 20 : 16;
  }
  if (inv.notes) { y -= 6; y = wrap(inv.notes, L, y, R - L, 9, font, grey); }

  // Conditions et paiement
  y -= 16;
  if (!isCredit) {
    draw("RÈGLEMENT", L, y, 8, bold, grey);
    y -= 14;
    y = wrap(`Virement à réception, au plus tard le ${frDate(inv.due_date)}, en rappelant la référence ${inv.number}.`, L, y, R - L, 9);
    if (s.iban) y = wrap(`IBAN ${String(s.iban).replace(/(.{4})/g, "$1 ").trim()}${s.bic ? ` · BIC ${s.bic}` : ""}`, L, y, R - L, 9, bold);
    y -= 6;
    y = wrap("TVA acquittée sur les encaissements. Pas d'escompte pour paiement anticipé. En cas de retard, pénalités au taux "
      + "d'intérêt de la BCE majoré de 10 points et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 du Code de commerce).",
      L, y, R - L, 8, font, grey);
  }
  draw(`${s.legal_name ?? "Kistone"}${s.siren ? ` · SIREN ${s.siren}` : ""}`, L, 36, 8, font, grey);
  return await pdf.save();
}

async function renderAndSend(db: SupabaseClient, invoiceId: string, { email = true } = {}) {
  const { data: inv } = await db.from("client_invoices").select("*").eq("id", invoiceId).single();
  if (!inv || inv.status === "draft") throw new Refusal("Facture non émise");
  const { data: original } = inv.credit_note_of
    ? await db.from("client_invoices").select("number, issue_date").eq("id", inv.credit_note_of).single()
    : { data: null };
  const bytes = await buildPdf(inv, original);
  const path = `${inv.client_user_id}/${inv.number}.pdf`;
  const { error: upErr } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`Stockage du PDF : ${upErr.message}`);
  await db.from("client_invoices").update({ pdf_path: path, pdf_sha256: await sha256(bytes) }).eq("id", inv.id);

  let emailed = false;
  if (email && inv.buyer?.billing_email) {
    const isCredit = inv.kind === "credit_note";
    const res = await sendEmail({
      to: [inv.buyer.billing_email],
      subject: `${isCredit ? "Avoir" : "Facture"} ${inv.number} — Kistone`,
      html: layout({
        title: `${isCredit ? "Avoir" : "Facture"} ${inv.number}`,
        paragraphs: [
          isCredit
            ? `Vous trouverez ci-joint l'avoir ${esc(inv.number)} d'un montant de ${esc(euro(-inv.total_ttc))} TTC${original ? `, qui annule la facture ${esc(original.number)}` : ""}.`
            : `Vous trouverez ci-joint la facture ${esc(inv.number)} d'un montant de <strong>${esc(euro(inv.total_ttc))} TTC</strong>, à régler avant le ${esc(frDate(inv.due_date))}.`,
          "Vos factures sont aussi disponibles dans votre espace Kistone.",
        ],
        cta: { label: "Mes factures", href: `${APP_URL}/client/dashboard?tab=invoices` },
      }),
      attachments: [{ filename: `${inv.number}.pdf`, content: bytes }],
    });
    emailed = res.sent;
  }

  let pennylane: string | null = null;
  if (await pennylaneEnabled(db)) {
    try {
      const id = await pushCustomerInvoice({ ...inv, pdf_path: path }, bytes);
      await db.from("client_invoices").update({ pennylane_id: id, pennylane_synced_at: new Date().toISOString(), pennylane_error: null }).eq("id", inv.id);
      pennylane = "synchronisée";
    } catch (e) {
      await db.from("client_invoices").update({ pennylane_error: e instanceof Error ? e.message : String(e) }).eq("id", inv.id);
      pennylane = "échec";
    }
  }
  return { number: inv.number, pdf_path: path, emailed, pennylane };
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
    if (!isAdmin) throw new Refusal("Réservé à l'administration", 403);

    const body = await req.json().catch(() => ({}));
    const { action, invoice_id } = body as { action?: string; invoice_id?: string };
    if (!invoice_id) throw new Refusal("invoice_id requis");

    if (action === "issue" || action === "credit_note") {
      // En mode Pennylane, les numéros viennent de Pennylane : jamais de double numérotation.
      const { data: mode } = await db.from("company_settings").select("invoicing_mode").eq("id", 1).maybeSingle();
      if ((mode?.invoicing_mode ?? "pennylane") === "pennylane") {
        throw new Refusal("Facturation en mode Pennylane : créez la facture ou l'avoir dans Pennylane, puis enregistrez son numéro.");
      }
      const missing = await sellerMissing(db);
      if (missing.length) {
        throw new Refusal(`Identité de Kistone incomplète (${missing.join(", ")}) : complétez les paramètres avant d'émettre une facture.`);
      }
    }

    if (action === "issue") {
      const { error } = await db.rpc("issue_client_invoice", { _invoice_id: invoice_id });
      if (error) throw new Refusal(error.message);
      return json(await renderAndSend(db, invoice_id));
    }
    if (action === "credit_note") {
      const reason = String(body.reason ?? "").trim();
      const { data: creditId, error } = await db.rpc("create_credit_note", { _invoice_id: invoice_id, _reason: reason });
      if (error) throw new Refusal(error.message);
      return json({ credit_note_id: creditId, ...(await renderAndSend(db, creditId as string)) });
    }
    if (action === "render") {
      return json(await renderAndSend(db, invoice_id, { email: body.email === true }));
    }
    throw new Refusal("Action inconnue");
  } catch (e) {
    if (e instanceof Refusal) return json({ error: e.message }, e.status);
    console.error("invoices", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
