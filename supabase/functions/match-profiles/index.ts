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
import { prefilter, type Need, type Recruiter } from "../_shared/matching.ts";
import { MARGIN_PCT, clientPrice } from "../_shared/pricing.ts";
import { rhythmLabel, verticalOf } from "../_shared/verticals.ts";
import { englishLevel } from "../_shared/jarvi.ts";
import { METIER_FAMILIES } from "../_shared/taxonomy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Poids de l'étage IA dans le score final. Le reste vient du score de règles. */
const AI_WEIGHT = 0.6;
const MODEL = "claude-sonnet-5-5";
const ENGLISH_LEVEL_LABELS = ["", "débutant", "intermédiaire", "avancé", "courant", "natif"];
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
        "id, vertical, first_name, job_title, skills, sectors, tech_specialties, mobility, clients, languages," +
        " remote_preference, tjm, model, available, availability_date, admin_rating, admin_english_rating, admin_comments, super_tam," +
        " intro_text, missions, has_linkedin_license, specialties, weekly_capacity, years_experience, previous_companies",
      )
      .eq("onboarding_completed", true)
      // Verticales étanches : seuls les profils de la verticale du besoin sont candidats.
      .eq("vertical", need.vertical ?? "rpo");

    if (!recruiters?.length) return json({ suggestions: [], message: "Aucun profil freelance disponible." });

    // Jours par semaine déjà engagés par profil (missions en cours ou en mise en place) :
    // un fractional reste proposable tant qu'il lui reste de la capacité.
    const { data: activeMissions } = await admin
      .from("missions").select("recruiter_profile_id, days_per_week").in("status", ["active", "onboarding"]);
    const committed = new Map<string, number>();
    for (const m of (activeMissions ?? []) as { recruiter_profile_id: string; days_per_week: number | null }[]) {
      committed.set(m.recruiter_profile_id, (committed.get(m.recruiter_profile_id) ?? 0) + (m.days_per_week ?? 5));
    }

    const shortlist = prefilter(need as Need, recruiters as Recruiter[], committed, SHORTLIST_SIZE);
    if (!shortlist.length) {
      return json({ suggestions: [], message: "Aucun profil ne satisfait les critères du besoin." });
    }

    // ── Étage 2 : Claude ──────────────────────────────────────────────────
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    let aiByProfile = new Map<string, { score: number; reasons: string[] }>();
    // État de l'étage IA, renvoyé à l'admin : « ok », « sans clé » ou le message d'erreur.
    let aiStatus = apiKey ? "ok" : "sans clé";

    if (apiKey) {
      try {
        aiByProfile = await rankWithClaude(apiKey, need as Need, shortlist);
      } catch (e) {
        aiStatus = e instanceof Error ? e.message.slice(0, 300) : String(e);
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
      ai_status: isAdmin ? aiStatus : undefined,
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
      metiers_recrutes: r.skills ?? [],
      specialites: r.specialties ?? [],
      rythme: rhythmLabel(r.weekly_capacity),
      annees_experience: r.years_experience ?? null,
      entreprises_parcours: r.previous_companies ?? [],
      tech_specialties: r.tech_specialties ?? [],
      sectors: r.sectors ?? [],
      mobility: r.mobility ?? [],
      remote_preference: r.remote_preference,
      tjm_recruteur: r.tjm,
      tarif: r.tjm != null ? clientPrice(r.tjm) : null,
      model: r.model,
      disponible: r.available,
      date_disponibilite: r.availability_date,
      actuellement_en_mission: s.currentlyOnMission,
      note_admin: r.admin_rating ?? 0,
      avis_interne: r.admin_comments?.slice(0, 600) ?? "",
      niveau_anglais: englishLevel({ languages: Array.isArray(r.languages) ? r.languages as { language: string; level: string }[] : [], admin_english_rating: r.admin_english_rating ?? null }),
      super_tam: r.super_tam,
      nb_missions_passees: pastMissions.length,
      // Détail des missions pour juger l'expertise réelle ; le nom des clients reste en base
      missions_passees: (pastMissions as Array<Record<string, unknown>>).slice(0, 5).map((m) => ({
        profils_recrutes: m.profile_types ?? null,
        resultats: m.kpis ?? null,
        duree: m.duration ?? null,
        outils: m.tools ?? [],
      })),
      nb_clients: r.clients?.length ?? 0,
      // Un seul niveau par langue : pour l'anglais, le niveau retenu (celui de l'admin s'il existe).
      langues: (Array.isArray(r.languages) ? r.languages as Array<{ language?: string; level?: string }> : [])
        .map((l) => l.language === "Anglais" && r.admin_english_rating
          ? `Anglais (${ENGLISH_LEVEL_LABELS[r.admin_english_rating]})`
          : `${l.language} (${l.level})`)
        .concat(r.admin_english_rating && !(r.languages as Array<{ language?: string }> | null)?.some?.((l) => l.language === "Anglais")
          ? [`Anglais (${ENGLISH_LEVEL_LABELS[r.admin_english_rating]})`] : [])
        .join(", "),
      presentation: r.intro_text?.slice(0, 300) ?? "",
      score_regles: s.score,
      signaux: s.notes,
    };
  });

  const isRpo = (need.vertical ?? "rpo") === "rpo";
  const v = verticalOf(need.vertical);
  const intro = isRpo
    ? "Tu es un expert du recrutement RPO chez Kistone. Tu classes des recruteurs freelances face à un besoin client."
    : `Tu es un expert des dirigeants C-Level fractional chez Kistone. Tu classes des freelances ${v.roles} (fonction ${v.label}) face à un besoin client.`;
  const analysis = isRpo
    ? `Analyse des compétences :
- Les métiers recrutés sont : ${METIER_FAMILIES.flat().join(", ")}. Familles voisines : ${METIER_FAMILIES.map((f) => f.join(" / ")).join(" ; ")}. Un recruteur d'une famille voisine peut convenir, un recruteur d'une autre famille rarement.
- Ne te contente pas des cases cochées : lis l'intitulé du poste et la description du besoin (technos, séniorité, volume, délais), puis compare-les aux missions passées (profils recrutés, résultats, durée, outils), aux spécialités et à la présentation du recruteur.
- Un profil avec des missions passées proches du besoin (mêmes profils, volumes comparables) doit passer devant un profil qui a seulement coché le bon métier.`
    : `Analyse des compétences :
- Spécialités possibles de la fonction : ${v.specialties.join(", ")}. Compare les "specialites" du profil à celles attendues par le besoin.
- Lis l'intitulé et la description du besoin (stade de l'entreprise, enjeux : levée, structuration, scaling, équipe à manager) et compare-les au parcours : années d'expérience, entreprises du parcours, missions passées (rôle et périmètre, résultat clé), présentation.
- Un dirigeant qui a déjà porté un enjeu comparable (même stade, même type de chantier) doit passer devant un profil qui a seulement coché la bonne spécialité.
- "rythme" = jours par semaine que le profil propose ; le besoin demande ${rhythmLabel(need.days_per_week).toLowerCase()}.`;

  const system = `${intro}

Ces profils ont DÉJÀ passé un filtre déterministe : budget, disponibilité et compatibilité remote sont vérifiés. Le champ "score_regles" (0-100) est ce filtre, et "signaux" en donne les motifs factuels. Ton rôle est d'apporter le jugement qualitatif que le filtre ne capte pas : adéquation réelle entre l'expérience du profil et le poste, pertinence sectorielle, solidité du parcours.

${analysis}

Règles :
- "tarif" = tarif recruteur + ${MARGIN_PCT} % de marge Kistone : c'est le TJM présenté au client. Dans les raisons, écris « Tarif de X €/j » : jamais « tarif client », « prix client », et le tarif du recruteur (tjm_recruteur) ne doit jamais apparaître.
- note_admin : 0 = non noté (ignore ce critère), 2 = pas convaincant, à proposer en dernier recours, 3 = correct, 4 = top profil à favoriser, 5 = top profil prioritaire, à placer en tête dès qu'il est pertinent pour le besoin. Critère lourd.
- avis_interne : appréciation interne sur le profil, déterminante. Tiens-en compte fortement (points forts, réserves, défaut rédhibitoire pour ce type de besoin → écarte le profil).
- niveau_anglais : 1 (débutant) à 5 (natif) ; si le besoin demande de l'anglais, un niveau inférieur à 3 est pénalisant. C'est le niveau du profil : ne dis jamais qu'il a été évalué, vérifié, corrigé ou déclaré. Dans les raisons, exprime-le en mots (« anglais courant », « bon niveau d'anglais »), jamais avec un chiffre ou une échelle (pas de « niveau 4 », « 4/5 »).
- super_tam = profil d'excellence, à mentionner dans les raisons.
- Disponibilité : compare-la à la date d'arrivée souhaitée du besoin (ou à aujourd'hui si « dès que possible »). Les profils de la liste sont libres au plus tard 30 jours après cette date ; plus le retard est grand, moins le profil convient.
- Ne t'écarte pas de plus de 25 points du score_regles sans raison explicite dans tes justifications.
- Les raisons sont lues par le client : reste impersonnel et factuel. Ne mentionne JAMAIS une note, une étoile, un score, un avis ou un commentaire interne, ni qui a évalué ou jugé le profil (pas de « selon notre équipe », « évalué comme », « recommandé par »). Décris le profil lui-même : expérience, missions, métiers, secteurs, disponibilité, langues.
- Écris les raisons en français, concrètes et vérifiables. Pas de superlatif creux.
- Le client lit ces raisons : ne parle jamais « du client » à la troisième personne. Réfère-toi au besoin (« comme le demande le besoin », « adapté au poste »).
- Réponds uniquement en appelant l'outil classer_profils.`;

  const prompt = `BESOIN CLIENT
- Poste : ${need.job_title}
- Fonction : ${v.label} (${v.short})${isRpo ? `\n- Typologies à recruter : ${need.profile_types?.join(", ") || "non précisé"}` : `\n- Spécialités attendues : ${need.specialties?.join(", ") || "non précisé"}\n- Rythme demandé : ${rhythmLabel(need.days_per_week)}`}
- Secteurs : ${need.sectors?.join(", ") || "non précisé"}
- Lieu : ${need.mission_location} — remote : ${need.remote_policy}
- Arrivée souhaitée : ${need.desired_start ? `le ${need.desired_start}` : "dès que possible"} (aujourd'hui : ${new Date().toISOString().slice(0, 10)})
- Budget : ${need.budget_tjm_min ?? "?"} à ${need.budget_tjm_max ?? "?"} €/jour (marge incluse, à comparer au champ "tarif")
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
      max_tokens: 16000,
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
      // Ce modèle refuse l'appel d'outil forcé : on laisse « auto » et la consigne nomme l'outil.
      tool_choice: { type: "auto" },
      output_config: { effort: "low" },
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
