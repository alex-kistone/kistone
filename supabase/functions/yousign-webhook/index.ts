/**
 * yousign-webhook — reçoit les événements Yousign (API v3) sur les demandes de signature.
 *
 * ⚠️ SQUELETTE NON TESTÉ : écrit d'après la documentation publique de Yousign, sans compte.
 * À valider en sandbox quand Alex aura ouvert le compte. Hypothèses :
 *   - signature HMAC-SHA256 du corps brut avec le secret du webhook, envoyée dans l'en-tête
 *     `X-Yousign-Signature-256` au format `sha256=<hex>` ;
 *   - corps : { event_name, data: { signature_request: { id, status, external_id, documents? } } } ;
 *   - téléchargement du PDF signé : GET /signature_requests/{id}/documents/download (un seul
 *     document par demande chez nous, donc un PDF et non une archive).
 *
 * Appelée par Yousign, sans jeton Supabase : à déployer avec `--no-verify-jwt`
 * (ou `[functions.yousign-webhook] verify_jwt = false` dans supabase/config.toml).
 *
 * Secrets : YOUSIGN_WEBHOOK_SECRET, YOUSIGN_API_KEY, YOUSIGN_API_URL (optionnel, sandbox par défaut).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_API_URL = "https://api-sandbox.yousign.app/v3";
const SIGNATURE_HEADER = "X-Yousign-Signature-256"; // hypothèse, cf. en-tête du fichier

const text = (body: string, status = 200) => new Response(body, { status });

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Comparaison à temps constant de deux chaînes hexadécimales. */
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

async function verifySignature(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const received = header.replace(/^sha256=/i, "").trim().toLowerCase();
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  return safeEqual(received, expected);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return text("Method not allowed", 405);

  const secret = Deno.env.get("YOUSIGN_WEBHOOK_SECRET");
  if (!secret) return text("Webhook not configured", 503);

  const rawBody = await req.text();
  if (!(await verifySignature(rawBody, req.headers.get(SIGNATURE_HEADER), secret))) {
    return text("Invalid signature", 401);
  }

  try {
    const event = JSON.parse(rawBody);
    const eventName: string = event?.event_name ?? "";
    const request = event?.data?.signature_request;
    if (!request?.id) return text("ignored");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Le contrat est retrouvé par l'id de la demande (external_id = contracts.id en secours).
    let { data: contract } = await admin.from("contracts").select("*").eq("yousign_request_id", request.id).maybeSingle();
    if (!contract && request.external_id) {
      ({ data: contract } = await admin.from("contracts").select("*").eq("id", request.external_id).maybeSingle());
    }
    if (!contract) return text("unknown signature request");

    if (eventName === "signature_request.declined") {
      await admin.from("contracts").update({ status: "declined" }).eq("id", contract.id);
      return text("ok");
    }
    if (eventName === "signature_request.expired") {
      await admin.from("contracts").update({ status: "expired" }).eq("id", contract.id);
      return text("ok");
    }
    if (eventName !== "signature_request.done") return text("ignored");
    if (contract.status === "signed") return text("already signed"); // Yousign peut rejouer l'événement

    const apiKey = Deno.env.get("YOUSIGN_API_KEY");
    if (!apiKey) return text("Yousign API key missing", 503);
    const apiUrl = (Deno.env.get("YOUSIGN_API_URL") || DEFAULT_API_URL).replace(/\/$/, "");

    const res = await fetch(`${apiUrl}/signature_requests/${request.id}/documents/download`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    // 5xx : Yousign relivre l'événement plus tard.
    if (!res.ok) return text(`download failed (${res.status})`, 502);
    const pdf = await res.arrayBuffer();

    const path = `${contract.mission_id}/${contract.party}/signe-yousign.pdf`;
    const { error: uploadError } = await admin.storage
      .from("contracts")
      .upload(path, pdf, { upsert: true, contentType: "application/pdf" });
    if (uploadError) return text(`upload failed: ${uploadError.message}`, 500);

    const { error } = await admin
      .from("contracts")
      .update({ status: "signed", signed_document_path: path, signed_at: new Date().toISOString() })
      .eq("id", contract.id);
    if (error) return text(`update failed: ${error.message}`, 500);

    return text("ok");
  } catch (err) {
    return text(err instanceof Error ? err.message : "error", 500);
  }
});
