import { useState } from "react";
import { Download, FileSignature, Lock, Paperclip, Receipt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { craSign, dayCount, euro, EXPENSE_CATEGORIES, openCraProof, type TimesheetExpense, type TimesheetSignature } from "@/lib/cra";
import { frDate, openPrivateFile } from "@/components/platform/admin/adv";

/** Montants figés à la validation (table réservée à l'admin). */
export interface TimesheetRates {
  timesheet_id: string;
  client_tjm: number;
  freelance_tjm: number;
  total_days: number;
  client_amount: number;
  freelance_amount: number;
  expenses_ht: number;
  expenses_vat: number;
  frozen_at: string;
}

/** Date et heure de Paris, ex. « 12/10/2026 à 14:32 ». */
const frDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }).replace(" ", " à ");

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="break-words text-sm font-medium">{children}</dd>
  </div>
);

export function SignatureSection({ timesheetId, signature }: { timesheetId: string; signature: TimesheetSignature }) {
  const { toast } = useToast();
  const [opening, setOpening] = useState(false);

  const downloadProof = async () => {
    setOpening(true);
    const err = await openCraProof(timesheetId);
    setOpening(false);
    if (err) toast({ title: "Preuve indisponible", description: err, variant: "destructive" });
  };

  return (
    <section className="mt-6 space-y-3 border-t border-border pt-4" aria-labelledby="cra-validation-title">
      <h4 id="cra-validation-title" className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4" /> Validation
      </h4>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Row label="Signataire">{signature.signer_name}</Row>
        <Row label="Email">{signature.signer_email}</Row>
        <Row label="Date">{frDateTime(signature.signed_at)}</Row>
        <Row label="Méthode">
          {signature.method === "admin"
            ? `Validation de secours : ${signature.certificate?.reason || "—"}`
            : "Code par email"}
        </Row>
        {signature.certificate?.reference && <Row label="Référence">{signature.certificate.reference}</Row>}
        <Row label="Empreinte SHA-256">
          <span className="block truncate font-mono text-xs" title={signature.document_sha256}>
            {signature.document_sha256}
          </span>
        </Row>
      </dl>
      <Button variant="outline" size="sm" className="gap-2" onClick={downloadProof} disabled={opening}>
        <Download className="h-4 w-4" /> Télécharger la preuve
      </Button>
    </section>
  );
}

export function FrozenRatesSection({ rates }: { rates: TimesheetRates }) {
  const clientAmount = Number(rates.client_amount);
  const freelanceAmount = Number(rates.freelance_amount);
  const vat = Number(rates.expenses_vat);
  return (
    <section className="mt-6 space-y-3 border-t border-border pt-4" aria-labelledby="cra-rates-title">
      <h4 id="cra-rates-title" className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="h-4 w-4" /> Montants figés
      </h4>
      <dl className="grid grid-cols-2 gap-3">
        <Row label="TJM client">{euro(Number(rates.client_tjm))}</Row>
        <Row label="TJM freelance">{euro(Number(rates.freelance_tjm))}</Row>
        <Row label="Jours">{dayCount(Number(rates.total_days))}</Row>
        <Row label="Montant client HT">{euro(clientAmount)}</Row>
        <Row label="Montant freelance HT">{euro(freelanceAmount)}</Row>
        <Row label="Marge">{euro(clientAmount - freelanceAmount)}</Row>
        <Row label="Frais HT">
          {euro(Number(rates.expenses_ht))}
          {vat > 0 && <span className="font-normal text-muted-foreground"> + {euro(vat)} TVA</span>}
        </Row>
        <Row label="Gelé le">{frDate(rates.frozen_at)}</Row>
      </dl>
    </section>
  );
}

export function ExpensesSection({ expenses }: { expenses: TimesheetExpense[] }) {
  const { toast } = useToast();
  if (expenses.length === 0) return null;
  const totalHt = expenses.reduce((s, e) => s + Number(e.amount_ht), 0);
  const totalVat = expenses.reduce((s, e) => s + Number(e.vat_amount), 0);

  const openReceipt = async (path: string) => {
    const err = await openPrivateFile("expense-receipts", path);
    if (err) toast({ title: "Justificatif indisponible", description: err, variant: "destructive" });
  };

  return (
    <section className="mt-6 space-y-3 border-t border-border pt-4" aria-labelledby="cra-expenses-title">
      <h4 id="cra-expenses-title" className="flex items-center gap-2 text-sm font-semibold">
        <Receipt className="h-4 w-4" /> Frais de mission
      </h4>
      <ul className="space-y-2">
        {expenses.map((e) => (
          <li key={e.id} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium">{e.label}</p>
              <p className="text-xs text-muted-foreground">
                {frDate(e.expense_date)} · {EXPENSE_CATEGORIES[e.category] ?? e.category}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="text-right">
                <p className="text-sm font-semibold">{euro(Number(e.amount_ht))} HT</p>
                <p className="text-xs text-muted-foreground">TVA {euro(Number(e.vat_amount))}</p>
              </div>
              {e.receipt_path && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => openReceipt(e.receipt_path as string)}
                  aria-label={`Justificatif : ${e.label}`}
                >
                  <Paperclip className="h-3.5 w-3.5" /> Justificatif
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-right text-sm">
        Total : <span className="font-semibold">{euro(totalHt)} HT</span>
        {totalVat > 0 && <span className="text-muted-foreground"> + {euro(totalVat)} TVA</span>}
      </p>
    </section>
  );
}

/** Validation de secours par l'admin quand le client ne peut pas signer. */
export function AdminApproveDialog({ timesheetId, onApproved }: { timesheetId: string; onApproved: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = reason.trim().length >= 5;

  const confirm = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await craSign({ action: "admin_approve", timesheet_id: timesheetId, reason: reason.trim() });
      toast({ title: "CRA validé", description: "La validation de secours est enregistrée avec sa preuve." });
      setOpen(false);
      setReason("");
      await onApproved();
    } catch (e) {
      toast({ title: "Validation impossible", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileSignature className="h-4 w-4" /> Valider à la place du client
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider à la place du client</AlertDialogTitle>
          <AlertDialogDescription>
            Solution de secours, à réserver aux cas où le client ne peut pas signer (injoignable, email non reçu…).
            La validation sera enregistrée à votre nom avec ce motif, et les montants seront figés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="admin-approve-reason">Motif</Label>
          <Textarea
            id="admin-approve-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. : validé par téléphone avec le client, email de signature non reçu"
            rows={3}
            aria-describedby="admin-approve-reason-hint"
          />
          <p id="admin-approve-reason-hint" className="text-xs text-muted-foreground">5 caractères minimum.</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <Button onClick={confirm} disabled={!valid || busy}>
            {busy ? "Validation…" : "Valider le CRA"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
