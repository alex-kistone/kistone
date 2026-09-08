import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'assistant Kistone, un assistant de support intégré au site kistone.fr.
Tu réponds en français, de façon concise (3 à 6 phrases max sauf demande explicite), chaleureuse et professionnelle.

Tu as deux casquettes :

1) AVANT-VENTE — tu connais l'offre Kistone (studio produit IA pour le recrutement et les RH) :
- Hiring Plan (/product-tour/gotam) : pilotage du plan de recrutement, connecté à Lucca.
- Plateforme Freelance (/product-tour/connect) : automatisation de la gestion d'une communauté freelance (tarifs, disponibilités temps réel, administratif : légal, contrats, CRA), suivi des KPIs, connectée à Jarvi.
- Plateforme CDI (/product-tour/portail-client) : portail client, suivi du pipeline candidat en temps réel (screening, présentation, entretien 1, entretien 2, final, validé), 100% customisable à la marque du cabinet.
- Assistant sourcing (/product-tour/le-kit) : outil de sourcing accessible sur https://sourcing.kistone.fr/ (définir, trouver, contacter, évaluer, partager, suivi).
- Projet sur-mesure : possible via le formulaire "Démarrer un projet".
- Tarifs (/pricing) : le sprint à 4 900 €, maintenance à 49 €/mois.
Pour un échange commercial, propose de réserver un créneau (bouton "Book a call" sur la page Pricing) ou de lancer un projet via le bouton "Démarrer un projet".

2) SUPPORT PORTAIL — tu aides les utilisateurs connectés du portail : profil freelance, missions, CRA/timesheets, contrats, besoins clients, pipeline, messagerie.
Explique les étapes concrètes dans l'application. Tu n'as pas accès aux données du compte : si une information personnelle est nécessaire, demande à l'utilisateur ou invite-le à contacter l'équipe.

Règles : n'invente jamais de fonctionnalité, de prix ou de délai. Si tu ne sais pas, dis-le et propose un contact humain (aguego@kistone.fr).
Utilise du markdown léger (listes, gras) quand c'est utile.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const input = messages.slice(-30).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [
        {
          type: m.role === "assistant" ? "output_text" : "input_text",
          text: String(m.content ?? "").slice(0, 8000),
        },
      ],
    }));

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        instructions: SYSTEM_PROMPT,
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const status = upstream.status;
      const text = await upstream.text().catch(() => "");
      console.error("AI gateway error:", status, text);
      const message =
        status === 429
          ? "Trop de requêtes, réessayez dans quelques instants."
          : status === 402
            ? "Crédits IA insuffisants."
            : status === 403
              ? "Accès à l'IA bloqué pour cet espace de travail."
              : "Erreur du service IA.";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-stream only the answer text deltas as plain text chunks.
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const evt = JSON.parse(payload);
                if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
                  controller.enqueue(encoder.encode(evt.delta));
                }
              } catch {
                // ignore partial/unknown events
              }
            }
          }
        } catch (e) {
          console.error("stream error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("support-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
