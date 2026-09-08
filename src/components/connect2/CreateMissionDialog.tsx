import { useState } from "react";
import { CalendarIcon, MapPin, Euro, Clock, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateMissionDialogProps {
  open: boolean;
  onClose: () => void;
  suggestionId: string;
  needId: string;
  recruiterProfileId: string;
  recruiterName: string;
  recruiterTjm: number | null;
  needTitle: string;
  companyName: string;
  missionLocation: string;
  onMissionCreated: () => void;
}

const CreateMissionDialog = ({
  open,
  onClose,
  suggestionId,
  needId,
  recruiterProfileId,
  recruiterName,
  recruiterTjm,
  needTitle,
  companyName,
  missionLocation,
  onMissionCreated,
}: CreateMissionDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [durationText, setDurationText] = useState("");
  const [location, setLocation] = useState(missionLocation);
  const [tjmRecruiter, setTjmRecruiter] = useState(recruiterTjm || 0);
  const margin = 100;
  const tjmClient = tjmRecruiter + margin;

  const handleSubmit = async () => {
    if (!startDate) {
      toast({ title: "Date de début requise", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Create the mission
      const { error: missionError } = await supabase
        .from("missions" as any)
        .insert({
          suggestion_id: suggestionId,
          need_id: needId,
          recruiter_profile_id: recruiterProfileId,
          title: needTitle,
          company_name: companyName,
          location,
          recruiter_tjm: tjmRecruiter,
          client_tjm: tjmClient,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
          duration_text: durationText || null,
          status: "active",
          created_by: session.user.id,
        });

      if (missionError) throw missionError;

      // 2. Update the need status to "staffed"
      await supabase
        .from("client_needs" as any)
        .update({ status: "staffed" })
        .eq("id", needId);

      // 3. Update pipeline status to "validated"
      await supabase
        .from("profile_suggestions" as any)
        .update({ pipeline_status: "validated", status_updated_at: new Date().toISOString() })
        .eq("id", suggestionId);

      toast({ title: "Mission créée !", description: `${recruiterName} est staffé(e) sur ${needTitle}.` });
      onMissionCreated();
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
          <DialogTitle>Créer la mission</DialogTitle>
          <DialogDescription>
            Validez {recruiterName} sur le besoin « {needTitle} » pour {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Candidate info */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{recruiterName}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{needTitle} — {companyName}</p>
          </div>

          {/* TJM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">TJM Freelance</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={tjmRecruiter}
                  onChange={(e) => setTjmRecruiter(Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">TJM Client (+{margin}€)</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={tjmClient}
                  readOnly
                  className="pl-9 bg-muted"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-xs">Lieu de mission</Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="pl-9" />
            </div>
          </div>

          {/* Start date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("mt-1 w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">Date de fin (optionnel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("mt-1 w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Duration text */}
          <div>
            <Label className="text-xs">Durée (texte libre)</Label>
            <div className="relative mt-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={durationText}
                onChange={(e) => setDurationText(e.target.value)}
                placeholder="ex: 3 mois renouvelable"
                className="pl-9"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving || !startDate}>
              {saving ? "Création..." : "Créer la mission"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMissionDialog;
