/**
 * Appels directs à l'API Anthropic (Messages API), partagés par les fonctions IA.
 * Clé : secret ANTHROPIC_API_KEY.
 */

export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_MODEL = "claude-sonnet-5";

export function anthropicHeaders(apiKey: string): Record<string, string> {
  return {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
}

/** Réponse 503 quand la clé n'est pas configurée. */
export function missingKeyResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: "Le service IA n'est pas configuré (clé ANTHROPIC_API_KEY manquante). Contactez l'administrateur.",
    }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/** Traduit une erreur HTTP Anthropic en réponse JSON lisible côté front. */
export function upstreamErrorResponse(status: number, corsHeaders: Record<string, string>): Response {
  let outStatus = 502;
  let message = "Erreur du service IA.";
  if (status === 429) {
    outStatus = 429;
    message = "Trop de requêtes, réessayez dans quelques instants.";
  } else if (status === 529 || status === 503) {
    outStatus = 503;
    message = "Le service IA est surchargé, réessayez dans quelques instants.";
  } else if (status === 401 || status === 403) {
    outStatus = 503;
    message = "Le service IA est mal configuré (clé invalide). Contactez l'administrateur.";
  }
  return new Response(JSON.stringify({ error: message }), {
    status: outStatus,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
