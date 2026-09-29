import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/components/platform/admin/adv";

/** Factures : types, libellés et appels communs aux espaces client, freelance et admin. */

export interface InvoiceLine { label: string; quantity: number; unit: string; unit_price_ht: number; total_ht: number }

export interface ClientInvoice {
  id: string;
  kind: "invoice" | "credit_note";
  number: string | null;
  status: "draft" | "issued" | "paid" | "cancelled";
  timesheet_id: string | null;
  mission_id: string | null;
  client_user_id: string;
  period_month: number | null;
  period_year: number | null;
  issue_date: string | null;
  due_date: string | null;
  lines: InvoiceLine[];
  total_ht: number;
  vat_rate: number;
  total_vat: number;
  total_ttc: number;
  seller: Record<string, string | number | null> | null;
  buyer: Record<string, string | null> | null;
  notes: string | null;
  pdf_path: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  payment_reference: string | null;
  credit_note_of: string | null;
  cancel_reason: string | null;
  reminder_count: number;
  last_reminded_at: string | null;
  pennylane_id: string | null;
  pennylane_error: string | null;
  created_at: string;
}

export interface FreelanceInvoice {
  id: string;
  timesheet_id: string;
  mission_id: string | null;
  freelance_user_id: string;
  invoice_number: string;
  invoice_date: string;
  amount_ht: number;
  vat_amount: number;
  amount_ttc: number;
  expected_ht: number | null;
  file_path: string;
  status: "submitted" | "approved" | "rejected" | "paid";
  rejection_reason: string | null;
  reviewed_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Statut affiché d'une facture client (« en retard » se déduit de l'échéance). */
export function clientInvoiceState(inv: Pick<ClientInvoice, "kind" | "status" | "due_date">) {
  if (inv.kind === "credit_note") return { key: "credit_note", label: "Avoir", tone: "bg-muted text-muted-foreground" };
  if (inv.status === "draft") return { key: "draft", label: "Brouillon", tone: "bg-muted text-muted-foreground" };
  if (inv.status === "cancelled") return { key: "cancelled", label: "Annulée", tone: "bg-muted text-muted-foreground line-through" };
  if (inv.status === "paid") return { key: "paid", label: "Payée", tone: "bg-[#E6F4EC] text-[#17693D]" };
  if (inv.due_date && inv.due_date < today()) return { key: "overdue", label: "En retard", tone: "bg-[#FDE8EE] text-[#B3134A]" };
  return { key: "issued", label: "À régler", tone: "bg-[#EDF3FB] text-[#1E4F8F]" };
}

export const FREELANCE_INVOICE_STATUS: Record<FreelanceInvoice["status"], { label: string; tone: string }> = {
  submitted: { label: "En vérification", tone: "bg-[#EDF3FB] text-[#1E4F8F]" },
  approved: { label: "Validée", tone: "bg-[#E6F4EC] text-[#17693D]" },
  rejected: { label: "À corriger", tone: "bg-[#FDE8EE] text-[#B3134A]" },
  paid: { label: "Payée", tone: "bg-[#E6F4EC] text-[#17693D]" },
};

/** Écart entre le montant HT déclaré et le montant attendu (tolérance d'un centime). */
export const invoiceGap = (inv: Pick<FreelanceInvoice, "amount_ht" | "expected_ht">) =>
  inv.expected_ht == null ? 0 : Math.round((Number(inv.amount_ht) - Number(inv.expected_ht)) * 100) / 100;

export const eur = (n: number | null | undefined) =>
  n == null ? "—" : `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** Appel de la fonction invoices (admin) ; renvoie les données ou lève une Error lisible. */
export async function invoicesFn<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("invoices", { body });
  if (error) throw new Error(await functionErrorMessage(error));
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}
