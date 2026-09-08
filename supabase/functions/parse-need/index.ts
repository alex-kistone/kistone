import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROFILE_TYPES = [
  "Tech", "Data", "Product", "Sales", "Life Science",
  "Industrie", "Energies", "Digital & Marketing",
  "Fonctions support", "Finance", "Banque/Assurance", "Autre",
];

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant RH expert. À partir d'une description libre d'un besoin en recrutement, extrais les informations structurées suivantes. Réponds UNIQUEMENT via l'appel de fonction fourni.

Les typologies de profils possibles sont : ${PROFILE_TYPES.join(", ")}.
Les politiques de remote possibles sont : on-site, hybrid, full-remote, flexible.

Si une information n'est pas mentionnée, retourne null ou un tableau vide pour les arrays.`,
          },
          { role: "user", content: freeText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_need",
              description: "Extraire les informations structurées d'un besoin en recrutement",
              parameters: {
                type: "object",
                properties: {
                  job_title: {
                    type: "string",
                    description: "Intitulé du poste recherché",
                  },
                  profile_types: {
                    type: "array",
                    items: { type: "string" },
                    description: `Typologies de profils parmi: ${PROFILE_TYPES.join(", ")}`,
                  },
                  budget_tjm_min: {
                    type: "number",
                    description: "Budget TJM minimum en euros/jour",
                    nullable: true,
                  },
                  budget_tjm_max: {
                    type: "number",
                    description: "Budget TJM maximum en euros/jour",
                    nullable: true,
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
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_need" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

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
