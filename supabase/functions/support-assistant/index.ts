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

const SYSTEM_PROMPT = `Tu es l'assistant Kistone, un assistant de support intégré au site kistone.fr.
Tu réponds en français, de façon concise (3 à 6 phrases max sauf demande explicite), chaleureuse et professionnelle.

Tu as deux casquettes :

1) AVANT-VENTE — tu connais l'offre Kistone, le réseau freelance d'experts IA (jamais une place de marché ouverte : chaque profil est sélectionné et qualifié) :
- Trois familles d'experts IA : AI Engineer, AI Product et AI Leader, sélectionnés et qualifiés.
- Des Tech Recruiters (RPO) pour internaliser ses talents Tech, Data/AI, Product et GTM.
- Trois modèles : mission freelance, fractional (quelques jours par semaine) et contract-to-hire.
- Un référent IA cadre le besoin en 30 minutes ; premier profil sous 48 h ; contrat, KYC, CRA et facturation gérés par Kistone.
- Pour partager un besoin : la page /besoin. Pour les freelances qui veulent rejoindre la communauté : /freelances.
Pour un échange commercial, propose de réserver un appel de 30 minutes avec Alexandre (lien « Réserver un appel » en haut du site).

2) SUPPORT PORTAIL — tu aides les utilisateurs connectés du portail : profil freelance, missions, CRA/timesheets, contrats, besoins clients, pipeline, messagerie.
Explique les étapes concrètes dans l'application. Tu n'as pas accès aux données du compte : si une information personnelle est nécessaire, demande à l'utilisateur ou invite-le à contacter l'équipe.

Règles : n'invente jamais de fonctionnalité, de prix ou de délai. Si tu ne sais pas, dis-le et propose un contact humain (aguego@kistone.fr).
Utilise du markdown léger (listes, gras) quand c'est utile.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return missingKeyResponse(corsHeaders);

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // L'API Messages exige une alternance user/assistant commençant par user :
    // on normalise les rôles ("human" = réponse de l'équipe → assistant),
    // on retire les messages vides et on fusionne les tours consécutifs.
    const input: { role: "user" | "assistant"; content: string }[] = [];
    for (const m of messages.slice(-30) as { role: string; content: string }[]) {
      const role: "user" | "assistant" = m.role === "user" ? "user" : "assistant";
      const text = String(m.content ?? "").slice(0, 8000).trim();
      if (!text) continue;
      if (input.length === 0 && role === "assistant") continue;
      const last = input[input.length - 1];
      if (last && last.role === role) last.content += `\n\n${text}`;
      else input.push({ role, content: text });
    }
    if (input.length === 0 || input[input.length - 1].role !== "user") {
      return new Response(JSON.stringify({ error: "Le dernier message doit venir de l'utilisateur." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: input,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("Anthropic error:", upstream.status, text);
      return upstreamErrorResponse(upstream.status, corsHeaders);
    }

    // Re-stream uniquement les deltas de texte, en texte brut.
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
              if (!payload) continue;
              try {
                const evt = JSON.parse(payload);
                if (
                  evt.type === "content_block_delta" &&
                  evt.delta?.type === "text_delta" &&
                  typeof evt.delta.text === "string"
                ) {
                  controller.enqueue(encoder.encode(evt.delta.text));
                } else if (evt.type === "error") {
                  console.error("Anthropic stream error:", evt.error);
                }
              } catch {
                // événement partiel ou inconnu : ignoré
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
