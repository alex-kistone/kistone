/**
 * blog-image — génère l'illustration de couverture d'un article (admin uniquement) et la
 * dépose dans le stockage public « blog-images ».
 *
 * Corps : { prompt } — description en anglais (proposée par blog-generate, modifiable).
 * Réponse : { url }
 *
 * Secret : OPENAI_API_KEY (modèle gpt-image-1). Sans clé, 503.
 */
import { requireAdmin } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Direction artistique Kistone : fonds beige chaud, pastels doux, touche de rose, pas de texte
const STYLE = "Editorial illustration for a B2B blog, warm off-white and beige background (#F4EFE8), soft pastel accents (sage green, apricot, lilac, pale blue) with a single touch of vivid pink (#FF2E6E), clean modern flat shapes with subtle grain, calm and professional, generous negative space, no text, no letters, no logos, no watermark.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return json({ error: "Génération d'image non configurée (OPENAI_API_KEY absente). Téléversez une image à la place." }, 503);
  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Réservé aux administrateurs." }, 403);

  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt || String(prompt).trim().length < 5) return json({ error: "Description de l'image manquante." }, 400);

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt: `${String(prompt).trim()}\n\n${STYLE}`, size: "1536x1024", quality: "medium", output_format: "webp", n: 1 }),
  });
  if (!res.ok) return json({ error: `Génération d'image ${res.status} : ${(await res.text()).slice(0, 300)}` }, 502);
  const b64 = (await res.json())?.data?.[0]?.b64_json;
  if (!b64) return json({ error: "Aucune image renvoyée." }, 502);

  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const path = `covers/${crypto.randomUUID()}.webp`;
  const { error } = await admin.db.storage.from("blog-images").upload(path, bytes, { contentType: "image/webp" });
  if (error) return json({ error: `Stockage : ${error.message}` }, 500);
  return json({ url: admin.db.storage.from("blog-images").getPublicUrl(path).data.publicUrl });
});
