import { useEffect, useState } from "react";
import { Check, CheckCircle2, FileText, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { eur, FREELANCE_INVOICE_STATUS, invoiceGap, type FreelanceInvoice } from "@/lib/invoices";
import { frDate, openPrivateFile } from "@/components/platform/admin/adv";
import { FreelanceEmailInvoiceDialog, type EmailInvoiceCandidate } from "@/components/platform/admin/FreelanceEmailInvoiceDialog";

export type { EmailInvoiceCandidate };

/** Facture freelance enrichie pour l'affichage (nom, mission, mois du CRA). */
export interface FreelanceInvoiceRow extends FreelanceInvoice {
  freelance_name: string;
  mission_title: string;
  cra_label: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

type Filter = "all" | FreelanceInvoice["status"];
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "submitted", label: "À vérifier" },
  { key: "approved", label: "À payer" },
  { key: "rejected", label: "Refusées" },
  { key: "paid", label: "Payées" },
];

// Libellé visible sur mobile, lu par les lecteurs d'écran partout (l'en-tête de colonne est masqué sur mobile).
const Cell = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`min-w-0 ${className}`}>
    <span className="block text-xs text-muted-foreground md:sr-only">{label}</span>
    <span className="break-words text-sm">{children}</span>
  </div>
);

export function GapBadge({ gap }: { gap: number }) {
  if (gap === 0) return null;
  // Rouge : le freelance facture plus que prévu ; orange : moins.
  const tone = gap > 0 ? "bg-[#FDE8EE] text-[#B3134A]" : "bg-[#FFF1E0] text-[#9A5B00]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      Écart {gap > 0 ? "+" : "−"}{eur(Math.abs(gap))}
    </span>
  );
}

export function FreelanceInvoicesAdmin({ rows, candidates, freelancePaymentTermsDays, onChanged }: {
  rows: FreelanceInvoiceRow[];
  /** CRA validés sans facture : dépôt d'une facture reçue par mail. */
  candidates: EmailInvoiceCandidate[];
  freelancePaymentTermsDays: number;
  onChanged: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<FreelanceInvoiceRow | null>(null);
  const [paying, setPaying] = useState<FreelanceInvoiceRow | null>(null);

  const list = rows.filter((r) => filter === "all" || r.status === filter);

  const approve = async (r: FreelanceInvoiceRow) => {
    setBusy(r.id);
    const { error } = await supabase
      .from("freelance_invoices" as never)
      .update({ status: "approved", rejection_reason: null } as never)
      .eq("id", r.id);
    setBusy(null);
    if (error) {
      toast({ title: "Validation impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Facture validée", description: `${r.freelance_name} · ${r.invoice_number}` });
    await onChanged();
  };

  const openFile = async (r: FreelanceInvoiceRow) => {
    const err = await openPrivateFile("freelance-invoices", r.file_path);
    if (err) toast({ title: "Fichier indisponible", description: err, variant: "destructive" });
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les factures freelance">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? rows.length : rows.filter((r) => r.status === f.key).length;
            return (
              <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}{count > 0 ? ` (${count})` : ""}
              </Button>
            );
          })}
        </div>
        <FreelanceEmailInvoiceDialog candidates={candidates} paymentTermsDays={freelancePaymentTermsDays} onDone={onChanged} />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <Receipt className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune facture freelance{filter === "all" ? " pour l'instant" : " dans cette catégorie"}.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div
            aria-hidden="true"
            className="hidden gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]"
          >
            <span>Freelance · mission</span>
            <span>Facture</span>
            <span className="text-right">HT déclaré</span>
            <span className="text-right">TVA · TTC</span>
            <span>Échéance</span>
            <span className="w-[270px] text-right">Statut</span>
          </div>
          <ul className="divide-y divide-border">
            {list.map((r) => {
              const st = FREELANCE_INVOICE_STATUS[r.status];
              const gap = invoiceGap(r);
              return (
                <li key={r.id} className="grid grid-cols-2 gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] md:items-center">
                  <div className="col-span-2 min-w-0 md:col-span-1">
                    <p className="break-words font-semibold">{r.freelance_name}</p>
                    <p className="break-words text-xs text-muted-foreground">{r.mission_title} · CRA {r.cra_label}</p>
                  </div>
                  <Cell label="Facture">
                    {r.invoice_number}
                    <span className="block text-xs text-muted-foreground">du {frDate(r.invoice_date)}</span>
                  </Cell>
                  <Cell label="HT déclaré" className="md:text-right">
                    <span className="font-medium">{eur(r.amount_ht)}</span>
                    <span className="block text-xs text-muted-foreground">attendu {eur(r.expected_ht)}</span>
                    {gap !== 0 && <span className="mt-1 block"><GapBadge gap={gap} /></span>}
                  </Cell>
                  <Cell label="TVA · TTC" className="md:text-right">
                    {eur(r.vat_amount)}
                    <span className="block font-medium">{eur(r.amount_ttc)}</span>
                  </Cell>
                  <Cell label={r.status === "paid" ? "Payée le" : "Échéance"}>
                    {r.status === "paid" ? frDate(r.paid_at) : frDate(r.due_date)}
                    {r.status === "paid" && r.payment_reference && (
                      <span className="block text-xs text-muted-foreground">{r.payment_reference}</span>
                    )}
                  </Cell>
                  <div className="col-span-2 flex flex-col gap-2 md:col-span-1 md:w-[270px] md:items-end">
                    <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                    {r.status === "rejected" && r.rejection_reason && (
                      <p className="break-words text-xs text-muted-foreground md:text-right">Motif : {r.rejection_reason}</p>
                    )}
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openFile(r)}
                        title="Voir la facture"
                        aria-label={`Voir la facture ${r.invoice_number} de ${r.freelance_name}`}
                      >
                        <FileText className="h-3.5 w-3.5" /> <span className="md:hidden">Voir la facture</span>
                      </Button>
                      {r.status === "submitted" && (
                        <>
                          <Button size="sm" className="gap-1.5" disabled={busy === r.id} onClick={() => approve(r)}>
                            <Check className="h-3.5 w-3.5" /> Valider
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setRejecting(r)}>
                            <X className="h-3.5 w-3.5" /> Refuser
                          </Button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <Button size="sm" className="gap-1.5" onClick={() => setPaying(r)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Marquer payée
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <RejectDialog invoice={rejecting} onClose={() => setRejecting(null)} onDone={onChanged} />
      <PayDialog invoice={paying} onClose={() => setPaying(null)} onDone={onChanged} />
    </div>
  );
}

function RejectDialog({ invoice, onClose, onDone }: { invoice: FreelanceInvoiceRow | null; onClose: () => void; onDone: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = reason.trim().length >= 3;

  useEffect(() => { if (invoice) setReason(""); }, [invoice]);

  const save = async () => {
    if (!invoice || !valid) return;
    setSaving(true);
    const { error } = await supabase
      .from("freelance_invoices" as never)
      .update({ status: "rejected", rejection_reason: reason.trim() } as never)
      .eq("id", invoice.id);
    setSaving(false);
    if (error) {
      toast({ title: "Refus impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Facture refusée", description: "Le freelance peut la corriger et la déposer à nouveau." });
    onClose();
    await onDone();
  };

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refuser la facture</DialogTitle>
          <DialogDescription>
            {invoice ? `${invoice.freelance_name} · ${invoice.invoice_number} · ${eur(invoice.amount_ht)} HT` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="freelance-reject-reason">Motif (visible par le freelance)</Label>
          <Textarea
            id="freelance-reject-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. : montant différent du CRA validé, mentions obligatoires manquantes"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button variant="destructive" onClick={save} disabled={!valid || saving}>{saving ? "Envoi…" : "Refuser"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayDialog({ invoice, onClose, onDone }: { invoice: FreelanceInvoiceRow | null; onClose: () => void; onDone: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [date, setDate] = useState(todayIso());
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (invoice) { setDate(todayIso()); setReference(""); } }, [invoice]);

  const save = async () => {
    if (!invoice || !date) return;
    setSaving(true);
    const { error } = await supabase
      .from("freelance_invoices" as never)
      .update({ status: "paid", paid_at: date, payment_reference: reference.trim() || null } as never)
      .eq("id", invoice.id);
    setSaving(false);
    if (error) {
      toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Facture marquée payée" });
    onClose();
    await onDone();
  };

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marquer la facture payée</DialogTitle>
          <DialogDescription>
            {invoice ? `${invoice.freelance_name} · ${invoice.invoice_number} · ${eur(invoice.amount_ttc)} TTC` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="freelance-paid-date">Date du virement</Label>
            <Input id="freelance-paid-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freelance-paid-ref">Référence (facultatif)</Label>
            <Input id="freelance-paid-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={!date || saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
