import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return missingKeyResponse(corsHeaders);

    const { profile } = await req.json();

    const profileContext = [
      profile.firstName && profile.lastName ? `Nom : ${profile.firstName} ${profile.lastName}` : "",
      profile.jobTitle ? `Métier : ${profile.jobTitle}` : "",
      profile.skills?.length ? `Compétences : ${profile.skills.join(", ")}` : "",
      profile.sectors?.length ? `Secteurs : ${profile.sectors.join(", ")}` : "",
      profile.clients?.length ? `Clients : ${profile.clients.join(", ")}` : "",
      profile.models?.length ? `Modèle(s) : ${profile.models.join(", ")}` : "",
      profile.tjm ? `TJM : ${profile.tjm}€/jour` : "",
      profile.mobility?.length ? `Mobilité : ${profile.mobility.join(", ")}` : "",
      profile.languages?.length ? `Langues : ${profile.languages.map((l: any) => `${l.language} (${l.level})`).join(", ")}` : "",
      profile.missions?.length ? `Missions réalisées :\n${profile.missions.map((m: any) =>
        `- ${m.client_name || "Client"} : ${m.profile_types || ""}, ${m.kpis ? m.kpis + " recrutements" : ""}, ${m.duration || ""}${m.tools?.length ? ", outils : " + m.tools.join(", ") : ""}`
      ).join("\n")}` : "",
      profile.hasLinkedinLicense ? "Possède une licence LinkedIn Recruiter" : "",
      profile.currentIntro ? `Présentation actuelle : "${profile.currentIntro}"` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `Tu es un expert en personal branding pour les managers de transition (dirigeants et cadres supérieurs indépendants : direction générale, finance, RH, opérations, commerce, marketing, juridique, RSE, DSI, recrutement).
À partir du texte libre du manager (souvent écrit en vrac) et de son métier, tu rédiges sa présentation professionnelle en français, à la première personne.
La présentation doit :
- Être concise (4 à 6 phrases)
- Mettre en avant les postes de direction occupés, les situations traversées (crise, transformation, croissance, retournement…) et les résultats concrets
- Reprendre fidèlement les faits donnés : ne JAMAIS inventer d'entreprise, de chiffre, de diplôme ni de résultat
- Avoir un ton sobre, professionnel et humain
- Ne PAS répéter le nom de la personne
- Ne PAS mentionner le TJM
- Ne PAS inclure de formule de politesse ou de CTA

Réponds UNIQUEMENT avec le texte de la présentation, sans guillemets ni préfixe.`;

    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Voici les informations du profil :\n\n${profileContext}\n\nRédige une présentation optimisée.` },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Anthropic error:", response.status, detail);
      return upstreamErrorResponse(response.status, corsHeaders, detail);
    }

    const data = await response.json();
    const intro = (data.content ?? [])
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { text: string }) => c.text)
      .join("")
      .trim();

    return new Response(JSON.stringify({ intro }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("optimize-intro error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
