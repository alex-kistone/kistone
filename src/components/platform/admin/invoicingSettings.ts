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
}

export async function fetchInvoicingSettings(): Promise<InvoicingSettings | null> {
  const { data } = await supabase.from("company_settings" as never).select("*").eq("id", 1).maybeSingle();
  return (data as InvoicingSettings | null) ?? null;
}

/** Identité incomplète : l'émission est refusée par la fonction invoices. */
export const invoicingIncomplete = (s: InvoicingSettings | null) =>
  !s || !s.siren?.trim() || !s.address?.trim() || !s.iban?.trim();
