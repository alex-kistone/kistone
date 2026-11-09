/**
 * job-radar-refresh — recherche d'offres CDI du Radar, lancée par le freelance (TheirStack).
 *
 * Plus de collecte quotidienne (décision d'Alex, 2026-11-06) : le freelance lance sa recherche
 * depuis /radar. Une recherche pour les offres de recruteur, plus une par métier de son profil,
 * en France, en temps plein, chez des employeurs directs (pas de cabinets). Les entreprises sous
 * clause de non-concurrence (jusqu'au 20/04/2028) sont écartées avant enregistrement.
 *
 * Version gratuite : FREE_RADAR_RUNS recherche(s) par freelance. Une recherche en échec ne compte
 * pas. Les admins n'ont pas de limite.
 *
 * Coût : 1 crédit TheirStack par offre renvoyée, soit au plus (1 + métiers) × perQuery par
 * recherche (8 × 10 = 80 pour un freelance qui a coché tous les métiers).
 *
 * Accès :
 * - un freelance ou un admin connecté (jeton utilisateur) : les offres trouvées lui sont rattachées ;
 * - l'en-tête x-cron-secret égal à CRON_SECRET : outil d'admin (essai à blanc), sans rattachement.
 * Seuls les admins et le secret acceptent des options : { maxAgeDays?, perQuery?, dryRun? }.
 * Secret requis : THEIRSTACK_API_KEY. Réglage facultatif : JOB_RADAR_PER_QUERY (défaut 10).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  FREE_RADAR_RUNS, offerFromTheirStack, RADAR_QUERIES, RADAR_TITLE_EXCLUDE, radarQueriesFor, type RadarOffer,
} from "../_shared/jobRadar.ts";
import { nonCompeteCompany } from "../_shared/nonCompete.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

const THEIRSTACK_URL = "https://api.theirstack.com/v1/jobs/search";
const MAX_AGE_DAYS = 14;
const KEEP_DAYS = 45;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Qui appelle : le secret (outil d'admin), sinon un utilisateur connecté
  const cronSecret = Deno.env.get("CRON_SECRET");
  const bySecret = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  let userId: string | null = null;
  let isAdmin = bySecret;
  if (!bySecret) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = token
      ? await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token)
      : { data: { user: null } };
    if (!user) return json({ error: "Connectez-vous pour lancer le radar." }, 401);
    userId = user.id;
    const { data: admin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
    isAdmin = !!admin;
  }

  // Profil du freelance (métiers) et limite de la version gratuite
  let skills: string[] | null = null;
  if (userId) {
    const { data: profile } = await db.from("recruiter_profiles").select("skills").eq("user_id", userId).maybeSingle();
    if (!profile && !isAdmin) return json({ error: "Complétez votre profil freelance pour lancer le radar." }, 403);
    skills = profile?.skills ?? null;
    if (!isAdmin) {
      const { count } = await db.from("job_radar_runs").select("id", { count: "exact", head: true })
        .eq("user_id", userId).in("status", ["running", "done"]);
      if ((count ?? 0) >= FREE_RADAR_RUNS) {
        return json({ error: "Votre recherche gratuite a déjà été utilisée.", code: "quota" }, 403);
      }
    }
  }

  const apiKey = Deno.env.get("THEIRSTACK_API_KEY");
  if (!apiKey) return json({ error: "Le radar n'est pas encore configuré." }, 503);

  // Options réservées aux admins
  const body = isAdmin ? await req.json().catch(() => ({})) : {};
  const maxAgeDays = clamp(body.maxAgeDays, 0, 30, MAX_AGE_DAYS);
  const perQuery = clamp(body.perQuery ?? Deno.env.get("JOB_RADAR_PER_QUERY"), 1, 100, 10);
  const dryRun = isAdmin && body.dryRun === true;
  const queries = userId ? radarQueriesFor(skills) : RADAR_QUERIES;

  let runId: string | null = null;
  if (userId && !dryRun) {
    const { data: run, error } = await db.from("job_radar_runs").insert({ user_id: userId }).select("id").single();
    if (error) return json({ error: error.message }, 500);
    runId = run.id;
  }
  const finish = (patch: Record<string, unknown>) =>
    runId ? db.from("job_radar_runs").update(patch).eq("id", runId) : Promise.resolve();

  try {
    const fetchedAt = new Date().toISOString();
    const rows = new Map<string, RadarOffer>();
    const excluded = new Set<string>();
    const errors: string[] = [];
    let returned = 0;

    for (const q of queries) {
      const payload = {
        posted_at_max_age_days: maxAgeDays,
        job_country_code_or: ["FR"],
        job_title_or: q.titles,
        job_title_not: RADAR_TITLE_EXCLUDE,
        employment_statuses_or: ["full_time"],
        company_type: "direct_employer",
        limit: perQuery,
      };
      const call = () => fetch(THEIRSTACK_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let res = await call();
      if (res.status === 429) {
        // Limite de débit : on attend ce que demande l'API (au plus 65 s), puis un seul nouvel essai
        const wait = clamp(res.headers.get("RateLimit-Reset") ?? res.headers.get("Retry-After"), 1, 65, 60);
        await res.body?.cancel();
        await sleep(wait * 1000);
        res = await call();
      }
      if (!res.ok) {
        errors.push(`${q.metier} : HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
        if (res.status === 401 || res.status === 402) break; // clé refusée ou crédits épuisés
        continue;
      }
      const data = await res.json();
      const jobs: unknown[] = Array.isArray(data?.data) ? data.data : [];
      returned += jobs.length;
      for (const job of jobs) {
        const row = offerFromTheirStack(job, q.metier, fetchedAt);
        if (!row || rows.has(row.id)) continue;
        const clause = nonCompeteCompany(row.company_name, row.company_domain);
        if (clause) { excluded.add(`${row.company_name} (${clause.company}${clause.certain ? "" : ", à vérifier"})`); continue; }
        rows.set(row.id, row);
      }
      await sleep(400); // 4 requêtes / s au plus
    }

    // Aucune offre et des erreurs : la recherche a échoué, elle ne compte pas
    if (errors.length && !returned) {
      console.error("job-radar-refresh", errors);
      await finish({ status: "failed", error: errors.join(" | ").slice(0, 1000) });
      return json({ error: "Le radar est momentanément indisponible. Réessayez plus tard.", errors: isAdmin ? errors : undefined }, 502);
    }

    if (!dryRun && rows.size) {
      const { error } = await db.from("job_radar_offers").upsert([...rows.values()], { onConflict: "id" });
      if (error) throw error;
      if (userId) {
        const links = [...rows.keys()].map((offer_id) => ({ user_id: userId, offer_id, run_id: runId, found_at: fetchedAt }));
        const { error: linkError } = await db.from("job_radar_user_offers").upsert(links, { onConflict: "user_id,offer_id" });
        if (linkError) throw linkError;
      }
    }
    if (!dryRun) {
      const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
      await db.from("job_radar_offers").delete().lt("date_posted", cutoff);
    }
    // Erreurs partielles (crédits épuisés, limite de débit…) : gardées pour comprendre un résultat maigre
    await finish({ status: "done", credits_used: returned, offers_found: rows.size, error: errors.length ? errors.join(" | ").slice(0, 1000) : null });

    return json({
      maxAgeDays,
      perQuery,
      queries: queries.map((q) => q.metier),
      creditsUsed: returned,
      saved: dryRun ? 0 : rows.size,
      ...(isAdmin ? { excluded: [...excluded], errors } : {}),
      ...(dryRun ? { sample: [...rows.values()].slice(0, 5) } : {}),
    });
  } catch (err) {
    await finish({ status: "failed", error: err instanceof Error ? err.message : String(err) });
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
