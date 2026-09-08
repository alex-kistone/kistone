import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { suggestion_id } = await req.json();
    if (!suggestion_id) throw new Error("suggestion_id is required");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get suggestion and verify ownership
    const { data: suggestion, error: sugError } = await adminClient
      .from("profile_suggestions")
      .select("id, need_id, recruiter_profile_id, match_score, match_reasons, anonymous_label, super_tam, recruiter_first_name")
      .eq("id", suggestion_id)
      .single();

    if (sugError || !suggestion) {
      return new Response(JSON.stringify({ error: "Suggestion not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the need belongs to this user
    const { data: need } = await adminClient
      .from("client_needs")
      .select("id")
      .eq("id", suggestion.need_id)
      .eq("user_id", user.id)
      .single();

    if (!need) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recruiter profile (anonymized fields only)
    const { data: profile } = await adminClient
      .from("recruiter_profiles")
      .select("first_name, job_title, skills, clients, mobility, tjm, model, available, availability_date, admin_rating, super_tam, tech_specialties, intro_text, missions, languages, has_linkedin_license, sectors")
      .eq("id", suggestion.recruiter_profile_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return anonymized profile (no last name, email, phone, linkedin, photo)
    const anonymizedProfile = {
      first_name: profile.first_name,
      job_title: profile.job_title,
      skills: profile.skills || [],
      clients: profile.clients || [],
      mobility: profile.mobility || [],
      tjm: profile.tjm,
      model: profile.model,
      available: profile.available,
      availability_date: profile.availability_date,
      admin_rating: profile.admin_rating,
      super_tam: profile.super_tam,
      tech_specialties: profile.tech_specialties || [],
      intro_text: profile.intro_text,
      missions: profile.missions || [],
      languages: profile.languages || [],
      has_linkedin_license: profile.has_linkedin_license,
      sectors: profile.sectors || [],
      match_score: suggestion.match_score,
      match_reasons: suggestion.match_reasons,
    };

    return new Response(JSON.stringify({ profile: anonymizedProfile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
