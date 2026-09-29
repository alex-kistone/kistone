/**
 * Pennylane — envoi d'une facture client émise (API externe v2).
 *
 * Actif seulement si company_settings.pennylane_enabled est vrai ET le secret PENNYLANE_API_KEY
 * est posé. Sinon, rien n'est envoyé : l'export comptable CSV de l'admin sert de relais.
 *
 * ⚠️ NON TESTÉ : écrit d'après la documentation publique, sans compte Pennylane. À valider
 * avec la clé d'Alex : l'URL d'import, le format attendu des lignes et l'identification du
 * client (création préalable du client Pennylane à partir de son SIREN, sans doute nécessaire).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_URL = Deno.env.get("PENNYLANE_API_URL") ?? "https://app.pennylane.com/api/external/v2";

export async function pennylaneEnabled(db: SupabaseClient) {
  if (!Deno.env.get("PENNYLANE_API_KEY")) return false;
  const { data } = await db.from("company_settings").select("pennylane_enabled").eq("id", 1).single();
  return !!data?.pennylane_enabled;
}

/** Importe la facture (PDF + montants) ; renvoie l'id Pennylane ou lève une Error. */
export async function pushCustomerInvoice(invoice: Record<string, any>, pdf: Uint8Array): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([pdf], { type: "application/pdf" }), `${invoice.number}.pdf`);
  form.append("date", invoice.issue_date);
  if (invoice.due_date) form.append("deadline", invoice.due_date);
  form.append("invoice_number", invoice.number);
  form.append("currency_amount_before_tax", String(invoice.total_ht));
  form.append("currency_tax", String(invoice.total_vat));
  form.append("currency_amount", String(invoice.total_ttc));
  form.append("label", invoice.kind === "credit_note" ? `Avoir ${invoice.number}` : `Facture ${invoice.number}`);
  const res = await fetch(`${API_URL}/customer_invoices/import`, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("PENNYLANE_API_KEY")}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Pennylane ${res.status} : ${JSON.stringify(body).slice(0, 300)}`);
  return String(body.id ?? "");
}
