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
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { receiver_id, sender_id, content } = record;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up receiver email from recruiter_profiles OR client_profiles
    let receiverEmail: string | null = null;
    let recipientName = "Utilisateur";

    const { data: recruiterReceiver } = await supabase
      .from("recruiter_profiles")
      .select("email, first_name")
      .eq("user_id", receiver_id)
      .maybeSingle();

    if (recruiterReceiver?.email) {
      receiverEmail = recruiterReceiver.email;
      recipientName = recruiterReceiver.first_name || "Recruteur";
    } else {
      const { data: clientReceiver } = await supabase
        .from("client_profiles")
        .select("email, first_name")
        .eq("user_id", receiver_id)
        .maybeSingle();

      if (clientReceiver?.email) {
        receiverEmail = clientReceiver.email;
        recipientName = clientReceiver.first_name || "Client";
      } else {
        // Check if receiver is an admin via auth.users
        const { data: { user: adminUser } } = await supabase.auth.admin.getUserById(receiver_id);
        if (adminUser?.email) {
          receiverEmail = adminUser.email;
          recipientName = "Admin";
        }
      }
    }

    // Look up sender name from recruiter_profiles OR client_profiles
    let senderName = "Connect2";

    const { data: recruiterSender } = await supabase
      .from("recruiter_profiles")
      .select("first_name, last_name")
      .eq("user_id", sender_id)
      .maybeSingle();

    if (recruiterSender) {
      senderName = `${recruiterSender.first_name} ${recruiterSender.last_name}`;
    } else {
      const { data: clientSender } = await supabase
        .from("client_profiles")
        .select("first_name, last_name")
        .eq("user_id", sender_id)
        .maybeSingle();

      if (clientSender) {
        senderName = `${clientSender.first_name} ${clientSender.last_name}`;
      }
    }

    if (!receiverEmail) {
      console.log("No email found for receiver:", receiver_id);
      return new Response(JSON.stringify({ skipped: true, reason: "no email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Connect2 <no-reply@connect2.ai>",
        to: [receiverEmail],
        subject: `Nouveau message de ${senderName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Bonjour ${recipientName} 👋</h2>
            <p style="color: #444;">Vous avez reçu un nouveau message de <strong>${senderName}</strong> :</p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #333;">${content}</p>
            </div>
            <a href="https://connect2.ai/profile" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-top: 8px;">Répondre sur Connect2</a>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      throw new Error(`Resend API error [${emailRes.status}]: ${JSON.stringify(emailData)}`);
    }

    console.log("Email sent to", receiverEmail);

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
