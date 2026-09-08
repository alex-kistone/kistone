import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const { thread_id } = (await req.json()) ?? {};
    if (typeof thread_id !== "string" || thread_id.length < 10) {
      return new Response(JSON.stringify({ error: "thread_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: thread } = await admin
      .from("support_threads")
      .select("id, title, user_id")
      .eq("id", thread_id)
      .maybeSingle();

    const { data: msgs } = await admin
      .from("support_messages")
      .select("role, content, created_at")
      .eq("thread_id", thread_id)
      .order("created_at", { ascending: false })
      .limit(6);

    let email = "—";
    if (thread?.user_id) {
      const { data: userRes } = await admin.auth.admin.getUserById(thread.user_id);
      email = userRes?.user?.email ?? "—";
    }

    const esc = (s: unknown) =>
      String(s ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const transcript = (msgs ?? [])
      .slice()
      .reverse()
      .map(
        (m) =>
          `<p style="margin:6px 0;"><strong>${
            m.role === "user" ? "Visiteur" : m.role === "human" ? "Équipe" : "Assistant"
          }</strong><br/>${esc(m.content)}</p>`,
      )
      .join("");

    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color:#1a1a1a;">
        <h2>Demande de contact humain — Assistant Kistone</h2>
        <p><strong>${esc(email)}</strong> souhaite parler à un humain.</p>
        <p><strong>Conversation :</strong> ${esc(thread?.title)}</p>
        <div style="background:#f4f4f5;border-radius:8px;padding:14px;">${transcript}</div>
        <p style="margin-top:16px;">
          <a href="https://kistone.fr/dashboard?tab=assistant">Répondre depuis le dashboard</a>
        </p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Assistant Kistone <no-reply@connect2.ai>",
        to: [NOTIFY_TO],
        subject: "🙋 Un visiteur demande un humain (assistant)",
        html,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error("resend error", emailRes.status, text);
      return new Response(JSON.stringify({ error: "email non envoyé" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-support-escalation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
