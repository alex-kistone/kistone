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

    // Verify JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      first_name,
      last_name,
      job_title,
      linkedin_url,
      photo_url,
      skills,
      clients,
      mobility,
      languages,
      intro_text,
    } = body;

    if (!first_name || !last_name) {
      return new Response(JSON.stringify({ error: "first_name and last_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if profile already exists by linkedin_url
    if (linkedin_url) {
      const { data: existing } = await supabase
        .from("recruiter_profiles")
        .select("id")
        .eq("linkedin_url", linkedin_url)
        .maybeSingle();

      if (existing) {
        // Update existing profile
        const { data, error } = await supabase
          .from("recruiter_profiles")
          .update({
            first_name,
            last_name,
            job_title: job_title || null,
            photo_url: photo_url || null,
            skills: skills || [],
            clients: clients || [],
            mobility: mobility || [],
            languages: languages || [],
            intro_text: intro_text || null,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, action: "updated", profile: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert new profile
    const { data, error } = await supabase
      .from("recruiter_profiles")
      .insert({
        first_name,
        last_name,
        email: `${first_name.toLowerCase()}.${last_name.toLowerCase()}@imported.local`,
        job_title: job_title || null,
        linkedin_url: linkedin_url || null,
        photo_url: photo_url || null,
        skills: skills || [],
        clients: clients || [],
        mobility: mobility || [],
        languages: languages || [],
        intro_text: intro_text || null,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, action: "created", profile: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Import error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
