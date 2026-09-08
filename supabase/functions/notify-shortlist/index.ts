import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { suggestion_id, need_id, anonymous_label } = await req.json();
    if (!suggestion_id || !need_id) {
      return new Response(JSON.stringify({ error: "suggestion_id and need_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the need info
    const { data: need } = await supabase
      .from("client_needs")
      .select("job_title, company_name, contact_name")
      .eq("id", need_id)
      .single();

    // Get the suggestion + freelance profile (real name)
    const { data: suggestion } = await supabase
      .from("profile_suggestions")
      .select("recruiter_profile_id")
      .eq("id", suggestion_id)
      .single();

    let freelancerName = anonymous_label || "Un profil";
    if (suggestion?.recruiter_profile_id) {
      const { data: profile } = await supabase
        .from("recruiter_profiles")
        .select("first_name, last_name, job_title")
        .eq("id", suggestion.recruiter_profile_id)
        .single();
      if (profile) {
        const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        freelancerName = fullName || freelancerName;
      }
    }

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no admins" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin emails from auth
    const adminEmails: string[] = [];
    for (const role of adminRoles) {
      const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no admin emails" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const needTitle = need?.job_title || "Besoin";
    const company = need?.company_name || "";
    const clientName = need?.contact_name || "Un client";
    const appUrl = Deno.env.get("APP_URL") || "https://freeconnect.lovable.app";
    const dashboardUrl = `${appUrl}/dashboard?tab=needs&need=${encodeURIComponent(need_id)}`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kistone <onboarding@resend.dev>",
        to: adminEmails,
        subject: `🔔 ${clientName} souhaite en savoir plus sur ${freelancerName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Nouveau shortlist client 🎯</h2>
            <p style="color: #444;"><strong>${clientName}</strong> (${company}) souhaite en savoir plus sur le profil <strong>${freelancerName}</strong> pour le besoin :</p>
            <p style="color: #333; font-weight: 600;">${needTitle}</p>
            <a href="${dashboardUrl}" style="display: inline-block; background: #c2410c; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-top: 12px;">Voir le pipeline</a>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
    } else {
      console.log("Shortlist notification sent to admins:", adminEmails);
    }

    return new Response(JSON.stringify({ success: true, notified: adminEmails }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
