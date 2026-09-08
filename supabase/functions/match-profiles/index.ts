/**
 * match-profiles — matching hybride besoin ⇄ freelance.
 *
 * Étage 1 (toujours) : prefilter déterministe → écarte les inéligibles et
 *   classe les profils sur des critères auditables (budget, dispo, remote,
 *   compétences, secteurs, mobilité, qualification interne).
 * Étage 2 (si ANTHROPIC_API_KEY) : Claude re-classe le top N et rédige les
 *   raisons du match. Sans clé, ou si l'appel échoue, on retombe sur l'étage 1
 *   avec les motifs factuels — le matching reste fonctionnel.
 *
 * Les profils envoyés au modèle sont anonymisés : ni nom, ni email, ni
 * téléphone, ni LinkedIn ne sortent de la base.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MARGIN_EUR, prefilter, type Need, type Recruiter } from "../_shared/matching.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Poids de l'étage IA dans le score final. Le reste vient du score de règles. */
const AI_WEIGHT = 0.6;
const MODEL = "claude-sonnet-5";
const SHORTLIST_SIZE = 12;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { need_id } = await req.json();
    if (!need_id) return json({ error: "need_id requis" }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non authentifié" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Non authentifié" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });

    // L'admin matche n'importe quel besoin ; le client seulement les siens.
    let q = admin.from("client_needs").select("*").eq("id", need_id);
    if (!isAdmin) q = q.eq("user_id", user.id);
    const { data: need } = await q.maybeSingle();
    if (!need) return json({ error: "Besoin introuvable" }, 404);

    const { data: recruiters } = await admin
      .from("recruiter_profiles")
      .select(
        "id, first_name, job_title, skills, sectors, tech_specialties, mobility, clients, languages," +
        " remote_preference, tjm, model, available, availability_date, admin_rating, super_tam," +
        " intro_text, missions, has_linkedin_license",
      )
      .eq("onboarding_completed", true);

    if (!recruiters?.length) return json({ suggestions: [], message: "Aucun profil freelance disponible." });

    // Un profil déjà en mission active reste proposable, mais pénalisé.
    const { data: activeMissions } = await admin
      .from("missions").select("recruiter_profile_id").eq("status", "active");
    const busyIds = new Set((activeMissions ?? []).map((m: { recruiter_profile_id: string }) => m.recruiter_profile_id));

    const shortlist = prefilter(need as Need, recruiters as Recruiter[], busyIds, SHORTLIST_SIZE);
    if (!shortlist.length) {
      return json({ suggestions: [], message: "Aucun profil ne satisfait les critères du besoin." });
    }

    // ── Étage 2 : Claude ──────────────────────────────────────────────────
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    let aiByProfile = new Map<string, { score: number; reasons: string[] }>();

    if (apiKey) {
      try {
        aiByProfile = await rankWithClaude(apiKey, need as Need, shortlist);
      } catch (e) {
        console.error("Étage IA indisponible, repli sur le score de règles :", e);
      }
    }

    const suggestions = shortlist.map((s, i) => {
      const ai = aiByProfile.get(s.recruiter.id);
      const score = ai ? Math.round(AI_WEIGHT * ai.score + (1 - AI_WEIGHT) * s.score) : s.score;
      return {
        need_id,
        recruiter_profile_id: s.recruiter.id,
        anonymous_label: `Profil ${String.fromCharCode(65 + i)}`,
        recruiter_first_name: s.recruiter.first_name,
        match_score: Math.max(0, Math.min(100, score)),
        match_reasons: ai?.reasons?.length ? ai.reasons : s.notes.slice(0, 3),
        rule_score: s.score,
        super_tam: s.recruiter.super_tam,
      };
    }).sort((a, b) => b.match_score - a.match_score);

    // On ne rejoue que les suggestions non traitées : celles qui ont avancé dans
    // le pipeline (shortlistée, entretien, validée) sont de l'historique métier.
    await admin.from("profile_suggestions").delete().eq("need_id", need_id).eq("pipeline_status", "suggested");

    const { data: kept } = await admin
      .from("profile_suggestions").select("recruiter_profile_id").eq("need_id", need_id);
    const keptIds = new Set((kept ?? []).map((k: { recruiter_profile_id: string }) => k.recruiter_profile_id));

    const toInsert = suggestions.filter((s) => !keptIds.has(s.recruiter_profile_id));
    if (toInsert.length) {
      const { error } = await admin.from("profile_suggestions").insert(toInsert);
      if (error) return json({ error: `Enregistrement des suggestions : ${error.message}` }, 500);
    }

    return json({
      suggestions: toInsert,
      skipped: suggestions.length - toInsert.length,
      ai_used: aiByProfile.size > 0,
    });
  } catch (err) {
    console.error("match-profiles:", err);
    return json({ error: err instanceof Error ? err.message : "Erreur inconnue" }, 500);
  }
});

/** Envoie la shortlist anonymisée à Claude et récupère score + justifications. */
async function rankWithClaude(
  apiKey: string,
  need: Need,
  shortlist: ReturnType<typeof prefilter>,
): Promise<Map<string, { score: number; reasons: string[] }>> {
  const payload = shortlist.map((s) => {
    const r = s.recruiter;
    const pastMissions = Array.isArray(r.missions) ? r.missions : [];
    return {
      profile_id: r.id,
      job_title: r.job_title,
      skills: r.skills ?? [],
      tech_specialties: r.tech_specialties ?? [],
      sectors: r.sectors ?? [],
      mobility: r.mobility ?? [],
      remote_preference: r.remote_preference,
      tjm_recruteur: r.tjm,
      prix_client: r.tjm != null ? r.tjm + MARGIN_EUR : null,
      model: r.model,
      disponible: r.available,
      date_disponibilite: r.availability_date,
      actuellement_en_mission: s.currentlyOnMission,
      note_admin: r.admin_rating ?? 0,
      super_tam: r.super_tam,
      nb_missions_passees: pastMissions.length,
      nb_clients: r.clients?.length ?? 0,
      langues: Array.isArray(r.languages)
        ? (r.languages as Array<{ language?: string; level?: string }>)
            .map((l) => `${l.language} (${l.level})`).join(", ")
        : "",
      presentation: r.intro_text?.slice(0, 300) ?? "",
      score_regles: s.score,
      signaux: s.notes,
    };
  });

  const system = `Tu es un expert du recrutement RPO chez Gotam. Tu classes des recruteurs freelances face à un besoin client.

Ces profils ont DÉJÀ passé un filtre déterministe : budget, disponibilité et compatibilité remote sont vérifiés. Le champ "score_regles" (0-100) est ce filtre, et "signaux" en donne les motifs factuels. Ton rôle est d'apporter le jugement qualitatif que le filtre ne capte pas : adéquation réelle entre l'expérience du recruteur et le poste, pertinence sectorielle, solidité du parcours.

Règles :
- "prix_client" = tarif recruteur + ${MARGIN_EUR} € de marge Gotam. C'est ce que paie le client.
- note_admin : 0 = non noté (ignore ce critère), 2 = à proposer en dernier recours, 3 = correct, 4 = à favoriser, 5 = à placer en priorité.
- super_tam = profil d'excellence, à mentionner dans les raisons.
- Un profil actuellement en mission n'est pertinent que si sa date de disponibilité colle au besoin.
- Ne t'écarte pas de plus de 25 points du score_regles sans raison explicite dans tes justifications.
- Ne mentionne JAMAIS la note admin ni le score de règles dans les raisons : elles sont lues par le client.
- Écris les raisons en français, concrètes et vérifiables. Pas de superlatif creux.`;

  const prompt = `BESOIN CLIENT
- Poste : ${need.job_title}
- Typologies : ${need.profile_types?.join(", ") || "non précisé"}
- Secteurs : ${need.sectors?.join(", ") || "non précisé"}
- Lieu : ${need.mission_location} — remote : ${need.remote_policy}
- Budget client : ${need.budget_tjm_min ?? "?"} à ${need.budget_tjm_max ?? "?"} €/jour (marge incluse)
- Description : ${need.description || "aucune"}

PROFILS PRÉ-QUALIFIÉS
${JSON.stringify(payload, null, 2)}

Classe-les et retourne les 3 à 6 meilleurs via l'outil.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: prompt }],
      tools: [{
        name: "classer_profils",
        description: "Retourne les meilleurs profils classés pour ce besoin.",
        input_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  profile_id: { type: "string" },
                  score: { type: "integer", description: "Score de match 0-100" },
                  reasons: {
                    type: "array", items: { type: "string" },
                    description: "2 à 3 raisons concrètes, lisibles par le client",
                  },
                },
                required: ["profile_id", "score", "reasons"],
              },
            },
          },
          required: ["matches"],
        },
      }],
      tool_choice: { type: "tool", name: "classer_profils" },
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const block = data.content?.find((c: { type: string }) => c.type === "tool_use");
  if (!block) throw new Error("Pas de tool_use dans la réponse");

  const out = new Map<string, { score: number; reasons: string[] }>();
  for (const m of block.input.matches ?? []) {
    out.set(m.profile_id, { score: m.score, reasons: m.reasons ?? [] });
  }
  return out;
}
