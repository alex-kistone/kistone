import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { profile } = await req.json();

    const profileContext = [
      profile.firstName && profile.lastName ? `Nom : ${profile.firstName} ${profile.lastName}` : "",
      profile.jobTitle ? `Intitulé : ${profile.jobTitle}` : "",
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

    const systemPrompt = `Tu es un expert en personal branding pour les recruteurs freelances.
Tu dois rédiger une présentation professionnelle percutante en français, à la première personne.
La présentation doit :
- Être concise (3-5 phrases max)
- Mettre en avant l'expertise et les résultats concrets
- Avoir un ton professionnel mais humain
- Mentionner les secteurs et spécialités si pertinents
- Ne PAS répéter le nom de la personne
- Ne PAS inclure de formule de politesse ou de CTA

Réponds UNIQUEMENT avec le texte de la présentation, sans guillemets ni préfixe.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici les informations du profil :\n\n${profileContext}\n\nRédige une présentation optimisée.` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const intro = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ intro }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("optimize-intro error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
