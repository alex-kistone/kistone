import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { FullProfile } from "./ProfileDetailModal";

interface ClientNeed {
  id: string;
  job_title: string;
  company_name: string;
  mission_location: string;
  profile_types: string[];
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
  status: string;
}

interface SuggestToClientDialogProps {
  profile: FullProfile;
  open: boolean;
  onClose: () => void;
}

const SuggestToClientDialog = ({ profile, open, onClose }: SuggestToClientDialogProps) => {
  const { toast } = useToast();
  const [needs, setNeeds] = useState<ClientNeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadNeeds();
      setSelectedNeeds([]);
    }
  }, [open]);

  const loadNeeds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_needs")
      .select("id, job_title, company_name, mission_location, profile_types, budget_tjm_min, budget_tjm_max, status")
      .in("status", ["pending", "active", "open"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading needs:", error);
      toast({ title: "Erreur", description: "Impossible de charger les besoins.", variant: "destructive" });
    } else {
      setNeeds((data as ClientNeed[]) || []);
    }
    setLoading(false);
  };

  const toggleNeed = (needId: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(needId) ? prev.filter((id) => id !== needId) : [...prev, needId]
    );
  };

  const handleSubmit = async () => {
    if (selectedNeeds.length === 0) return;
    setSubmitting(true);

    try {
      // Build suggestions for each selected need
      const suggestions = selectedNeeds.map((needId) => ({
        need_id: needId,
        recruiter_profile_id: profile.id,
        anonymous_label: profile.first_name,
        match_score: 100,
        match_reasons: ["Suggestion manuelle par l'admin"],
        super_tam: profile.super_tam || false,
      }));

      const { error: insertError } = await supabase
        .from("profile_suggestions")
        .insert(suggestions);

      if (insertError) throw insertError;

      // Notify clients via edge function
      const { error: notifyError } = await supabase.functions.invoke("notify-suggestion", {
        body: { need_ids: selectedNeeds, profile_first_name: profile.first_name },
      });

      if (notifyError) console.error("Notification error (non-blocking):", notifyError);

      toast({
        title: "Profil suggéré",
        description: `${profile.first_name} a été suggéré sur ${selectedNeeds.length} besoin${selectedNeeds.length > 1 ? "s" : ""}.`,
      });
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({ title: "Erreur", description: err.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Suggérer {profile.first_name} {profile.last_name}</DialogTitle>
          <DialogDescription>Sélectionnez les besoins clients sur lesquels pousser ce profil.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : needs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucun besoin client ouvert.</p>
        ) : (
          <div className="space-y-2">
            {needs.map((need) => {
              const checked = selectedNeeds.includes(need.id);
              return (
                <label
                  key={need.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleNeed(need.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{need.job_title}</span>
                      <Badge variant="secondary" className="text-[10px]">{need.company_name}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {need.mission_location}
                      </span>
                      {need.budget_tjm_max && (
                        <span>Budget: {need.budget_tjm_min || "?"}–{need.budget_tjm_max}€/j</span>
                      )}
                    </div>
                    {need.profile_types && need.profile_types.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {need.profile_types.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selectedNeeds.length === 0 || submitting}
            className="gap-1.5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Suggérer ({selectedNeeds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestToClientDialog;
