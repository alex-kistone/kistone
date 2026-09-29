import { supabase } from "@/integrations/supabase/client";
import type { ProviderIdentity } from "@/lib/contracts/types";

/** Paramètres de la société qui porte les missions (table company_settings, une seule ligne). */
export interface CompanySettings extends ProviderIdentity {
  defaultMarginEur: number;
  yousignEnabled: boolean;
  pennylaneEnabled: boolean;
}

// Valeurs de repli tant que la société n'est pas renseignée (ou la migration pas appliquée)
const FALLBACK: CompanySettings = {
  legalName: "Kistone SAS",
  legalForm: "SAS",
  siren: null,
  address: null,
  representativeName: null,
  representativeTitle: null,
  clientPaymentTermsDays: 30,
  freelancePaymentTermsDays: 30,
  defaultMarginEur: 100,
  yousignEnabled: false,
  pennylaneEnabled: false,
};

export async function fetchCompanySettings(): Promise<CompanySettings> {
  // company_settings n'est pas encore dans les types générés
  const { data } = await supabase.from("company_settings" as never).select("*").eq("id", 1).maybeSingle();
  const row = data as Record<string, unknown> | null;
  if (!row) return FALLBACK;
  return {
    legalName: (row.legal_name as string) || FALLBACK.legalName,
    legalForm: (row.legal_form as string | null) ?? FALLBACK.legalForm,
    siren: (row.siren as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    representativeName: (row.representative_name as string | null) ?? null,
    representativeTitle: (row.representative_title as string | null) ?? null,
    clientPaymentTermsDays: (row.client_payment_terms_days as number) ?? FALLBACK.clientPaymentTermsDays,
    freelancePaymentTermsDays: (row.freelance_payment_terms_days as number) ?? FALLBACK.freelancePaymentTermsDays,
    defaultMarginEur: (row.default_margin_eur as number) ?? FALLBACK.defaultMarginEur,
    yousignEnabled: Boolean(row.yousign_enabled),
    pennylaneEnabled: Boolean(row.pennylane_enabled),
  };
}
