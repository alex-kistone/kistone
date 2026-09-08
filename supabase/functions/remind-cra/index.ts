import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendKey ? new Resend(resendKey) : null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const dayOfMonth = now.getDate();

    // Get last day of current month
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const daysBeforeEnd = lastDay - dayOfMonth;

    // Only send reminders at J-5 or J-1
    const isFirstReminder = daysBeforeEnd === 5;
    const isLastReminder = daysBeforeEnd === 1;

    if (!isFirstReminder && !isLastReminder) {
      return new Response(JSON.stringify({ message: "Not a reminder day", daysBeforeEnd }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active missions
    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("id, recruiter_profile_id, title, company_name, suggestion_id, need_id")
      .eq("status", "active");

    if (missionsError) throw missionsError;
    if (!missions || missions.length === 0) {
      return new Response(JSON.stringify({ message: "No active missions" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing timesheets for this month that are already submitted+
    const recruiterIds = [...new Set(missions.map((m: any) => m.recruiter_profile_id))];
    const { data: existingTs } = await supabase
      .from("timesheets")
      .select("recruiter_profile_id, status")
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .in("recruiter_profile_id", recruiterIds)
      .in("status", ["submitted", "client_approved", "client_rejected", "admin_invoiced"]);

    const alreadySubmitted = new Set((existingTs || []).map((t: any) => t.recruiter_profile_id));

    // Filter to freelancers who haven't submitted
    const needsReminder = missions.filter((m: any) => !alreadySubmitted.has(m.recruiter_profile_id));

    if (needsReminder.length === 0) {
      return new Response(JSON.stringify({ message: "All freelancers have submitted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get freelancer emails
    const reminderProfileIds = [...new Set(needsReminder.map((m: any) => m.recruiter_profile_id))];
    const { data: profiles } = await supabase
      .from("recruiter_profiles")
      .select("id, email, first_name")
      .in("id", reminderProfileIds);

    const profileMap: Record<string, { email: string; first_name: string }> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = { email: p.email, first_name: p.first_name };
    });

    const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const monthName = MONTH_NAMES[currentMonth - 1];

    const emailsSent: string[] = [];
    const errors: string[] = [];

    for (const mission of needsReminder) {
      const profile = profileMap[mission.recruiter_profile_id];
      if (!profile?.email) continue;

      const subject = isLastReminder
        ? `⚠️ Dernier rappel : CRA ${monthName} à soumettre demain`
        : `📋 Rappel : pensez à remplir votre CRA de ${monthName}`;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Bonjour ${profile.first_name},</h2>
          <p style="color: #555; line-height: 1.6;">
            ${isLastReminder
              ? `<strong>Dernier rappel !</strong> Votre CRA pour le mois de <strong>${monthName} ${currentYear}</strong> doit être soumis avant la fin du mois.`
              : `Pensez à remplir et soumettre votre CRA pour le mois de <strong>${monthName} ${currentYear}</strong>.`
            }
          </p>
          <p style="color: #555; line-height: 1.6;">
            Mission : <strong>${mission.title}</strong> — ${mission.company_name}
          </p>
          <p style="color: #555; line-height: 1.6;">
            Connectez-vous à votre espace pour compléter votre compte-rendu d'activité.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Cet email est envoyé automatiquement par Connect2.
          </p>
        </div>
      `;

      if (resend) {
        try {
          await resend.emails.send({
            from: "Connect2 <noreply@connect2.io>",
            to: [profile.email],
            subject,
            html,
          });
          emailsSent.push(profile.email);
        } catch (e: any) {
          errors.push(`${profile.email}: ${e.message}`);
        }
      } else {
        console.log(`[DRY RUN] Would send to ${profile.email}: ${subject}`);
        emailsSent.push(`[dry] ${profile.email}`);
      }
    }

    return new Response(JSON.stringify({
      message: `${isLastReminder ? "Last" : "First"} reminder sent`,
      emailsSent,
      errors,
      totalMissions: missions.length,
      needsReminder: needsReminder.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in remind-cra:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
