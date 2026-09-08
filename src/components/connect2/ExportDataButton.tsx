import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExportDataButtonProps {
  userId: string | null;
  profileType: "freelance" | "client";
}

const ExportDataButton = ({ userId, profileType }: ExportDataButtonProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!userId) return;
    setExporting(true);

    try {
      const data: Record<string, any> = {};

      if (profileType === "freelance") {
        const { data: profile } = await supabase
          .from("recruiter_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        data.profil = profile;

        const profileId = profile?.id;
        if (profileId) {
          const { data: timesheets } = await supabase
            .from("timesheets")
            .select("*, timesheet_days(*)")
            .eq("recruiter_profile_id", profileId);
          data.comptes_rendus = timesheets;

          const { data: missions } = await supabase
            .from("missions")
            .select("*")
            .eq("recruiter_profile_id", profileId);
          data.missions = missions;
        }
      } else {
        const { data: profile } = await supabase
          .from("client_profiles" as any)
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        data.profil = profile;

        const { data: needs } = await supabase
          .from("client_needs")
          .select("*")
          .eq("user_id", userId);
        data.besoins = needs;
      }

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: true });
      data.messages = messages;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `connect2-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export réussi", description: "Vos données ont été téléchargées." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-2 text-xs">
      {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Exporter mes données
    </Button>
  );
};

export default ExportDataButton;
