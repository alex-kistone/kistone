/**
 * linkedin-publish — publie une carte de besoin (image + texte) sur le profil LinkedIn de
 * l'admin connecté (voir linkedin-auth). Admin uniquement.
 *
 * Corps : { image: "data:image/png;base64,…", text, altText? }
 * Réponse : { url } (lien vers le post publié)
 *
 * API LinkedIn « Posts » + « Images » (versionnées) ; version réglable par le secret
 * LINKEDIN_API_VERSION (AAAAMM), 202607 par défaut.
 */
import { requireAdmin } from "../_shared/adminAuth.ts";
import { toLittleText } from "../_shared/linkedinText.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Réservé aux administrateurs." }, 403);

  const { image, text, altText } = await req.json().catch(() => ({}));
  if (typeof image !== "string" || !image.startsWith("data:image/png;base64,") || typeof text !== "string" || !text.trim()) {
    return json({ error: "Image ou texte manquant." }, 400);
  }

  const { data: conn } = await admin.db.from("linkedin_connections").select("access_token, expires_at, member_urn").eq("user_id", admin.userId).maybeSingle();
  if (!conn?.access_token || !conn.member_urn || !conn.expires_at || new Date(conn.expires_at) < new Date()) {
    return json({ error: "Connexion LinkedIn absente ou expirée : reconnectez LinkedIn.", reconnect: true }, 401);
  }

  const version = Deno.env.get("LINKEDIN_API_VERSION") || "202607";
  const headers = {
    Authorization: `Bearer ${conn.access_token}`,
    "LinkedIn-Version": version,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };

  try {
    // 1. Réserver l'envoi de l'image
    const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
      method: "POST",
      headers,
      body: JSON.stringify({ initializeUploadRequest: { owner: conn.member_urn } }),
    });
    const initBody = await init.json().catch(() => ({}));
    if (init.status === 401) return json({ error: "LinkedIn a refusé la connexion : reconnectez LinkedIn.", reconnect: true }, 401);
    if (!init.ok) throw new Error(`Image ${init.status} : ${JSON.stringify(initBody).slice(0, 300)}`);
    const { uploadUrl, image: imageUrn } = initBody.value ?? {};

    // 2. Envoyer l'image
    const bytes = Uint8Array.from(atob(image.split(",")[1]), (c) => c.charCodeAt(0));
    const up = await fetch(uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${conn.access_token}` }, body: bytes });
    if (!up.ok) throw new Error(`Envoi de l'image ${up.status} : ${(await up.text()).slice(0, 200)}`);

    // 3. Publier le post avec l'image
    const post = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers,
      body: JSON.stringify({
        author: conn.member_urn,
        commentary: toLittleText(text.trim()),
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        content: { media: { id: imageUrn, altText: String(altText ?? "Mission freelance Kistone").slice(0, 300) } },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!post.ok) throw new Error(`Publication ${post.status} : ${(await post.text()).slice(0, 300)}`);
    const postUrn = post.headers.get("x-restli-id") ?? "";
    return json({ url: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}/` : "https://www.linkedin.com/feed/" });
  } catch (e) {
    console.error("linkedin-publish", (e as Error).message);
    return json({ error: (e as Error).message }, 502);
  }
});
