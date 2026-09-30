/**
 * jarvi-sync — pousse un profil freelance vers Jarvi (ATS de Kistone).
 *
 * Corps : { profile_id? } — sans profile_id, le profil du freelance connecté. L'admin peut
 * synchroniser n'importe quel profil. Appelée après chaque enregistrement du profil.
 *
 * 1. Retrouve le profil Jarvi : identifiant déjà connu, sinon recherche par URL LinkedIn
 *    (fiche créée à la main dans Jarvi), sinon création.
 * 2. Crée ou met à jour la fiche (identité, poste, champs personnalisés via src/lib/jarvi.ts)
 *    et la rattache au projet Jarvi des inscriptions.
 * 3. Enregistre l'identifiant Jarvi, la date ou l'erreur sur recruiter_profiles.
 *
 * Secret : JARVI_API_KEY. La clé publique suffit (envoi par /applicants) ; la clé privée
 * permet en plus de retrouver une fiche créée à la main dans Jarvi par son URL LinkedIn.
 * Sans clé, 503 et rien n'est envoyé.
 * Format des champs personnalisés d'après la documentation Jarvi (valeurs séparées par des
 * virgules) ; à confirmer au premier essai réel.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JARVI_PROJECTS, JARVI_SPECIALITES, toJarviFields } from "../_shared/jarvi.ts";

const API = "https://functions.prod.jarvi.tech/v1/public-api/rest/v2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Valeur d'un champ personnalisé au format texte attendu par Jarvi. */
function asJarviValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(",");
  return String(v);
}

async function findByLinkedin(key: string, url: string): Promise<string | null> {
  const where = encodeURIComponent(JSON.stringify({ profileUrl: { _eq: url } }));
  const res = await fetch(`${API}/profiles?where=${where}&limit=1`, { headers: { "X-API-KEY": key } });
  // Clé publique : la recherche est refusée, on passe directement à l'envoi (création ou
  // fusion par externalId) — sans rapprochement avec une fiche créée à la main dans Jarvi.
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`Recherche Jarvi ${res.status} : ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  return body?.data?.[0]?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("JARVI_API_KEY");
  if (!key) return json({ error: "Synchronisation Jarvi non configurée (JARVI_API_KEY absente)." }, 503);

  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: { user } } = token
    ? await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token)
    : { data: { user: null } };
  if (!user) return json({ error: "Non authentifié" }, 401);
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });

  const body = await req.json().catch(() => ({}));
  const q = db.from("recruiter_profiles").select("*");
  const { data: p } = body.profile_id ? await q.eq("id", body.profile_id).maybeSingle() : await q.eq("user_id", user.id).maybeSingle();
  if (!p) return json({ error: "Profil introuvable" }, 404);
  if (!isAdmin && p.user_id !== user.id) return json({ error: "Accès refusé" }, 403);
  if (!p.linkedin_url) return json({ error: "URL LinkedIn manquante : synchronisation impossible." }, 400);

  try {
    const jarviId = p.jarvi_profile_id ?? await findByLinkedin(key, p.linkedin_url);
    const { fields, unmapped } = toJarviFields({
      skills: p.skills ?? [], model: p.model, tjm: p.tjm, available: p.available !== false,
      availability_date: p.availability_date, sectors: p.sectors ?? [], mobility: p.mobility ?? [],
      remote_preference: p.remote_preference, has_linkedin_license: p.has_linkedin_license, languages: Array.isArray(p.languages) ? p.languages : [],
      admin_rating: p.admin_rating, admin_english_rating: p.admin_english_rating,
      admin_comments: p.admin_comments, tech_specialties: p.tech_specialties,
    }, JARVI_SPECIALITES);

    const payload: Record<string, string> = {
      externalId: p.id,
      // Tout freelance inscrit est rattaché au projet Jarvi des inscriptions de sa verticale.
      projectId: JARVI_PROJECTS[(p.vertical ?? "rpo") as keyof typeof JARVI_PROJECTS] ?? JARVI_PROJECTS.rpo,
      firstName: p.first_name ?? "",
      lastName: p.last_name ?? "",
      linkedinUrl: p.linkedin_url,
      ...(p.email ? { emailAddresses: p.email } : {}),
      ...(p.phone ? { phoneNumbers: p.phone } : {}),
      ...(p.job_title ? { currentPosition: p.job_title } : {}),
      ...(jarviId ? { id: jarviId } : {}),
    };
    for (const [fieldId, value] of Object.entries(fields)) payload[fieldId] = asJarviValue(value);

    // Point d'entrée « candidatures » : accepté avec la clé publique, il crée ou met à jour la
    // fiche (fusion par id / externalId) et la rattache au projet des inscriptions.
    const res = await fetch(`${API}/applicants`, {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Jarvi ${res.status} : ${String(out?.message ?? "").slice(0, 200)}`);

    const profileId = out.profileId ?? jarviId;
    await db.from("recruiter_profiles").update({
      jarvi_profile_id: profileId, jarvi_synced_at: new Date().toISOString(), jarvi_sync_error: null,
    }).eq("id", p.id);
    return json({ jarvi_profile_id: profileId, matched: jarviId ? "existant" : "créé", unmapped });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.from("recruiter_profiles").update({ jarvi_sync_error: message }).eq("id", p.id);
    console.error("jarvi-sync", message);
    return json({ error: message }, 502);
  }
});
