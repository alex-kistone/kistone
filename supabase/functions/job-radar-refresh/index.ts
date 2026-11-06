/**
 * job-radar-refresh — collecte des offres CDI du Radar des freelances (TheirStack).
 *
 * Une recherche par métier (plus une pour les offres de recruteur), en France, en temps plein,
 * chez des employeurs directs (pas de cabinets). Les entreprises sous clause de
 * non-concurrence (jusqu'au 20/04/2028) sont écartées avant enregistrement.
 *
 * Coût : 1 crédit TheirStack par offre renvoyée, soit au plus RADAR_QUERIES × perQuery par
 * appel (8 × 10 = 80 par défaut). Les offres sont partagées par toute la communauté : le coût
 * ne dépend pas du nombre de freelances.
 *
 * Accès : en-tête x-cron-secret égal au secret CRON_SECRET, ou un admin connecté.
 * Secret requis : THEIRSTACK_API_KEY. Réglage facultatif : JOB_RADAR_PER_QUERY (défaut 10).
 * Corps facultatif : { maxAgeDays?: number, perQuery?: number, dryRun?: boolean }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { offerFromTheirStack, RADAR_QUERIES, RADAR_TITLE_EXCLUDE, type RadarOffer } from "../_shared/jobRadar.ts";
import { nonCompeteCompany } from "../_shared/nonCompete.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

const THEIRSTACK_URL = "https://api.theirstack.com/v1/jobs/search";
const KEEP_DAYS = 45;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!(cronSecret && req.headers.get("x-cron-secret") === cronSecret)) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = token
      ? await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token)
      : { data: { user: null } };
    const { data } = user ? await db.rpc("has_role", { _user_id: user.id, _role: "admin" }) : { data: false };
    if (!data) return json({ error: "Accès refusé" }, 401);
  }

  const apiKey = Deno.env.get("THEIRSTACK_API_KEY");
  if (!apiKey) return json({ error: "Secret THEIRSTACK_API_KEY absent : radar non configuré." }, 503);

  try {
    // Appelants de confiance seulement (cron ou admin) : les options sont donc acceptées
    const body = await req.json().catch(() => ({}));
    // Première collecte : la semaine écoulée ; ensuite, les offres de la veille et du jour
    const { count: stored } = await db.from("job_radar_offers").select("id", { count: "exact", head: true });
    const maxAgeDays = clamp(body.maxAgeDays, 0, 30, stored ? 1 : 7);
    const perQuery = clamp(body.perQuery ?? Deno.env.get("JOB_RADAR_PER_QUERY"), 1, 100, 10);
    const dryRun = body.dryRun === true;

    const fetchedAt = new Date().toISOString();
    const rows = new Map<string, RadarOffer>();
    const excluded = new Set<string>();
    const errors: string[] = [];
    let returned = 0;

    for (const q of RADAR_QUERIES) {
      const payload = {
        posted_at_max_age_days: maxAgeDays,
        job_country_code_or: ["FR"],
        job_title_or: q.titles,
        job_title_not: RADAR_TITLE_EXCLUDE,
        employment_statuses_or: ["full_time"],
        company_type: "direct_employer",
        limit: perQuery,
      };
      let res = await fetch(THEIRSTACK_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        // Limite de débit : on attend ce que demande l'API (au plus 65 s), puis un seul nouvel essai
        const wait = clamp(res.headers.get("RateLimit-Reset") ?? res.headers.get("Retry-After"), 1, 65, 60);
        await res.body?.cancel();
        await sleep(wait * 1000);
        res = await fetch(THEIRSTACK_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
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

    if (!dryRun && rows.size) {
      const { error } = await db.from("job_radar_offers").upsert([...rows.values()], { onConflict: "id" });
      if (error) throw error;
    }
    if (!dryRun) {
      const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
      await db.from("job_radar_offers").delete().lt("date_posted", cutoff);
    }

    return json({
      maxAgeDays,
      perQuery,
      creditsUsed: returned,
      saved: dryRun ? 0 : rows.size,
      excluded: [...excluded],
      errors,
      ...(dryRun ? { sample: [...rows.values()].slice(0, 5) } : {}),
    }, errors.length && !returned ? 502 : 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
