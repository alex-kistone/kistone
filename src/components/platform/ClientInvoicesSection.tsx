import { useEffect, useState } from "react";
import { Download, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { frDate, openPrivateFile } from "@/components/platform/admin/adv";
import { MONTH_NAMES } from "@/lib/cra";
import { clientInvoiceState, eur, type ClientInvoice } from "@/lib/invoices";
import { cn } from "@/lib/utils";

/** Factures et avoirs émis pour le client, avec le PDF et les coordonnées de règlement. */
export default function ClientInvoicesSection({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<ClientInvoice[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("client_invoices" as never).select("*")
        .eq("client_user_id", userId).neq("status", "draft").order("issue_date", { ascending: false }).order("number", { ascending: false });
      if (error) toast({ title: "Factures indisponibles", description: error.message, variant: "destructive" });
      setInvoices((data ?? []) as unknown as ClientInvoice[]);
    })();
  }, [userId, toast]);

  const openPdf = async (inv: ClientInvoice) => {
    if (!inv.pdf_path) {
      toast({ title: "PDF en préparation", description: "Réessayez dans quelques minutes." });
      return;
    }
    const err = await openPrivateFile("invoices", inv.pdf_path);
    if (err) toast({ title: "Ouverture impossible", description: err, variant: "destructive" });
  };

  if (invoices === null) return <div className="py-8 text-center text-muted-foreground">Chargement des factures…</div>;

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <Receipt className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">Aucune facture pour le moment.</p>
        <p className="mt-1 text-xs text-muted-foreground">Chaque mois, la facture suit la validation du CRA.</p>
      </div>
    );
  }

  const toPay = invoices.filter((i) => i.kind === "invoice" && i.status === "issued");
  const due = toPay.reduce((s, i) => s + Number(i.total_ttc), 0);
  const seller = invoices.find((i) => i.seller?.iban)?.seller;

  return (
    <div className="space-y-4">
      {toPay.length > 0 ? (
        <section aria-labelledby="to-pay" className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 id="to-pay" className="text-sm font-semibold">À régler : {eur(due)} TTC</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Par virement{seller?.iban ? <> sur l'IBAN <span className="font-mono text-foreground">{String(seller.iban).replace(/(.{4})/g, "$1 ").trim()}</span>{seller.bic ? ` (BIC ${seller.bic})` : ""}</> : ""}, en indiquant le numéro de facture en référence.
          </p>
        </section>
      ) : null}

      <ul className="space-y-2">
        {invoices.map((inv) => {
          const state = clientInvoiceState(inv);
          const period = inv.period_month ? `${MONTH_NAMES[inv.period_month - 1]} ${inv.period_year}` : null;
          return (
            <li key={inv.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{inv.kind === "credit_note" ? "Avoir" : "Facture"} {inv.number}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", state.tone)}>{state.label}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {period ? `${period} · ` : ""}émise le {frDate(inv.issue_date)}
                    {inv.kind === "invoice" && inv.status === "issued" ? ` · échéance ${frDate(inv.due_date)}` : ""}
                    {inv.status === "paid" && inv.paid_at ? ` · réglée le ${frDate(inv.paid_at)}` : ""}
                  </p>
                  {inv.kind === "credit_note" && inv.notes ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{inv.notes}</p>
                  ) : inv.lines[0] ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{inv.lines[0].label}</p> : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-right">
                  <span className="block font-semibold tabular-nums">{eur(inv.total_ttc)} TTC</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">{eur(inv.total_ht)} HT</span>
                </span>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPdf(inv)} aria-label={`Télécharger ${inv.kind === "credit_note" ? "l'avoir" : "la facture"} ${inv.number}`}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> PDF
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
