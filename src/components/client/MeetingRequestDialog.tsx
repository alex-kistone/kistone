import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Target = { id: string; first_name: string } | null;

const HOUR = 3_600_000;

/** Créneau par défaut : jour ouvré suivant (au moins 2 jours), à 10h. */
function defaultSlot(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Le client propose 1 à 3 créneaux de 30 minutes à un freelance, avec un message. */
export default function MeetingRequestDialog({ freelance, onOpenChange }: { freelance: Target; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [slots, setSlots] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (freelance) { setSlots([defaultSlot(2), defaultSlot(3), defaultSlot(4)]); setMessage(""); setError(null); }
  }, [freelance]);

  const send = async () => {
    if (!freelance) return;
    const dates = slots.filter(Boolean).map((s) => new Date(s));
    if (dates.length === 0) return setError("Proposez au moins un créneau.");
    if (dates.some((d) => isNaN(d.getTime()) || d.getTime() < Date.now() + 2 * HOUR)) return setError("Chaque créneau doit être dans plus de 2 heures.");
    if (new Set(dates.map((d) => d.getTime())).size !== dates.length) return setError("Deux créneaux sont identiques.");
    setSending(true);
    const { error: e } = await supabase.from("meeting_requests" as never).insert({
      recruiter_profile_id: freelance.id,
      slots: dates.map((d) => d.toISOString()),
      message: message.trim() || null,
    } as never);
    setSending(false);
    if (e) {
      setError(e.code === "23505" ? `Vous avez déjà une demande en attente avec ${freelance.first_name}.` : e.message);
      return;
    }
    toast({ title: "Demande envoyée", description: `${freelance.first_name} reçoit un email et choisit un créneau. Vous serez prévenu de sa réponse.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!freelance} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5" />Proposer une visio à {freelance?.first_name}</DialogTitle>
          <DialogDescription>
            Proposez jusqu'à 3 créneaux de 30 minutes (heure de Paris). {freelance?.first_name} en choisit un ; le lien de visio vous est
            alors envoyé à tous les deux.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Créneaux</Label>
          {slots.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input type="datetime-local" step={900} value={s} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? e.target.value : x)))} />
              {slots.length > 1 && (
                <Button variant="ghost" size="icon" aria-label="Retirer ce créneau" onClick={() => setSlots(slots.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
          {slots.length < 3 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSlots([...slots, defaultSlot(slots.length + 2)])}><Plus className="h-4 w-4" />Ajouter un créneau</Button>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mr-msg">Message (facultatif)</Label>
          <Textarea id="mr-msg" rows={4} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Le poste, le contexte, ce que vous aimeriez aborder…" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" asChild><Link to="/client/visios">Mes visios</Link></Button>
          <Button onClick={send} disabled={sending}>{sending ? "Envoi…" : "Envoyer la demande"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
