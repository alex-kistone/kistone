/**
 * parse-profile — pré-remplissage facultatif du profil freelance à partir d'un CV ou de l'export
 * PDF d'un profil LinkedIn. Le PDF est lu par Claude en mémoire, jamais stocké ; la réponse ne
 * contient que des propositions que le freelance relit avant d'enregistrer son profil.
 *
 * Corps : { pdf_base64, vertical } — réservé à un utilisateur connecté.
 * Réponse : { job_title?, intro_text?, clients[], missions[], languages[], metiers[], specialties[] }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { METIERS } from "../_shared/taxonomy.ts";
import { verticalOf } from "../_shared/verticals.ts";
import { LANGUAGES, LANGUAGE_LEVELS } from "../_shared/jarvi.ts";
import { ANTHROPIC_MODEL, ANTHROPIC_URL, anthropicHeaders, missingKeyResponse, upstreamErrorResponse } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// 8 Mo de PDF environ, une fois encodé en base64
const MAX_BASE64 = 11_000_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Réservé aux utilisateurs connectés : évite qu'un tiers consomme l'API à nos frais
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = token ? await anon.auth.getUser(token) : { data: { user: null } };
    if (!user) return json({ error: "Connectez-vous pour importer votre CV." }, 401);

    const { pdf_base64, vertical: verticalId } = await req.json().catch(() => ({}));
    if (typeof pdf_base64 !== "string" || pdf_base64.length < 100) return json({ error: "Fichier PDF manquant." }, 400);
    if (pdf_base64.length > MAX_BASE64) return json({ error: "Fichier trop lourd (8 Mo maximum)." }, 413);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return missingKeyResponse(corsHeaders);

    const v = verticalOf(verticalId);
    const isRpo = v.id === "rpo";
    const metiers = METIERS.filter((m) => m !== "Autres");

    const system = `Tu aides un freelance à remplir son profil sur Kistone, le réseau freelance d'experts IA. Le document joint est son CV ou l'export PDF de son profil LinkedIn. Sa famille : ${isRpo ? "Tech Recruiter (RPO) : il recrute des talents tech, data et IA en CDI pour ses clients" : `${v.short} (${v.roles})`}.

Extrais uniquement ce qui figure dans le document, en français. N'invente rien : si une information manque, omets-la ou laisse le tableau vide. Réponds UNIQUEMENT en appelant l'outil extract_profile.

- job_title : intitulé actuel ou principal, court (ex. « ${isRpo ? "Tech Recruiter IA & data" : `${v.short} senior`} »).
- intro_text : présentation de 3 à 5 phrases à la première personne, factuelle (expérience, spécialités, types de projets), sans superlatifs.
- clients : entreprises clientes ou employeurs marquants cités, 8 au maximum, noms seuls.
- missions : les expériences les plus récentes et pertinentes, 6 au maximum. client_name = entreprise ; ${isRpo ? "profile_types = types de profils recrutés ; kpis = nombre de recrutements réalisés, en chiffres, seulement s'il est écrit" : "profile_types = rôle et périmètre en une ligne ; kpis = résultat clé, seulement s'il est écrit"} ; duration = durée (« 6 mois », « 2 ans ») déduite des dates ; tools = outils et technologies cités pour cette expérience (6 au maximum).
- languages : langues parmi ${LANGUAGES.join(", ")}, avec un niveau parmi ${LANGUAGE_LEVELS.join(", ")} seulement s'il est indiqué ou évident (langue maternelle = natif).
${isRpo ? `- metiers : 3 au maximum parmi ${metiers.join(", ")}, selon les profils qu'il a recrutés.` : `- specialties : 5 au maximum parmi : ${v.specialties.join(" ; ")}.`}`;

    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 8000,
        system,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf_base64 } },
            { type: "text", text: "Voici mon CV ou mon profil LinkedIn : pré-remplis mon profil." },
          ],
        }],
        tools: [{
          name: "extract_profile",
          description: "Informations du profil freelance extraites du document.",
          input_schema: {
            type: "object",
            properties: {
              job_title: { type: "string" },
              intro_text: { type: "string" },
              clients: { type: "array", items: { type: "string" } },
              missions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    client_name: { type: "string" },
                    profile_types: { type: "string" },
                    kpis: { type: "string" },
                    duration: { type: "string" },
                    tools: { type: "array", items: { type: "string" } },
                  },
                  required: ["client_name"],
                },
              },
              languages: {
                type: "array",
                items: {
                  type: "object",
                  properties: { language: { type: "string", enum: LANGUAGES }, level: { type: "string", enum: [...LANGUAGE_LEVELS] } },
                  required: ["language"],
                },
              },
              metiers: { type: "array", items: { type: "string", enum: metiers } },
              specialties: { type: "array", items: { type: "string", enum: [...v.specialties] } },
            },
            required: ["clients", "missions", "languages"],
          },
        }],
        // Ce modèle refuse l'appel d'outil forcé : on laisse « auto » et la consigne nomme l'outil.
        tool_choice: { type: "auto" },
        output_config: { effort: "low" },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Anthropic error:", response.status, detail);
      return upstreamErrorResponse(response.status, corsHeaders, detail);
    }
    const data = await response.json();
    const block = data.content?.find((c: { type: string }) => c.type === "tool_use");
    if (!block) return json({ error: "Le document n'a pas pu être lu. Vérifiez qu'il s'agit bien d'un CV ou d'un profil LinkedIn en PDF." }, 422);
    return json(block.input);
  } catch (e) {
    console.error("parse-profile error:", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
