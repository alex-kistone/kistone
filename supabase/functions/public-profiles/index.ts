import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch profiles prioritizing super_tam, high ratings, then recent
    const { data, error } = await supabase
      .from("recruiter_profiles")
      .select("id, first_name, job_title, skills, mobility, tjm, model, available, availability_date, intro_text, missions, languages, has_linkedin_license, super_tam, admin_rating, photo_url, clients, created_at")
      .eq("model", "RPO")
      .order("super_tam", { ascending: false, nullsFirst: false })
      .order("admin_rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    // Shuffle with weighted priority: super_tam and 4-5 stars get higher chance
    const weighted = (data || []).map((p) => {
      let weight = 1;
      if (p.super_tam) weight += 3;
      if ((p.admin_rating || 0) >= 4) weight += 2;
      // Recent profiles (last 30 days) get a boost
      const daysSince = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 30) weight += 2;
      return { ...p, _weight: weight };
    });

    // Weighted shuffle
    const shuffled = weighted
      .map((p) => ({ ...p, _sort: Math.random() * p._weight }))
      .sort((a, b) => b._sort - a._sort)
      .slice(0, 6);

    // Return anonymized profiles (no email, phone, linkedin, last name, clients)
    const anonymized = shuffled.map(({ _weight, _sort, created_at, admin_rating, ...p }) => ({
      id: p.id,
      first_name: p.first_name,
      job_title: p.job_title,
      skills: p.skills,
      mobility: p.mobility,
      tjm: p.tjm,
      model: p.model,
      available: p.available,
      availability_date: p.availability_date,
      intro_text: p.intro_text ? (p.intro_text.length > 120 ? p.intro_text.slice(0, 120) + "…" : p.intro_text) : null,
      missions_count: Array.isArray(p.missions) ? p.missions.length : 0,
      clients: Array.isArray(p.clients) ? p.clients : [],
      languages: p.languages,
      has_linkedin_license: p.has_linkedin_license,
      super_tam: p.super_tam,
      photo_url: p.photo_url,
    }));

    return new Response(JSON.stringify(anonymized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
