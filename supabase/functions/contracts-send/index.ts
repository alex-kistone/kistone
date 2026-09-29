/**
 * contracts-send — envoie un contrat de mission en signature électronique (Yousign, API v3).
 *
 * Entrée : { contract_id } (ligne de public.contracts, avec un document_path dans le bucket `contracts`).
 * Réservé à l'admin (RPC has_role).
 *
 * Sans secret YOUSIGN_API_KEY, ou si company_settings.yousign_enabled est faux : 503, et l'admin
 * dépose la version signée à la main depuis la checklist de la mission.
 *
 * ⚠️ NON TESTÉ : écrit d'après la documentation publique de Yousign v3, sans compte Yousign.
 * À valider en sandbox quand Alex aura ouvert le compte, en particulier :
 *   - l'URL de base (YOUSIGN_API_URL, sandbox par défaut) ;
 *   - le format du document : Yousign attend en principe un PDF. Nos contrats sont générés en
 *     DOCX : si Yousign le refuse, il faudra convertir (ex. Gotenberg) ou générer en PDF ;
 *   - l'emplacement de la signature (page 1, bas de page, cf. SIGNATURE_FIELD) : à remplacer par
 *     des ancres dans les modèles de contrat (« smart anchors ») quand ils seront fournis ;
 *   - le signataire client : on prend le titulaire du compte client (client_profiles).
 *
 * Secrets : YOUSIGN_API_KEY (obligatoire), YOUSIGN_API_URL (optionnel).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const NOT_CONFIGURED = "Yousign n'est pas encore configuré : déposez la version signée manuellement.";
const DEFAULT_API_URL = "https://api-sandbox.yousign.app/v3";

/** Zone de signature par défaut (points PDF, origine en haut à gauche selon Yousign). Hypothèse à valider. */
const SIGNATURE_FIELD = { type: "signature", page: 1, x: 350, y: 700, width: 180, height: 60 };

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non authentifié" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    const { data: { user } } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Non authentifié" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Réservé à l'administration" }, 403);

    const { contract_id } = await req.json().catch(() => ({}));
    if (!contract_id) return json({ error: "contract_id requis" }, 400);

    // Interrupteur + clé : sans l'un des deux, mode manuel.
    const apiKey = Deno.env.get("YOUSIGN_API_KEY");
    const { data: settings } = await admin.from("company_settings").select("yousign_enabled").eq("id", 1).maybeSingle();
    if (!apiKey || !settings?.yousign_enabled) return json({ error: NOT_CONFIGURED }, 503);
    const apiUrl = (Deno.env.get("YOUSIGN_API_URL") || DEFAULT_API_URL).replace(/\/$/, "");

    const { data: contract } = await admin.from("contracts").select("*").eq("id", contract_id).maybeSingle();
    if (!contract) return json({ error: "Contrat introuvable" }, 404);
    if (!contract.document_path) return json({ error: "Générez d'abord le contrat." }, 409);
    if (contract.status === "signed") return json({ error: "Ce contrat est déjà signé." }, 409);
    if (contract.status === "sent") return json({ error: "Ce contrat est déjà en cours de signature." }, 409);

    const { data: mission } = await admin
      .from("missions")
      .select("id, title, company_name, need_id, recruiter_profile_id")
      .eq("id", contract.mission_id)
      .maybeSingle();
    if (!mission) return json({ error: "Mission introuvable" }, 404);

    // Signataire de la partie concernée
    let signer: { first_name: string; last_name: string; email: string } | null = null;
    if (contract.party === "freelance") {
      const { data: rp } = await admin
        .from("recruiter_profiles")
        .select("first_name, last_name, email")
        .eq("id", mission.recruiter_profile_id)
        .maybeSingle();
      if (rp?.email) signer = { first_name: rp.first_name ?? "", last_name: rp.last_name ?? "", email: rp.email };
    } else {
      const { data: need } = await admin.from("client_needs").select("user_id").eq("id", mission.need_id).maybeSingle();
      if (need?.user_id) {
        const { data: cp } = await admin
          .from("client_profiles")
          .select("first_name, last_name, email")
          .eq("user_id", need.user_id)
          .maybeSingle();
        if (cp?.email) signer = { first_name: cp.first_name ?? "", last_name: cp.last_name ?? "", email: cp.email };
      }
    }
    if (!signer || !signer.first_name || !signer.last_name) {
      return json({ error: "Signataire incomplet : prénom, nom et email sont requis dans le profil." }, 422);
    }

    // Document depuis le bucket privé
    const { data: file, error: dlError } = await admin.storage.from("contracts").download(contract.document_path);
    if (dlError || !file) return json({ error: `Document introuvable : ${dlError?.message ?? contract.document_path}` }, 404);
    const fileName = contract.document_path.split("/").pop() ?? "contrat";
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

    const yousign = async (path: string, init: RequestInit) => {
      const res = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${apiKey}`, ...(init.headers ?? {}) },
      });
      const text = await res.text();
      const body = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
      if (!res.ok) {
        const detail = typeof body === "object" && body ? (body.detail ?? body.message ?? JSON.stringify(body)) : body;
        throw new Error(`Yousign ${init.method ?? "GET"} ${path} (${res.status}) : ${detail}`);
      }
      return body;
    };

    // 1. Demande de signature (brouillon)
    const partyLabel = contract.party === "client" ? "client" : "freelance";
    const request = await yousign("/signature_requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Contrat ${partyLabel} — ${mission.title} (${mission.company_name})`.slice(0, 128),
        delivery_mode: "email",
        timezone: "Europe/Paris",
        external_id: contract.id, // relu par yousign-webhook
      }),
    });

    // 2. Document à signer
    const form = new FormData();
    form.append("file", new File([file], fileName, { type: MIME_BY_EXT[ext] ?? file.type }));
    form.append("nature", "signable_document");
    const doc = await yousign(`/signature_requests/${request.id}/documents`, { method: "POST", body: form });

    // 3. Signataire
    await yousign(`/signature_requests/${request.id}/signers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        info: { ...signer, locale: "fr" },
        signature_level: "electronic_signature",
        signature_authentication_mode: "otp_email",
        fields: [{ document_id: doc.id, ...SIGNATURE_FIELD }],
      }),
    });

    // 4. Activation : Yousign envoie l'email au signataire
    await yousign(`/signature_requests/${request.id}/activate`, { method: "POST" });

    const { error: updateError } = await admin
      .from("contracts")
      .update({ status: "sent", sent_at: new Date().toISOString(), yousign_request_id: request.id })
      .eq("id", contract.id);
    if (updateError) throw updateError;

    return json({ ok: true, yousign_request_id: request.id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erreur inconnue" }, 500);
  }
});
