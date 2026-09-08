import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { suggestions, need } = await req.json();
    if (!suggestions || !need) throw new Error("suggestions and need are required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("No RESEND_API_KEY configured, skipping notifications");
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get recruiter profiles for matched suggestions
    const profileIds = suggestions.map((s: any) => s.profile_id);
    const { data: profiles } = await supabase
      .from("recruiter_profiles")
      .select("id, first_name, email, user_id")
      .in("id", profileIds);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const profile of profiles) {
      if (!profile.email) continue;

      const matchInfo = suggestions.find((s: any) => s.profile_id === profile.id);
      const score = matchInfo?.score || 0;

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Connect2 <notifications@connect2.ai>",
            to: [profile.email],
            subject: `🎯 Nouvelle opportunité : ${need.job_title} chez ${need.company_name}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 24px; color: #111; margin: 0;">Connect2</h1>
                </div>
                
                <p style="font-size: 16px; color: #333;">Bonjour ${profile.first_name},</p>
                
                <p style="font-size: 15px; color: #555; line-height: 1.6;">
                  Un nouveau besoin client correspond à votre profil avec un score de matching de <strong>${score}%</strong> !
                </p>
                
                <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <h2 style="font-size: 18px; color: #111; margin: 0 0 12px;">${need.job_title}</h2>
                  <p style="font-size: 14px; color: #666; margin: 4px 0;">🏢 ${need.company_name}</p>
                  <p style="font-size: 14px; color: #666; margin: 4px 0;">📍 ${need.mission_location}</p>
                  <p style="font-size: 14px; color: #666; margin: 4px 0;">🏠 ${need.remote_policy === "full-remote" ? "Full remote" : need.remote_policy === "hybrid" ? "Hybride" : "Sur site"}</p>
                  ${need.budget_tjm_max ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">💰 Budget : ${need.budget_tjm_min || "?"} - ${need.budget_tjm_max}€/j</p>` : ""}
                  ${need.description ? `<p style="font-size: 14px; color: #555; margin: 12px 0 0; line-height: 1.5;">${need.description.substring(0, 200)}${need.description.length > 200 ? "..." : ""}</p>` : ""}
                </div>

                ${matchInfo?.reasons ? `
                <div style="margin: 16px 0;">
                  <p style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px;">Pourquoi ce match :</p>
                  <ul style="padding-left: 20px; margin: 0;">
                    ${matchInfo.reasons.map((r: string) => `<li style="font-size: 14px; color: #555; margin: 4px 0; line-height: 1.5;">${r}</li>`).join("")}
                  </ul>
                </div>
                ` : ""}
                
                <div style="text-align: center; margin: 28px 0;">
                  <a href="https://freeconnect.lovable.app/open-needs" 
                     style="display: inline-block; background: #111; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500;">
                    Voir les opportunités
                  </a>
                </div>
                
                <p style="font-size: 13px; color: #999; text-align: center; margin-top: 32px;">
                  Connect2 — Le réseau des recruteurs freelances
                </p>
              </div>
            `,
          }),
        });
        sent++;
      } catch (emailErr) {
        console.error(`Failed to send email to ${profile.email}:`, emailErr);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-matching error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
