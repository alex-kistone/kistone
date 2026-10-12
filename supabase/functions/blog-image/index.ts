/**
 * blog-image — génère l'illustration de couverture d'un article (admin uniquement) et la
 * dépose dans le stockage public « blog-images ».
 *
 * Corps : { prompt } — description en anglais (proposée par blog-generate, modifiable).
 * Réponse : { url }
 *
 * Avec OPENAI_API_KEY : image gpt-image-1 (webp). Sans cette clé : illustration vectorielle (SVG)
 * dessinée par Claude (ANTHROPIC_API_KEY) dans la palette Kistone.
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

const SVG_SYSTEM = `Tu es illustrateur éditorial. Tu dessines en SVG des illustrations de couverture pour le blog de Kistone (plateforme de dirigeants et recruteurs freelance).

Contraintes :
- Un seul élément <svg> avec xmlns="http://www.w3.org/2000/svg" et viewBox="0 0 1536 1024", sans width ni height.
- Fond plein #F4EFE8. Palette : #DCEEDF (sauge), #FBE6D4 (abricot), #E8E2F6 (lilas), #DDE8F5 (bleu pâle), #F5ECCB (sable), encre #141312, et une seule touche de rose vif #FF2E6E.
- Style : formes plates et géométriques, compositions éditoriales modernes (personnages stylisés sans visage détaillé, objets symboliques, graphiques, cartes de profil abstraites), beaucoup d'espace, quelques traits fins à l'encre.
- Tu peux glisser, en grand et discret, l'éclair Kistone au trait : <path d="M38 560 L488 18 L318 398 M22 588 L346 416 L602 416 L280 588 Z M300 606 L132 1006 L590 444" fill="none" stroke-width="24"/> (mis à l'échelle et tourné avec transform).
- Aucun texte, aucune lettre, aucun chiffre, aucun logo d'entreprise. Pas de <script>, pas d'image externe, pas de police, pas de filtre lourd.
- 30 à 70 éléments au total, code compact (pas de commentaires, coordonnées entières).`;

/** Illustration SVG dessinée par Claude, quand aucune clé de génération d'image n'est configurée. */
async function claudeSvg(prompt: string): Promise<string> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("Aucune clé de génération configurée (OPENAI_API_KEY ou ANTHROPIC_API_KEY).");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-5-5",
      max_tokens: 8000,
      system: SVG_SYSTEM,
      messages: [{ role: "user", content: `Dessine l'illustration de couverture suivante et réponds uniquement avec le code SVG, sans commentaire ni bloc de code :\n\n${prompt}` }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status} : ${(await res.text()).slice(0, 200)}`);
  const text: string = (await res.json()).content?.filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("") ?? "";
  const svg = text.match(/<svg[\s\S]*<\/svg>/i)?.[0];
  if (!svg) throw new Error("Illustration incomplète, réessayez.");
  // Rien d'exécutable ni d'externe dans un fichier servi publiquement
  if (/<script|<foreignObject|\son[a-z]+\s*=|javascript:|<image|href\s*=\s*["']https?:/i.test(svg)) throw new Error("Illustration refusée (contenu non autorisé), réessayez.");
  return svg;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Réservé aux administrateurs." }, 403);

  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt || String(prompt).trim().length < 5) return json({ error: "Description de l'image manquante." }, 400);

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) {
    try {
      const svg = await claudeSvg(String(prompt).trim());
      const path = `covers/${crypto.randomUUID()}.svg`;
      const { error } = await admin.db.storage.from("blog-images").upload(path, new TextEncoder().encode(svg), { contentType: "image/svg+xml" });
      if (error) return json({ error: `Stockage : ${error.message}` }, 500);
      return json({ url: admin.db.storage.from("blog-images").getPublicUrl(path).data.publicUrl, kind: "svg" });
    } catch (e) {
      return json({ error: (e as Error).message }, 502);
    }
  }

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
