import { useState } from "react";
import { CalendarIcon, Euro, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  title: string;
  company_name: string;
  recruiter_name: string;
  recruiter_tjm: number;
  client_tjm: number;
  end_date: string | null;
  duration_text: string | null;
}

interface ExtendMissionDialogProps {
  open: boolean;
  onClose: () => void;
  mission: Mission;
  onExtended: () => void;
}

const ExtendMissionDialog = ({ open, onClose, mission, onExtended }: ExtendMissionDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(
    mission.end_date ? new Date(mission.end_date) : undefined
  );
  const [newDurationText, setNewDurationText] = useState(mission.duration_text || "");
  const [newTjmRecruiter, setNewTjmRecruiter] = useState(mission.recruiter_tjm);
  const margin = 100;
  const newTjmClient = newTjmRecruiter + margin;
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!newEndDate) {
      toast({ title: "Nouvelle date de fin requise", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Log extension in history
      await supabase.from("mission_extensions" as any).insert({
        mission_id: mission.id,
        previous_end_date: mission.end_date,
        new_end_date: format(newEndDate, "yyyy-MM-dd"),
        previous_duration_text: mission.duration_text,
        new_duration_text: newDurationText || null,
        previous_recruiter_tjm: mission.recruiter_tjm,
        new_recruiter_tjm: newTjmRecruiter,
        previous_client_tjm: mission.client_tjm,
        new_client_tjm: newTjmClient,
        reason: reason || null,
        created_by: session.user.id,
      });

      // 2. Update the mission
      await supabase.from("missions" as any).update({
        end_date: format(newEndDate, "yyyy-MM-dd"),
        duration_text: newDurationText || null,
        recruiter_tjm: newTjmRecruiter,
        client_tjm: newTjmClient,
      }).eq("id", mission.id);

      toast({ title: "Mission prolongée !", description: `Nouvelle fin : ${format(newEndDate, "dd/MM/yyyy")}` });
      onExtended();
      onClose();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" /> Prolonger la mission
          </DialogTitle>
          <DialogDescription>
            {mission.recruiter_name} — {mission.title} ({mission.company_name})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Current end date info */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">Fin actuelle : </span>
            <span className="font-semibold">
              {mission.end_date ? new Date(mission.end_date).toLocaleDateString("fr-FR") : "Non définie"}
            </span>
            {mission.duration_text && (
              <span className="text-muted-foreground"> · {mission.duration_text}</span>
            )}
          </div>

          {/* New end date */}
          <div>
            <Label className="text-xs">Nouvelle date de fin *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("mt-1 w-full justify-start text-left font-normal", !newEndDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? format(newEndDate, "dd/MM/yyyy") : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration text */}
          <div>
            <Label className="text-xs">Durée (texte libre)</Label>
            <div className="relative mt-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={newDurationText}
                onChange={(e) => setNewDurationText(e.target.value)}
                placeholder="ex: 3 mois supplémentaires"
                className="pl-9"
              />
            </div>
          </div>

          {/* TJM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">TJM Freelance</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={newTjmRecruiter}
                  onChange={(e) => setNewTjmRecruiter(Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">TJM Client (+{margin}€)</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" value={newTjmClient} readOnly className="pl-9 bg-muted" />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label className="text-xs">Motif / commentaire (optionnel)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ex: Besoin prolongé suite à nouveau périmètre"
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving || !newEndDate} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {saving ? "En cours..." : "Prolonger"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtendMissionDialog;
