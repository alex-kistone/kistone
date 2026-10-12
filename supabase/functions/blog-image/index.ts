/**
 * blog-image — couverture d'article (admin uniquement) : photo éditoriale réaliste générée par
 * Gemini (Google) ou OpenAI, sur laquelle on pose le vrai logo Kistone et la tagline (jamais
 * dessinés par l'IA). Le résultat est déposé dans le stockage public « blog-images ».
 *
 * Corps : { prompt } — description de la scène (proposée par blog-generate, modifiable).
 * Réponse : { url }
 *
 * Secrets : GEMINI_API_KEY (prioritaire ; modèle GEMINI_IMAGE_MODEL, gemini-2.5-flash-image par
 * défaut) ou OPENAI_API_KEY (gpt-image-1). Sans clé, 503 avec la marche à suivre.
 * Test du montage sans OpenAI : { prompt, test_photo_url } (photo JPEG ou PNG existante).
 */
import { decode, Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";
import { BRAND_BLOCK_PNG_BASE64 } from "../_shared/blogCoverBrand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Direction artistique : photo éditoriale réaliste, dans la lignée des portraits du site
const STYLE = "Realistic editorial photograph for a business magazine. Natural soft window light, warm beige, cream and sand tones with muted pastel accents, shallow depth of field, modern European workspace, candid senior professionals, 35mm lens, high-end and calm. Keep the lower-left third of the frame simple and uncluttered (a logo will be placed there). No text, no letters, no numbers, no logos, no readable screens, no watermark.";

const W = 1536;
const H = 1024;

/** Pose un dégradé sombre en bas, puis le logo et la tagline en bas à gauche. */
async function brandCover(photoBytes: Uint8Array): Promise<Uint8Array> {
  let photo = (await decode(photoBytes)) as Image;
  if (photo.width !== W || photo.height !== H) photo = photo.cover(W, H);

  // Dégradé : de transparent à 74 % d'encre sur le bas de l'image, pour la lisibilité du logo
  const gh = Math.round(H * 0.45);
  const scrim = new Image(W, gh);
  scrim.fill((_x: number, y: number) => {
    const t = (y - 1) / gh;
    return Image.rgbaToColor(20, 19, 18, Math.round(255 * 0.74 * t * t));
  });
  photo.composite(scrim, 0, H - gh);

  const brand = (await decode(Uint8Array.from(atob(BRAND_BLOCK_PNG_BASE64), (c) => c.charCodeAt(0)))) as Image;
  brand.resize(Math.round(W * 0.42), Image.RESIZE_AUTO);
  const margin = Math.round(W * 0.045);
  photo.composite(brand, margin, H - margin - brand.height);

  return await photo.encodeJPEG(86);
}

/** Photo générée par Gemini (format 3:2, recadrée ensuite en 1536 × 1024). */
async function geminiPhoto(key: string, prompt: string): Promise<Uint8Array> {
  const model = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}\n\n${STYLE}` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "3:2" } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status} : ${(await res.text()).slice(0, 300)}`);
  const parts = (await res.json())?.candidates?.[0]?.content?.parts ?? [];
  const data = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data)?.inlineData?.data;
  if (!data) throw new Error("Gemini n'a pas renvoyé d'image (description refusée ou trop vague), reformulez.");
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
}

async function openAiPhoto(key: string, prompt: string): Promise<Uint8Array> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt: `${prompt}\n\n${STYLE}`, size: `${W}x${H}`, quality: "medium", output_format: "jpeg", n: 1 }),
  });
  if (!res.ok) throw new Error(`Génération d'image ${res.status} : ${(await res.text()).slice(0, 300)}`);
  const b64 = (await res.json())?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Aucune image renvoyée.");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Réservé aux administrateurs." }, 403);

  const { prompt, test_photo_url } = await req.json().catch(() => ({}));
  if (!prompt || String(prompt).trim().length < 5) return json({ error: "Description de l'image manquante." }, 400);

  const gemini = Deno.env.get("GEMINI_API_KEY");
  const openai = Deno.env.get("OPENAI_API_KEY");
  if (!gemini && !openai && !test_photo_url) {
    return json({
      error: "Photos non configurées : ajoutez la clé GEMINI_API_KEY dans Supabase (Project Settings › Edge Functions › Secrets). En attendant, téléversez une image.",
    }, 503);
  }

  try {
    const photo = test_photo_url
      ? new Uint8Array(await (await fetch(String(test_photo_url))).arrayBuffer())
      : gemini
      ? await geminiPhoto(gemini, String(prompt).trim())
      : await openAiPhoto(openai!, String(prompt).trim());
    const cover = await brandCover(photo);
    const path = `covers/${crypto.randomUUID()}.jpg`;
    const { error } = await admin.db.storage.from("blog-images").upload(path, cover, { contentType: "image/jpeg" });
    if (error) return json({ error: `Stockage : ${error.message}` }, 500);
    return json({ url: admin.db.storage.from("blog-images").getPublicUrl(path).data.publicUrl });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
