import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = ["Le modèle RPO", "Conseils", "Recruteur Freelance"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, theme, tone, objective, generateImage = true } = await req.json();
    if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Veuillez fournir au moins une idée (5 caractères min)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Rédige un article de blog complet en français à partir de ces éléments :

Idée principale : ${idea}
${theme ? `Thème / sujet : ${theme}` : ""}
${tone ? `Ton souhaité : ${tone}` : ""}
${objective ? `Objectif de l'article : ${objective}` : ""}

Contraintes :
- Article structuré (intro, 2-4 sections H2, conclusion).
- Markdown valide avec ##, ###, listes, **gras**, *italique*.
- Entre 600 et 1100 mots.
- Ton professionnel mais accessible, orienté valeur pour le lecteur (recruteurs, freelances, dirigeants).
- Pas de méta-commentaire (ne mentionne pas que c'est un article généré).
- Choisis la catégorie la plus pertinente parmi : ${CATEGORIES.join(", ")}.`;

    // 1. Génération de l'article texte via tool calling
    const textResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es un rédacteur senior spécialisé dans le recrutement, le RPO, le freelancing et les RH. Tu écris des articles de blog clairs, structurés et engageants en français. Réponds UNIQUEMENT via l'appel de fonction fourni.",
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_blog_article",
              description: "Crée un article de blog structuré.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Titre accrocheur, max 80 caractères." },
                  excerpt: { type: "string", description: "Résumé de 1-2 phrases (max 200 caractères)." },
                  content: { type: "string", description: "Contenu complet en Markdown." },
                  category: {
                    type: "string",
                    enum: CATEGORIES,
                    description: "Catégorie la plus pertinente.",
                  },
                  read_time: { type: "string", description: "Temps de lecture estimé, ex: '5 min'." },
                  image_prompt: {
                    type: "string",
                    description:
                      "Prompt en anglais pour générer une illustration éditoriale moderne, sans texte, qui illustre le sujet (style photo professionnelle ou illustration vectorielle minimaliste).",
                  },
                },
                required: ["title", "excerpt", "content", "category", "read_time", "image_prompt"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_blog_article" } },
      }),
    });

    if (!textResp.ok) {
      const errText = await textResp.text();
      throw new Error(`AI text generation failed: ${textResp.status} ${errText}`);
    }
    const textData = await textResp.json();
    const toolCall = textData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Aucune réponse structurée du modèle.");
    const article = JSON.parse(toolCall.function.arguments);

    // 2. Génération de l'illustration
    let imageUrl: string | null = null;
    if (generateImage && article.image_prompt) {
      try {
        const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: `Editorial blog illustration, modern professional style, no text, no watermark, clean composition, 16:9. Subject: ${article.image_prompt}`,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (imgResp.ok) {
          const imgData = await imgResp.json();
          const b64 = imgData.data?.[0]?.b64_json;
          if (b64) {
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const supabase = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            const path = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
            const { error: upErr } = await supabase.storage
              .from("blog-images")
              .upload(path, bytes, { contentType: "image/png" });
            if (!upErr) {
              imageUrl = supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
            } else {
              console.error("Upload error:", upErr);
            }
          }
        } else {
          console.error("Image gen error:", imgResp.status, await imgResp.text());
        }
      } catch (e) {
        console.error("Image generation failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        read_time: article.read_time,
        image_url: imageUrl,
        image_prompt: article.image_prompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
