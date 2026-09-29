import { supabase } from "@/integrations/supabase/client";

/** Champs de company_settings utiles à la facturation (la table n'est pas dans les types générés). */
export interface InvoicingSettings {
  legal_name: string;
  legal_form: string | null;
  siren: string | null;
  vat_number: string | null;
  share_capital: number | null;
  rcs_city: string | null;
  address: string | null;
  contact_email: string | null;
  iban: string | null;
  bic: string | null;
  client_payment_terms_days: number;
  freelance_payment_terms_days: number;
  vat_rate: number;
  /** Absent tant que la migration Pennylane n'est pas appliquée. */
  invoicing_mode?: InvoicingMode;
}

/** Pennylane : factures client émises et numérotées dans Pennylane ; platform : numérotation KS. */
export type InvoicingMode = "pennylane" | "platform";

export const invoicingModeOf = (s: InvoicingSettings | null): InvoicingMode =>
  s?.invoicing_mode === "platform" ? "platform" : "pennylane";

/** La colonne invoicing_mode existe-t-elle (migration appliquée) ? */
export const hasInvoicingMode = (s: InvoicingSettings | null) => Boolean(s && "invoicing_mode" in s);

export async function fetchInvoicingSettings(): Promise<InvoicingSettings | null> {
  const { data } = await supabase.from("company_settings" as never).select("*").eq("id", 1).maybeSingle();
  return (data as InvoicingSettings | null) ?? null;
}

/** Identité incomplète : l'émission est refusée par la fonction invoices. */
export const invoicingIncomplete = (s: InvoicingSettings | null) =>
  !s || !s.siren?.trim() || !s.address?.trim() || !s.iban?.trim();
