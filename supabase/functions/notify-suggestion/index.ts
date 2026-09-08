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

    const { need_ids, profile_first_name } = await req.json();
    if (!need_ids || !Array.isArray(need_ids) || need_ids.length === 0) {
      return new Response(JSON.stringify({ error: "need_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get needs with their owner info
    const { data: needs, error: needsError } = await supabase
      .from("client_needs")
      .select("id, job_title, company_name, user_id, contact_email, contact_name")
      .in("id", need_ids);

    if (needsError || !needs || needs.length === 0) {
      console.log("No needs found for ids:", need_ids);
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by client (user_id) to send one email per client
    const clientMap = new Map<string, { email: string; name: string; jobs: string[] }>();

    for (const need of needs) {
      const key = need.user_id;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          email: need.contact_email,
          name: need.contact_name || "Client",
          jobs: [],
        });
      }
      clientMap.get(key)!.jobs.push(need.job_title);
    }

    const results: string[] = [];

    for (const [, client] of clientMap) {
      const jobList = client.jobs.map((j) => `<li>${j}</li>`).join("");

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Connect2 <no-reply@connect2.ai>",
          to: [client.email],
          subject: `Nouveau profil suggéré pour votre besoin`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Bonjour ${client.name} 👋</h2>
              <p style="color: #444;">Un nouveau profil (<strong>${profile_first_name}</strong>) vient d'être suggéré pour :</p>
              <ul style="color: #333; margin: 12px 0;">${jobList}</ul>
              <a href="https://connect2.ai/client" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-top: 8px;">Voir les suggestions</a>
            </div>
          `,
        }),
      });

      const emailData = await emailRes.json();
      if (!emailRes.ok) {
        console.error("Resend error for", client.email, emailData);
      } else {
        results.push(client.email);
        console.log("Suggestion notification sent to", client.email);
      }
    }

    return new Response(JSON.stringify({ success: true, notified: results }), {
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
