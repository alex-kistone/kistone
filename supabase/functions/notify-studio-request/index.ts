const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NOTIFY_TO = "aguego@kistone.fr";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const body = await req.json();
    const {
      theme,
      project_type,
      existing_project,
      description,
      first_name,
      last_name,
      email,
      phone,
    } = body ?? {};

    const fullName = `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Prospect";
    const esc = (s: unknown) =>
      String(s ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color:#1a1a1a;">
        <h2>Nouveau projet Studio</h2>
        <p><strong>${esc(fullName)}</strong> vient de soumettre une demande.</p>
        <table style="border-collapse:collapse; width:100%; margin-top:12px;">
          <tr><td style="padding:6px 0;"><strong>Thème</strong></td><td>${esc(theme)}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Type de projet</strong></td><td>${esc(project_type)}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Projet existant</strong></td><td>${esc(existing_project)}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Email</strong></td><td>${esc(email)}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Téléphone</strong></td><td>${esc(phone)}</td></tr>
        </table>
        <h3 style="margin-top:20px;">Description</h3>
        <div style="background:#f4f4f5;border-radius:8px;padding:14px;white-space:pre-wrap;">${esc(description)}</div>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kistone Studio <no-reply@connect2.ai>",
        to: [NOTIFY_TO],
        reply_to: email || undefined,
        subject: `Nouveau projet Studio – ${fullName}`,
        html,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      throw new Error(`Resend API error [${emailRes.status}]: ${JSON.stringify(emailData)}`);
    }

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
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
