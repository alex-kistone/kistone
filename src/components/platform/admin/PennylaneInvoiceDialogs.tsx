import { useEffect, useRef, useState } from "react";
import { Ban, ClipboardCopy, FileUp, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { eur, invoiceLinesText, sanitizeFileName, withMigrationHint, type ClientInvoice } from "@/lib/invoices";
import { localIso } from "@/lib/treasury";

/**
 * Mode Pennylane : la facture est créée et numérotée dans Pennylane, la plateforme en enregistre
 * le numéro (record_external_invoice), l'avoir (record_external_credit_note) et le PDF éventuel.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return localIso(new Date(y, m - 1, d + days));
};

const pdfProblem = (file: File | null) =>
  file && (file.type !== "application/pdf" || file.size > MAX_BYTES) ? "PDF uniquement, 10 Mo maximum." : null;

/** Dépose le PDF dans le bucket invoices (<client>/<numéro>.pdf) et le rattache à la facture. */
async function attachPdf(inv: Pick<ClientInvoice, "id" | "client_user_id">, number: string, file: File) {
  const path = `${inv.client_user_id}/${sanitizeFileName(number)}.pdf`;
  const { error: upErr } = await supabase.storage.from("invoices").upload(path, file, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(withMigrationHint(upErr.message));
  const { error } = await supabase.from("client_invoices" as never).update({ pdf_path: path } as never).eq("id", inv.id);
  if (error) throw new Error(withMigrationHint(error.message));
}

/** Pastille discrète : facture émise et numérotée dans Pennylane. */
export const PennylanePill = () => (
  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground" title="Facture émise dans Pennylane">
    Pennylane
  </span>
);

function PdfField({ id, file, onChange, hint }: { id: string; file: File | null; onChange: (f: File | null) => void; hint: string }) {
  const problem = pdfProblem(file);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>PDF de la facture (facultatif)</Label>
      <Input
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        aria-invalid={Boolean(problem)}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className={`text-xs ${problem ? "text-destructive" : "text-muted-foreground"}`}>{problem ?? hint}</p>
    </div>
  );
}

// ── Enregistrer la facture Pennylane (brouillon → émise) ──
export function RecordPennylaneInvoiceDialog({ invoice, paymentTermsDays, disabled, onDone }: {
  invoice: ClientInvoice;
  paymentTermsDays: number;
  disabled: boolean;
  onDone: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState(localIso());
  const [dueDate, setDueDate] = useState("");
  const [dueTouched, setDueTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const today = localIso();
      setNumber("");
      setIssueDate(today);
      setDueDate(addDays(today, paymentTermsDays));
      setDueTouched(false);
      setFile(null);
      setCopied(false);
    }
  }, [open, paymentTermsDays]);

  const onIssueDate = (v: string) => {
    setIssueDate(v);
    if (!dueTouched && v) setDueDate(addDays(v, paymentTermsDays));
  };

  const valid = number.trim().length > 0 && Boolean(issueDate) && (!dueDate || dueDate >= issueDate) && !pdfProblem(file);

  const copyLines = async () => {
    try {
      await navigator.clipboard.writeText(invoiceLinesText(invoice));
      setCopied(true);
      toast({ title: "Lignes copiées", description: "Collez-les dans la facture Pennylane." });
    } catch {
      toast({ title: "Copie impossible", description: "Sélectionnez les lignes à la main.", variant: "destructive" });
    }
  };

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const n = number.trim();
    const { error } = await supabase.rpc("record_external_invoice" as never, {
      _invoice_id: invoice.id, _number: n, _issue_date: issueDate, _due_date: dueDate || null,
    } as never);
    if (error) {
      setSaving(false);
      toast({ title: "Enregistrement impossible", description: withMigrationHint(error.message), variant: "destructive" });
      return;
    }
    let pdfError: string | null = null;
    if (file) {
      try { await attachPdf(invoice, n, file); } catch (e) { pdfError = errText(e); }
    }
    setSaving(false);
    toast({
      title: `Facture ${n} enregistrée`,
      description: pdfError ? `PDF non joint (${pdfError}) : vous pourrez le joindre depuis la facture.` : "Le CRA passe en « facturé ».",
      variant: pdfError ? "destructive" : "default",
    });
    setOpen(false);
    await onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" disabled={disabled}>
          <FileUp className="h-4 w-4" /> Enregistrer la facture Pennylane
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enregistrer la facture Pennylane</DialogTitle>
          <DialogDescription>Créez la facture dans Pennylane avec ces lignes, puis reportez ici son numéro.</DialogDescription>
        </DialogHeader>

        <section aria-labelledby="pl-lines-title" className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 id="pl-lines-title" className="text-sm font-semibold">Lignes à reprendre</h4>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={copyLines}>
              <ClipboardCopy className="h-3.5 w-3.5" /> {copied ? "Copié" : "Copier les lignes"}
            </Button>
          </div>
          <ul className="space-y-1.5 text-sm">
            {invoice.lines.map((l, i) => (
              <li key={i} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
                <span className="min-w-0 break-words">{l.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {Number(l.quantity).toLocaleString("fr-FR")} × {eur(l.unit_price_ht)} = <span className="text-foreground">{eur(l.total_ht)} HT</span>
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-0.5 border-t border-border pt-2 text-sm tabular-nums">
            <div className="flex justify-between"><dt className="text-muted-foreground">Total HT</dt><dd>{eur(invoice.total_ht)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">TVA {Number(invoice.vat_rate).toLocaleString("fr-FR")} %</dt><dd>{eur(invoice.total_vat)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total TTC</dt><dd>{eur(invoice.total_ttc)}</dd></div>
          </dl>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pl-number">Numéro de la facture Pennylane</Label>
            <Input id="pl-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Ex. F-2026-0042" required autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-issue">Date d'émission</Label>
            <Input id="pl-issue" type="date" value={issueDate} onChange={(e) => onIssueDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-due">Échéance (facultatif)</Label>
            <Input
              id="pl-due"
              type="date"
              value={dueDate}
              min={issueDate}
              onChange={(e) => { setDueDate(e.target.value); setDueTouched(true); }}
              aria-describedby="pl-due-hint"
            />
            <p id="pl-due-hint" className="text-xs text-muted-foreground">Par défaut : émission + {paymentTermsDays} jours.</p>
          </div>
          <div className="sm:col-span-2">
            <PdfField id="pl-pdf" file={file} onChange={setFile} hint="Le PDF téléchargé depuis Pennylane, visible ensuite par le client." />
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

// ── Enregistrer un avoir Pennylane ──
export function RecordPennylaneCreditNoteDialog({ invoice, disabled, onDone }: {
  invoice: ClientInvoice;
  disabled: boolean;
  onDone: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(localIso());
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setNumber(""); setDate(localIso()); setReason(""); setFile(null); }
  }, [open]);

  const valid = number.trim().length > 0 && Boolean(date) && reason.trim().length >= 3 && !pdfProblem(file);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const n = number.trim();
    const { data, error } = await supabase.rpc("record_external_credit_note" as never, {
      _invoice_id: invoice.id, _number: n, _issue_date: date, _reason: reason.trim(),
    } as never);
    if (error) {
      setSaving(false);
      toast({ title: "Avoir non enregistré", description: withMigrationHint(error.message), variant: "destructive" });
      return;
    }
    let pdfError: string | null = null;
    const creditId = typeof data === "string" ? data : null;
    if (file && creditId) {
      try { await attachPdf({ id: creditId, client_user_id: invoice.client_user_id }, n, file); } catch (e) { pdfError = errText(e); }
    }
    setSaving(false);
    toast({
      title: `Avoir ${n} enregistré`,
      description: `La facture ${invoice.number} est annulée et le CRA redevient facturable.${pdfError ? ` PDF non joint : ${pdfError}` : ""}`,
    });
    setOpen(false);
    await onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
          <Ban className="h-4 w-4" /> Enregistrer un avoir Pennylane
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avoir Pennylane sur {invoice.number}</DialogTitle>
          <DialogDescription>
            Émettez l'avoir ({eur(-invoice.total_ttc)} TTC) dans Pennylane, puis reportez ici son numéro. La facture sera annulée
            et le CRA pourra être refacturé.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pl-cn-number">Numéro de l'avoir Pennylane</Label>
            <Input id="pl-cn-number" value={number} onChange={(e) => setNumber(e.target.value)} required autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-cn-date">Date de l'avoir</Label>
            <Input id="pl-cn-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-cn-reason">Motif</Label>
            <Textarea id="pl-cn-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : erreur sur le nombre de jours" required />
          </div>
          <PdfField id="pl-cn-pdf" file={file} onChange={setFile} hint="Le PDF de l'avoir téléchargé depuis Pennylane." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={!valid || saving}>{saving ? "Enregistrement…" : "Enregistrer l'avoir"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Joindre le PDF d'une facture déjà enregistrée ──
export function AttachPdfButton({ invoice, disabled, onDone }: { invoice: ClientInvoice; disabled: boolean; onDone: () => void | Promise<void> }) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | null) => {
    if (input.current) input.current.value = "";
    if (!file) return;
    const problem = pdfProblem(file);
    if (problem) {
      toast({ title: "Fichier non accepté", description: problem, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await attachPdf(invoice, invoice.number ?? invoice.id, file);
      toast({ title: "PDF joint", description: "Le client peut désormais le télécharger." });
      await onDone();
    } catch (e) {
      toast({ title: "PDF non joint", description: errText(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <Button variant="outline" size="sm" className="gap-2" disabled={disabled || busy} onClick={() => input.current?.click()}>
        <Paperclip className="h-4 w-4" /> {busy ? "Envoi…" : "Joindre le PDF"}
      </Button>
    </>
  );
}
