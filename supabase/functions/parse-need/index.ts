import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { METIERS, SECTEURS } from "../_shared/taxonomy.ts";
import {
  ANTHROPIC_MODEL,
  ANTHROPIC_URL,
  anthropicHeaders,
  missingKeyResponse,
  upstreamErrorResponse,
} from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Référentiel partagé avec le site et le matching
const PROFILE_TYPES = METIERS;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { freeText } = await req.json();
    if (!freeText || typeof freeText !== "string" || freeText.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Veuillez décrire votre besoin en au moins 10 caractères." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return missingKeyResponse(corsHeaders);

    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 16000,
        system: `Tu es un assistant RH expert. À partir d'une description libre d'un besoin en recrutement, extrais les informations structurées suivantes. Réponds UNIQUEMENT en appelant l'outil extract_need.

Les typologies de profils possibles sont : ${PROFILE_TYPES.join(", ")}.
Les secteurs / environnements possibles sont : ${SECTEURS.join(", ")}.
Les politiques de remote possibles sont : on-site, hybrid, full-remote, flexible.
Le budget est un TJM client en euros HT par jour. N'invente pas de fourchette : si un seul montant est donné (« autour de 600 € »), renseigne uniquement budget_tjm_max ; si une fourchette est donnée, le minimum doit être strictement inférieur au maximum.

Si une information n'est pas mentionnée, omets-la (ou retourne un tableau vide pour les arrays).`,
        messages: [{ role: "user", content: freeText }],
        tools: [
          {
            name: "extract_need",
            description: "Extraire les informations structurées d'un besoin en recrutement",
            input_schema: {
              type: "object",
              properties: {
                job_title: {
                  type: "string",
                  description: "Intitulé court au format « RPO <métier> », ex : RPO Tech, RPO Data, RPO Finance",
                },
                profile_types: {
                  type: "array",
                  items: { type: "string", enum: [...PROFILE_TYPES] },
                  description: "Métiers des profils à recruter",
                },
                sectors: {
                  type: "array",
                  items: { type: "string", enum: [...SECTEURS] },
                  description: "Secteur ou environnement de l'entreprise",
                },
                budget_tjm_min: {
                  type: "number",
                  description: "Budget TJM minimum en euros/jour",
                },
                budget_tjm_max: {
                  type: "number",
                  description: "Budget TJM maximum en euros/jour",
                },
                mission_location: {
                  type: "string",
                  description: "Lieu de la mission (ville)",
                },
                remote_policy: {
                  type: "string",
                  enum: ["on-site", "hybrid", "full-remote", "flexible"],
                  description: "Politique de remote",
                },
                description: {
                  type: "string",
                  description: "Description complète et reformulée du besoin",
                },
              },
              required: ["job_title", "description"],
            },
          },
        ],
        // Ce modèle refuse l'appel d'outil forcé : on laisse « auto » et la consigne nomme l'outil.
      tool_choice: { type: "auto" },
      output_config: { effort: "low" },
      }),
    });

    if (!response.ok) {
      console.error("Anthropic error:", response.status, await response.text());
      return upstreamErrorResponse(response.status, corsHeaders);
    }

    const data = await response.json();
    const block = data.content?.find((c: { type: string }) => c.type === "tool_use");
    if (!block) throw new Error("Réponse IA inattendue (pas d'extraction).");

    const parsed = block.input;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-need error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
