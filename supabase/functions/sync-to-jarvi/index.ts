import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JARVI_API_URL =
  "https://functions.prod.jarvi.tech/v1/public-api/rest/v2/applicants";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const JARVI_API_KEY = Deno.env.get("JARVI_API_KEY");
    if (!JARVI_API_KEY) {
      throw new Error("JARVI_API_KEY is not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from("recruiter_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error(profileError?.message || "Profile not found");
    }

    // Custom field UUIDs
    const CF_MOBILITE = "69740c87-2897-413a-a25d-1b1984463591";
    const CF_TJM = "84909bac-bbeb-4d14-bbca-431f419e0d0c";
    const CF_DATE_DISPO = "cd6712b1-5fcd-4214-8013-cd1be7972bcc";
    const CF_MODELE = "dd2640fa-e00b-496b-b768-e8b6a0540e17";
    const CF_DOMAINES = "ec90e807-b50f-464e-9525-3c17a26bcfaf";
    const CF_DISPONIBLE = "ee115f86-0bfd-4b44-8fd8-8486ad24df01";
    const PROJECT_UUID = "676bdb52-3540-4eb8-b858-df61097ada63";

    // Map profile data to Jarvi format
    // Custom fields are top-level keys with UUID as key name per Jarvi API v2 docs
    const jarviPayload: Record<string, unknown> = {
      externalId: `connect2-${userId}`,
      firstName: profile.first_name,
      lastName: profile.last_name,
      emailAddresses: profile.email,
      phoneNumbers: profile.phone || undefined,
      linkedinUrl: profile.linkedin_url || undefined,
      currentPosition: profile.job_title || undefined,
      headline: profile.job_title || undefined,
      projectId: PROJECT_UUID,
      // Custom fields as top-level keys
      [CF_MOBILITE]: profile.mobility?.length ? profile.mobility.join(", ") : undefined,
      [CF_TJM]: profile.tjm != null ? `${profile.tjm}€/jour` : undefined,
      [CF_DATE_DISPO]: profile.availability_date || undefined,
      [CF_MODELE]: profile.model || undefined,
      [CF_DOMAINES]: profile.skills?.length ? profile.skills.join(", ") : undefined,
      [CF_DISPONIBLE]: profile.available ? "Oui" : "Non",
    };

    // Remove undefined values
    Object.keys(jarviPayload).forEach((key) => {
      if (jarviPayload[key] === undefined) delete jarviPayload[key];
    });

    console.log("Sending to Jarvi:", JSON.stringify(jarviPayload));

    const jarviRes = await fetch(JARVI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": JARVI_API_KEY,
      },
      body: JSON.stringify(jarviPayload),
    });

    const jarviData = await jarviRes.json();

    if (!jarviRes.ok) {
      console.error("Jarvi API error:", jarviData);
      throw new Error(
        `Jarvi API error [${jarviRes.status}]: ${JSON.stringify(jarviData)}`
      );
    }

    console.log("Jarvi sync success:", jarviData);

    return new Response(
      JSON.stringify({ success: true, jarviProfileId: jarviData.profileId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
