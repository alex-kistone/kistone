import { useEffect, useState } from "react";
import { ArrowLeft, Ban, CheckCircle2, FileDown, FileText, Send, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clientInvoiceState, eur, invoicesFn, type ClientInvoice } from "@/lib/invoices";
import { frDate, openPrivateFile } from "@/components/platform/admin/adv";
import type { InvoicingMode } from "@/components/platform/admin/invoicingSettings";
import { AttachPdfButton, PennylanePill, RecordPennylaneCreditNoteDialog, RecordPennylaneInvoiceDialog } from "@/components/platform/admin/PennylaneInvoiceDialogs";

const todayIso = () => new Date().toISOString().slice(0, 10);
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface Props {
  invoice: ClientInvoice;
  clientName: string;
  missionTitle: string | null;
  /** Numéro de la facture d'origine (pour un avoir). */
  originalNumber: string | null;
  /** Identité de Kistone incomplète : émission bloquée. */
  settingsIncomplete: boolean;
  /** Mode de facturation : Pennylane (numéro reporté) ou plateforme (numérotation KS). */
  mode: InvoicingMode;
  /** Délai de paiement client (jours), pour l'échéance par défaut. */
  paymentTermsDays: number;
  onBack: () => void;
  onChanged: () => void | Promise<void>;
  onOpenSettings: () => void;
}

interface IssueResult { number: string; emailed: boolean }

export function ClientInvoiceDetail({ invoice: inv, clientName, missionTitle, originalNumber, settingsIncomplete, mode, paymentTermsDays, onBack, onChanged, onOpenSettings }: Props) {
  const { toast } = useToast();
  const state = clientInvoiceState(inv);
  const [notes, setNotes] = useState(inv.notes ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { setNotes(inv.notes ?? ""); }, [inv.id, inv.notes]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } finally { setBusy(null); }
  };

  const update = async (patch: Partial<ClientInvoice>) => {
    const { error } = await supabase.from("client_invoices" as never).update(patch as never).eq("id", inv.id);
    if (error) throw new Error(error.message);
  };

  const saveNotes = () => run("notes", async () => {
    try {
      await update({ notes: notes.trim() || null });
      toast({ title: "Notes enregistrées" });
      await onChanged();
    } catch (e) {
      toast({ title: "Enregistrement impossible", description: errText(e), variant: "destructive" });
    }
  });

  const deleteDraft = () => run("delete", async () => {
    const { error } = await supabase.from("client_invoices" as never).delete().eq("id", inv.id);
    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Brouillon supprimé", description: "Le CRA repasse dans « À facturer »." });
    onBack();
    await onChanged();
  });

  const issue = () => run("issue", async () => {
    try {
      if ((inv.notes ?? "") !== notes) await update({ notes: notes.trim() || null });
      const res = await invoicesFn<IssueResult>({ action: "issue", invoice_id: inv.id });
      toast({
        title: `Facture ${res.number} émise`,
        description: res.emailed ? "Le PDF a été envoyé au client." : "PDF produit ; email non envoyé (Resend non configuré).",
      });
      await onChanged();
    } catch (e) {
      toast({ title: "Émission impossible", description: errText(e), variant: "destructive" });
    }
  });

  const render = () => run("render", async () => {
    try {
      await invoicesFn({ action: "render", invoice_id: inv.id });
      toast({ title: "PDF produit" });
      await onChanged();
    } catch (e) {
      toast({ title: "PDF impossible", description: errText(e), variant: "destructive" });
    }
  });

  const openPdf = async () => {
    if (!inv.pdf_path) return;
    const err = await openPrivateFile("invoices", inv.pdf_path);
    if (err) toast({ title: "PDF indisponible", description: err, variant: "destructive" });
  };

  const unpay = () => run("unpay", async () => {
    try {
      await update({ status: "issued", paid_at: null, paid_amount: null, payment_reference: null });
      toast({ title: "Paiement annulé", description: "La facture est de nouveau à régler." });
      await onChanged();
    } catch (e) {
      toast({ title: "Modification impossible", description: errText(e), variant: "destructive" });
    }
  });

  const isInvoice = inv.kind === "invoice";
  const fromPennylane = inv.source === "pennylane";
  const title = inv.number ? `${isInvoice ? "Facture" : "Avoir"} ${inv.number}` : isInvoice ? "Brouillon de facture" : "Brouillon d'avoir";
  const period = inv.period_month && inv.period_year
    ? new Date(inv.period_year, inv.period_month - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Retour à la liste
      </Button>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${state.tone}`}>{state.label}</span>
              {fromPennylane && <PennylanePill />}
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              {clientName}{missionTitle ? ` · ${missionTitle}` : ""}{period ? ` · ${period}` : ""}
            </p>
            {!isInvoice && originalNumber && (
              <p className="mt-1 text-sm">Sur la facture <span className="font-medium">{originalNumber}</span></p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold">{eur(inv.total_ttc)}</p>
            <p className="text-xs text-muted-foreground">TTC</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">Émise le</dt><dd className="font-medium">{frDate(inv.issue_date)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Échéance</dt><dd className="font-medium">{frDate(inv.due_date)}</dd></div>
          {inv.status === "paid" && (
            <>
              <div><dt className="text-xs text-muted-foreground">Payée le</dt><dd className="font-medium">{frDate(inv.paid_at)}</dd></div>
              <div>
                <dt className="text-xs text-muted-foreground">Montant reçu</dt>
                <dd className="font-medium">{eur(inv.paid_amount)}{inv.payment_reference ? ` · ${inv.payment_reference}` : ""}</dd>
              </div>
            </>
          )}
        </dl>

        {/* Lignes */}
        <section className="mt-6 border-t border-border pt-4" aria-labelledby="invoice-lines-title">
          <h4 id="invoice-lines-title" className="mb-3 text-sm font-semibold">Lignes</h4>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {inv.lines.map((l, i) => (
              <li key={i} className="grid grid-cols-2 gap-2 p-3 text-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4">
                <span className="col-span-2 break-words font-medium sm:col-span-1">{l.label}</span>
                <span className="text-muted-foreground">{Number(l.quantity).toLocaleString("fr-FR")} {l.unit}{Number(l.quantity) > 1 && l.unit === "jour" ? "s" : ""}</span>
                <span className="text-right text-muted-foreground sm:text-left">× {eur(l.unit_price_ht)}</span>
                <span className="col-span-2 text-right font-semibold sm:col-span-1">{eur(l.total_ht)} HT</span>
              </li>
            ))}
          </ul>
          <dl className="ml-auto mt-3 w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Total HT</dt><dd>{eur(inv.total_ht)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">TVA {Number(inv.vat_rate).toLocaleString("fr-FR")} %</dt><dd>{eur(inv.total_vat)}</dd></div>
            <div className="flex justify-between border-t border-border pt-1 font-semibold"><dt>Total TTC</dt><dd>{eur(inv.total_ttc)}</dd></div>
          </dl>
        </section>

        {/* Suivi */}
        {(inv.reminder_count > 0 || inv.cancel_reason || inv.pennylane_error) && (
          <section className="mt-6 space-y-2 border-t border-border pt-4 text-sm" aria-label="Suivi">
            {inv.reminder_count > 0 && (
              <p className="text-muted-foreground">
                Relancée {inv.reminder_count} fois{inv.last_reminded_at ? `, dernière le ${frDate(inv.last_reminded_at)}` : ""}.
              </p>
            )}
            {inv.cancel_reason && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Motif d'annulation</p>
                <p>{inv.cancel_reason}</p>
              </div>
            )}
            {inv.pennylane_error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="mb-1 text-xs font-semibold text-destructive">Synchronisation Pennylane</p>
                <p className="break-words text-destructive">{inv.pennylane_error}</p>
              </div>
            )}
          </section>
        )}

        {/* Notes */}
        <section className="mt-6 space-y-2 border-t border-border pt-4">
          <Label htmlFor="invoice-notes" className="text-sm font-semibold">Notes</Label>
          {inv.status === "draft" ? (
            <>
              <Textarea
                id="invoice-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention reprise sur la facture (bon de commande, référence client…)"
              />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={saveNotes} disabled={busy !== null || notes === (inv.notes ?? "")}>
                  {busy === "notes" ? "Enregistrement…" : "Enregistrer les notes"}
                </Button>
              </div>
            </>
          ) : (
            <p id="invoice-notes" className="whitespace-pre-wrap text-sm text-muted-foreground">{inv.notes || "—"}</p>
          )}
        </section>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
          {inv.status === "draft" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-destructive" disabled={busy !== null}>
                    <Trash2 className="h-4 w-4" /> Supprimer le brouillon
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Aucun numéro n'a encore été attribué. Le CRA pourra être refacturé depuis « À facturer ».
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteDraft}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {mode === "pennylane" ? (
                <RecordPennylaneInvoiceDialog invoice={inv} paymentTermsDays={paymentTermsDays} disabled={busy !== null} onDone={onChanged} />
              ) : settingsIncomplete ? (
                <Button size="sm" variant="outline" onClick={onOpenSettings}>Compléter l'identité de Kistone</Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="gap-2" disabled={busy !== null}>
                      <Send className="h-4 w-4" /> {busy === "issue" ? "Émission…" : "Émettre la facture"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Émettre la facture ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Un numéro définitif lui sera attribué et elle ne pourra plus être modifiée ni supprimée : une erreur
                        se corrigera par un avoir. Le PDF est produit et envoyé par email au client ({eur(inv.total_ttc)} TTC).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={issue}>Émettre</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}

          {inv.status !== "draft" && (
            inv.pdf_path ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={openPdf}>
                <FileText className="h-4 w-4" /> Voir le PDF
              </Button>
            ) : fromPennylane ? (
              <AttachPdfButton invoice={inv} disabled={busy !== null} onDone={onChanged} />
            ) : (
              <Button variant="outline" size="sm" className="gap-2" onClick={render} disabled={busy !== null}>
                <FileDown className="h-4 w-4" /> {busy === "render" ? "Production…" : "Produire le PDF"}
              </Button>
            )
          )}

          {isInvoice && (inv.status === "issued" || inv.status === "paid") && (
            fromPennylane
              ? <RecordPennylaneCreditNoteDialog invoice={inv} disabled={busy !== null} onDone={onChanged} />
              : <CreditNoteDialog invoice={inv} disabled={busy !== null} onDone={onChanged} />
          )}

          {inv.status === "paid" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={busy !== null}>
                  <Undo2 className="h-4 w-4" /> Annuler le paiement
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler le paiement ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La facture redevient « à régler » et les informations de paiement sont effacées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Garder</AlertDialogCancel>
                  <AlertDialogAction onClick={unpay}>Annuler le paiement</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isInvoice && inv.status === "issued" && <PaymentDialog invoice={inv} disabled={busy !== null} onDone={onChanged} />}
        </div>
      </div>
    </div>
  );
}

function PaymentDialog({ invoice, disabled, onDone }: { invoice: ClientInvoice; disabled: boolean; onDone: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState(String(invoice.total_ttc));
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const parsed = Number(amount.replace(",", "."));
  const valid = Boolean(date) && Number.isFinite(parsed) && parsed > 0;

  useEffect(() => {
    if (open) { setDate(todayIso()); setAmount(String(invoice.total_ttc)); setReference(""); }
  }, [open, invoice.total_ttc]);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const { error } = await supabase
      .from("client_invoices" as never)
      .update({ status: "paid", paid_at: date, paid_amount: parsed, payment_reference: reference.trim() || null } as never)
      .eq("id", invoice.id);
    setSaving(false);
    if (error) {
      toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Paiement enregistré",
      description: Math.abs(parsed - Number(invoice.total_ttc)) > 0.009 ? `Montant reçu différent du total (${eur(invoice.total_ttc)}).` : undefined,
    });
    setOpen(false);
    await onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" disabled={disabled}>
          <CheckCircle2 className="h-4 w-4" /> Enregistrer le paiement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer le paiement</DialogTitle>
          <DialogDescription>Facture {invoice.number} · {eur(invoice.total_ttc)} TTC</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-date">Date de réception</Label>
            <Input id="payment-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Montant reçu (€ TTC)</Label>
            <Input id="payment-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment-reference">Référence du virement (facultatif)</Label>
            <Input id="payment-reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={!valid || saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreditNoteDialog({ invoice, disabled, onDone }: { invoice: ClientInvoice; disabled: boolean; onDone: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = reason.trim().length >= 3;

  const confirm = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const res = await invoicesFn<IssueResult>({ action: "credit_note", invoice_id: invoice.id, reason: reason.trim() });
      toast({
        title: `Avoir ${res.number} émis`,
        description: `La facture ${invoice.number} est annulée et le CRA redevient facturable.${res.emailed ? "" : " Email non envoyé (Resend non configuré)."}`,
      });
      setOpen(false);
      setReason("");
      await onDone();
    } catch (e) {
      toast({ title: "Avoir impossible", description: errText(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
          <Ban className="h-4 w-4" /> Faire un avoir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Faire un avoir sur {invoice.number}</AlertDialogTitle>
          <AlertDialogDescription>
            Un avoir du même montant ({eur(-invoice.total_ttc)} TTC) est émis et envoyé au client ; la facture est annulée
            et le CRA pourra être refacturé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="credit-note-reason">Motif</Label>
          <Textarea
            id="credit-note-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. : erreur sur le nombre de jours"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <Button onClick={confirm} disabled={!valid || busy}>{busy ? "Émission…" : "Émettre l'avoir"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
