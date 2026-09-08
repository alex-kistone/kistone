import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface WhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientPhone: string | null | undefined;
}

export function WhatsAppDialog({ open, onOpenChange, recipientName, recipientPhone }: WhatsAppDialogProps) {
  const [message, setMessage] = useState(`Bonjour ${recipientName.split(" ")[0] || ""}, `);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!recipientPhone) {
      toast.error("Aucun numéro de téléphone pour ce candidat");
      return;
    }
    if (!message.trim()) {
      toast.error("Le message est vide");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { to: recipientPhone, message: message.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Message WhatsApp envoyé");
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp à {recipientName}</DialogTitle>
          <DialogDescription>
            {recipientPhone ? (
              <>Numéro : <span className="font-mono">{recipientPhone}</span></>
            ) : (
              <span className="text-destructive">Aucun numéro de téléphone renseigné pour ce candidat.</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="wa-message">Message</Label>
          <Textarea
            id="wa-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre message..."
            disabled={!recipientPhone || sending}
          />
          <p className="text-xs text-muted-foreground">{message.length} / 1500 caractères</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={!recipientPhone || sending || !message.trim()}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
