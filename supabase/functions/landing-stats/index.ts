import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Recruteurs disponibles
    const { count: availableCount } = await supabase
      .from("recruiter_profiles")
      .select("*", { count: "exact", head: true })
      .eq("available", true);

    // 2. Missions réalisées
    const { count: missionCount } = await supabase
      .from("missions")
      .select("*", { count: "exact", head: true });

    // 3. % besoins pourvus (needs with at least one active mission / total needs)
    const { count: totalNeeds } = await supabase
      .from("client_needs")
      .select("*", { count: "exact", head: true });

    const { data: needsWithMissions } = await supabase
      .from("missions")
      .select("need_id")
      .in("status", ["active", "completed"]);

    const uniqueNeedsWithMissions = new Set(needsWithMissions?.map((m) => m.need_id) || []);
    const fulfillmentRate = totalNeeds && totalNeeds > 0
      ? Math.round((uniqueNeedsWithMissions.size / totalNeeds) * 100)
      : 0;

    // 4. Note moyenne des recruteurs (admin_rating > 0)
    const { data: ratings } = await supabase
      .from("recruiter_profiles")
      .select("admin_rating")
      .gt("admin_rating", 0);

    let avgRating = 0;
    if (ratings && ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + (r.admin_rating || 0), 0);
      avgRating = Math.round((sum / ratings.length) * 10) / 10;
    }

    const stats = {
      available_freelancers: availableCount || 0,
      missions_completed: missionCount || 0,
      fulfillment_rate: fulfillmentRate,
      avg_rating: avgRating,
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
