import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { KycParty } from "@/lib/kyc";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party: KycParty;
  userId: string;
  missionTitle: string;
};

/** Message de relance pré-rempli avec la liste de ce qui manque au dossier. */
export function reminderMessage(firstName: string, missionTitle: string, missing: string[], party: KycParty): string {
  const where = party === "client" ? "« Mon dossier »" : "« Mon administratif »";
  const list = missing.length
    ? `Pour démarrer la mission « ${missionTitle} », il nous manque encore :\n${missing.map((m) => `- ${m}`).join("\n")}`
    : `Pour démarrer la mission « ${missionTitle} », merci de vérifier votre dossier et de l'envoyer pour validation.`;
  return `Bonjour${firstName ? ` ${firstName}` : ""},\n\n${list}\n\nVous pouvez compléter ces éléments depuis votre espace Kistone, rubrique ${where}.\n\nMerci,\nL'équipe Kistone`;
}

/**
 * Relance d'un client ou d'un freelance depuis la mise en place d'une mission : l'admin relit
 * et ajuste le message, envoyé en notification et par email.
 */
export default function DossierReminderDialog({ open, onOpenChange, party, userId, missionTitle }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      setTitle(`Mission « ${missionTitle} » : votre dossier est à compléter`);
      const table = party === "client" ? "client_profiles" : "recruiter_profiles";
      const [{ data: missing }, { data: profile }] = await Promise.all([
        supabase.rpc("kyc_missing_items" as never, { _user_id: userId, _party: party } as never),
        supabase.from(table as never).select("first_name").eq("user_id", userId).maybeSingle(),
      ]);
      if (!active) return;
      const firstName = (profile as { first_name?: string } | null)?.first_name?.trim() ?? "";
      setMessage(reminderMessage(firstName, missionTitle, (missing as string[] | null) ?? [], party));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [open, party, userId, missionTitle]);

  const send = async () => {
    setSending(true);
    const { error } = await supabase.rpc("send_dossier_reminder" as never, {
      _user_id: userId, _party: party, _title: title, _message: message,
    } as never);
    if (error) {
      setSending(false);
      toast({ title: "Relance impossible", description: error.message, variant: "destructive" });
      return;
    }
    // Envoi immédiat de l'email (sinon il part au prochain passage automatique, sous 5 minutes)
    await supabase.functions.invoke("notify-dispatch", { body: {} }).catch(() => undefined);
    setSending(false);
    onOpenChange(false);
    toast({ title: "Relance envoyée", description: `Le ${party === "client" ? "client" : "freelance"} la reçoit par email et dans ses notifications.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Relancer le {party === "client" ? "client" : "freelance"}</DialogTitle>
          <DialogDescription>
            Le message liste ce qui manque à son dossier. Ajustez-le si besoin : il part par email et dans ses notifications.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Préparation du message…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-title">Objet</Label>
              <Input id="reminder-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-message">Message</Label>
              <Textarea id="reminder-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={12} className="font-sans text-sm" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={send} disabled={loading || sending || !message.trim()} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer la relance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
