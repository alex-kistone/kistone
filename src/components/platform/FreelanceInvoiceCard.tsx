import { useEffect, useState } from "react";
import { FileUp, Paperclip, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { frDate, openPrivateFile } from "@/components/platform/admin/adv";
import { FREELANCE_INVOICE_STATUS, eur, invoiceGap, type FreelanceInvoice } from "@/lib/invoices";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  timesheetId: string;
  userId: string;
  /** Montant attendu HT : jours validés × TJM + frais. */
  expectedHt: number;
  detail: string;
}

/** Facture du freelance pour un CRA validé : dépôt, contrôle d'écart, suivi jusqu'au paiement. */
export default function FreelanceInvoiceCard({ timesheetId, userId, expectedHt, detail }: Props) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<FreelanceInvoice | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ht, setHt] = useState(String(expectedHt));
  const [noVat, setNoVat] = useState(false);
  const [vat, setVat] = useState(String(Math.round(expectedHt * 20) / 100));
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("freelance_invoices" as never).select("*").eq("timesheet_id", timesheetId).maybeSingle();
      setInvoice((data as FreelanceInvoice | null) ?? null);
    })();
  }, [timesheetId]);

  const startEdit = (from?: FreelanceInvoice) => {
    setNumber(from?.invoice_number ?? "");
    setDate(from?.invoice_date ?? new Date().toISOString().slice(0, 10));
    setHt(String(from?.amount_ht ?? expectedHt));
    setNoVat(from ? Number(from.vat_amount) === 0 : false);
    setVat(String(from?.vat_amount ?? Math.round(expectedHt * 20) / 100));
    setFile(null);
    setEditing(true);
  };

  const amount = Number(ht.replace(",", "."));
  const vatAmount = noVat ? 0 : Number(vat.replace(",", "."));
  const gap = Number.isFinite(amount) ? Math.round((amount - expectedHt) * 100) / 100 : 0;
  const valid = number.trim() && date && amount > 0 && vatAmount >= 0 && Number.isFinite(vatAmount) && (file || invoice);

  const submit = async () => {
    if (!valid) return;
    if (file && (file.type !== "application/pdf" || file.size > MAX_BYTES)) {
      toast({ title: "Fichier non accepté", description: "Déposez votre facture en PDF, 10 Mo maximum.", variant: "destructive" });
      return;
    }
    setSaving(true);
    let path = invoice?.file_path ?? "";
    if (file) {
      path = `${userId}/${timesheetId}/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage.from("freelance-invoices").upload(path, file, { contentType: "application/pdf" });
      if (error) {
        setSaving(false);
        toast({ title: "Dépôt impossible", description: error.message, variant: "destructive" });
        return;
      }
    }
    const row = { invoice_number: number.trim(), invoice_date: date, amount_ht: amount, vat_amount: vatAmount, file_path: path };
    const { data, error } = invoice
      ? await supabase.from("freelance_invoices" as never).update(row as never).eq("id", invoice.id).select("*").single()
      : await supabase.from("freelance_invoices" as never).insert({ ...row, timesheet_id: timesheetId, freelance_user_id: userId } as never).select("*").single();
    setSaving(false);
    if (error) {
      toast({ title: "Facture non enregistrée", description: error.message, variant: "destructive" });
      return;
    }
    setInvoice(data as FreelanceInvoice);
    setEditing(false);
    toast({ title: "Facture envoyée", description: "L'équipe Kistone la vérifie avant de la régler." });
  };

  const openFile = async () => {
    if (!invoice) return;
    const err = await openPrivateFile("freelance-invoices", invoice.file_path);
    if (err) toast({ title: "Ouverture impossible", description: err, variant: "destructive" });
  };

  if (invoice === undefined) return null;
  const status = invoice ? FREELANCE_INVOICE_STATUS[invoice.status] : null;
  const storedGap = invoice ? invoiceGap(invoice) : 0;

  return (
    <section aria-labelledby={`fi-${timesheetId}`} className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={`fi-${timesheetId}`} className="flex items-center gap-2 text-sm font-semibold">
          <Receipt className="h-4 w-4" aria-hidden="true" /> Ma facture
        </h4>
        {status ? <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.tone)}>{status.label}</span> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Montant attendu : <span className="font-semibold text-foreground">{eur(expectedHt)} HT</span> ({detail})
      </p>

      {invoice && !editing ? (
        <div className="mt-3 space-y-2 text-sm">
          <p>
            Facture <span className="font-medium">{invoice.invoice_number}</span> du {frDate(invoice.invoice_date)} ·{" "}
            <span className="tabular-nums">{eur(invoice.amount_ht)} HT</span>
            {Number(invoice.vat_amount) > 0 ? <span className="text-muted-foreground"> + {eur(invoice.vat_amount)} TVA</span> : null}
          </p>
          {storedGap !== 0 ? (
            <p className="text-[#B3134A]">Écart de {eur(storedGap)} avec le montant attendu.</p>
          ) : null}
          {invoice.status === "rejected" && invoice.rejection_reason ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
              <strong>À corriger :</strong> {invoice.rejection_reason}
            </p>
          ) : null}
          {invoice.status === "approved" && invoice.due_date ? <p className="text-muted-foreground">Règlement prévu au plus tard le {frDate(invoice.due_date)}.</p> : null}
          {invoice.status === "paid" ? <p className="text-[#17693D]">Payée le {frDate(invoice.paid_at)}.</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={openFile}>
              <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> Voir ma facture
            </Button>
            {invoice.status === "rejected" ? (
              <Button size="sm" className="gap-1.5" onClick={() => startEdit(invoice)}>
                <FileUp className="h-3.5 w-3.5" aria-hidden="true" /> Corriger et renvoyer
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!invoice && !editing ? (
        <Button size="sm" className="mt-3 gap-1.5" onClick={() => startEdit()}>
          <FileUp className="h-3.5 w-3.5" aria-hidden="true" /> Déposer ma facture
        </Button>
      ) : null}

      {editing ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`fi-num-${timesheetId}`} className="text-xs">Numéro de facture</Label>
            <Input id={`fi-num-${timesheetId}`} value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`fi-date-${timesheetId}`} className="text-xs">Date de facture</Label>
            <Input id={`fi-date-${timesheetId}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`fi-ht-${timesheetId}`} className="text-xs">Montant HT (€)</Label>
            <Input id={`fi-ht-${timesheetId}`} inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`fi-vat-${timesheetId}`} className="text-xs">TVA (€)</Label>
            <Input id={`fi-vat-${timesheetId}`} inputMode="decimal" value={noVat ? "0" : vat} disabled={noVat} onChange={(e) => setVat(e.target.value)} />
          </div>
          <label htmlFor={`fi-novat-${timesheetId}`} className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox id={`fi-novat-${timesheetId}`} checked={noVat} onCheckedChange={(v) => setNoVat(v === true)} />
            TVA non applicable (franchise en base, art. 293 B du CGI)
          </label>
          <div className="sm:col-span-2">
            <Label htmlFor={`fi-file-${timesheetId}`} className="text-xs">Facture (PDF){invoice ? " — facultatif si inchangée" : ""}</Label>
            <Input id={`fi-file-${timesheetId}`} type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {gap !== 0 && Number.isFinite(gap) ? (
            <p className="text-sm text-[#B3134A] sm:col-span-2">
              Écart de {eur(gap)} avec le montant attendu : vérifiez vos jours et vos frais, sinon la facture risque d'être refusée.
            </p>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Annuler</Button>
            <Button size="sm" onClick={submit} disabled={!valid || saving}>{saving ? "Envoi…" : "Envoyer ma facture"}</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
