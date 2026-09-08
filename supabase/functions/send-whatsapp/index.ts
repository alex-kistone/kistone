import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

const BodySchema = z.object({
  to: z.string().min(5).max(20),
  message: z.string().min(1).max(1500),
});

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeWhatsappPhone = (value: string) => {
  const stripped = value.trim().replace(/^whatsapp:/i, "").replace(/[\s().-]/g, "");
  const normalized = stripped.startsWith("+") ? stripped : `+${stripped}`;

  if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
    return null;
  }

  return normalized;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: ensure caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return json({ error: "Missing authorization" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY not configured");
    if (!TWILIO_WHATSAPP_FROM) {
      return json({
        error:
          "TWILIO_WHATSAPP_FROM secret missing. Add your Twilio WhatsApp number (e.g. +14155238886 for sandbox).",
      }, 500);
    }

    const toFormatted = normalizeWhatsappPhone(parsed.data.to);
    if (!toFormatted) {
      return json({
        error: "Le numéro destinataire WhatsApp est invalide. Utilisez le format international, ex: +33612345678.",
      }, 400);
    }

    const fromFormatted = normalizeWhatsappPhone(TWILIO_WHATSAPP_FROM);
    if (!fromFormatted) {
      return json({
        error:
          "TWILIO_WHATSAPP_FROM est invalide. Configurez un numéro WhatsApp Twilio au format +14155238886 ou whatsapp:+14155238886.",
      }, 500);
    }

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:${toFormatted}`,
        From: `whatsapp:${fromFormatted}`,
        Body: parsed.data.message,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Twilio error", response.status, data);
      if (data?.code === 21212) {
        return json({
          error:
            "Le numéro expéditeur WhatsApp Twilio est invalide. Vérifiez le secret TWILIO_WHATSAPP_FROM avec votre numéro sandbox ou business Twilio.",
          details: data,
        }, 500);
      }

      return json({ error: data?.message || "Twilio error", details: data }, 502);
    }

    return json({ success: true, sid: data.sid }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("send-whatsapp error:", msg);
    return json({ error: msg }, 500);
  }
});
