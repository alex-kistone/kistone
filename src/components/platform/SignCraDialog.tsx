import { useEffect, useState } from "react";
import { Loader2, Mail, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { craSign, dayCount, euro } from "@/lib/cra";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timesheetId: string;
  monthLabel: string;
  totalDays: number;
  amountHt: number;
  expensesHt: number;
  defaultName: string;
  onSigned: (result: { signed_at: string; reference: string }) => void;
}

/**
 * Validation d'un CRA par le client : nom, certification, code à usage unique reçu par email.
 * La preuve (PDF horodaté et haché) est produite côté serveur par la fonction cra-sign.
 */
export default function SignCraDialog({ open, onOpenChange, timesheetId, monthLabel, totalDays, amountHt, expensesHt, defaultName, onSigned }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState(defaultName);
  const [comment, setComment] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState<"code" | "sign" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setComment("");
      setAccepted(false);
      setCode("");
      setSentTo(null);
      setError(null);
    }
  }, [open, defaultName]);

  const requestCode = async () => {
    setBusy("code");
    setError(null);
    try {
      const res = await craSign<{ sent_to: string }>({ action: "request_code", timesheet_id: timesheetId });
      setSentTo(res.sent_to);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const sign = async () => {
    setBusy("sign");
    setError(null);
    try {
      const res = await craSign<{ signed_at: string; reference: string }>({
        action: "sign", timesheet_id: timesheetId, code, full_name: name.trim(), accepted, comment: comment.trim() || undefined,
      });
      toast({ title: "CRA validé et signé", description: `Référence ${res.reference}. La preuve est disponible sur le CRA.` });
      onSigned(res);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const ready = name.trim().length >= 3 && accepted;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PenLine className="h-5 w-5" aria-hidden="true" /> Valider le CRA de {monthLabel}</DialogTitle>
          <DialogDescription>
            {dayCount(totalDays)} · {euro(amountHt)} HT{expensesHt > 0 ? ` + ${euro(expensesHt)} HT de frais` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sign-name">Votre nom complet</Label>
            <Input id="sign-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" disabled={!!sentTo} />
          </div>
          <div>
            <Label htmlFor="sign-comment">Commentaire sur la mission (facultatif)</Label>
            <Textarea id="sign-comment" rows={2} className="resize-none" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <label htmlFor="sign-accept" className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <Checkbox id="sign-accept" aria-describedby="sign-accept-text" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} disabled={!!sentTo} className="mt-0.5" />
            <span id="sign-accept-text">Je certifie l'exactitude des jours et des frais déclarés et je valide ce CRA. Cette validation vaut signature électronique.</span>
          </label>

          {sentTo ? (
            <div className="space-y-2">
              <Label htmlFor="sign-code">Code reçu à {sentTo}</Label>
              <InputOTP id="sign-code" maxLength={6} value={code} onChange={setCode} inputMode="numeric" autoFocus>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
              <button type="button" className="text-xs text-muted-foreground underline underline-offset-2" onClick={requestCode} disabled={!!busy}>
                Renvoyer un code
              </button>
            </div>
          ) : null}

          {error ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!busy}>Annuler</Button>
          {sentTo ? (
            <Button onClick={sign} disabled={!ready || code.length !== 6 || !!busy} className="gap-2">
              {busy === "sign" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PenLine className="h-4 w-4" aria-hidden="true" />}
              Signer et valider
            </Button>
          ) : (
            <Button onClick={requestCode} disabled={!ready || !!busy} className="gap-2">
              {busy === "code" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
              Recevoir le code par email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
