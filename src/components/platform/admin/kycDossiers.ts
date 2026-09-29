import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { KycDossier, KycStatus } from "@/lib/kyc";

/** Événement émis quand un dossier change (validation, refus) : listes et compteurs se rechargent. */
export const KYC_CHANGED_EVENT = "kyc-changed";
export const notifyKycChanged = () => window.dispatchEvent(new Event(KYC_CHANGED_EVENT));

/** Libellés côté admin (le libellé « En cours de vérification » est celui vu par le titulaire). */
export const ADMIN_KYC_LABEL: Record<KycStatus, string> = {
  submitted: "À vérifier",
  incomplete: "À compléter",
  rejected: "À corriger",
  approved: "Validé",
};

/** Paramètre d'URL qui ouvre le panneau latéral d'un dossier, sur n'importe quel onglet admin. */
export const DOSSIER_PARAM = "dossier";

/** Ouvre (ou ferme avec null) le panneau du dossier d'un compte, sans changer d'onglet. */
export function useOpenDossier() {
  const [, setSearchParams] = useSearchParams();
  return useCallback((userId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (userId) next.set(DOSSIER_PARAM, userId);
      else next.delete(DOSSIER_PARAM);
      return next;
    }, { replace: true });
  }, [setSearchParams]);
}

export type ProfileRow = Record<string, string | null>;

export interface DossierRow extends KycDossier {
  profile: ProfileRow | null;
  displayName: string;
  companyName: string;
}

const FREELANCE_COLUMNS =
  "user_id, first_name, last_name, email, company_name, legal_form, siren, siret, company_address, tva_number, iban, bic";
const CLIENT_COLUMNS =
  "user_id, first_name, last_name, email, company_name, legal_form, siren, siret, company_address, vat_number, billing_email, representative_name, representative_title";

/** Joint à chaque dossier le profil (freelance ou client) de son titulaire. */
async function withProfiles(dossiers: KycDossier[]): Promise<DossierRow[]> {
  const freelanceIds = dossiers.filter((d) => d.party === "freelance").map((d) => d.user_id);
  const clientIds = dossiers.filter((d) => d.party === "client").map((d) => d.user_id);

  const [freelances, clients] = await Promise.all([
    freelanceIds.length
      ? supabase.from("recruiter_profiles").select(FREELANCE_COLUMNS as "*").in("user_id", freelanceIds)
      : Promise.resolve({ data: [] }),
    clientIds.length
      ? supabase.from("client_profiles").select(CLIENT_COLUMNS as "*").in("user_id", clientIds)
      : Promise.resolve({ data: [] }),
  ]);
  const byUser = new Map<string, ProfileRow>();
  for (const p of [...((freelances.data ?? []) as unknown[]), ...((clients.data ?? []) as unknown[])]) {
    const row = p as ProfileRow;
    if (row.user_id) byUser.set(row.user_id, row);
  }

  return dossiers.map((d) => {
    const profile = byUser.get(d.user_id) ?? null;
    const person = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
    return {
      ...d,
      profile,
      displayName: person || profile?.email || "Compte sans profil",
      companyName: profile?.company_name || "",
    };
  });
}

/** Dossiers (tous, ou d'un statut donné) avec le profil de leur titulaire. */
export async function loadDossiers(status?: KycStatus): Promise<DossierRow[]> {
  let q = supabase.from("kyc_dossiers" as never).select("*");
  if (status) q = q.eq("status" as never, status as never);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return withProfiles((data ?? []) as unknown as KycDossier[]);
}

/** Dossier d'un compte, ou null s'il n'a pas encore été ouvert. */
export async function loadDossier(userId: string): Promise<DossierRow | null> {
  const { data, error } = await supabase
    .from("kyc_dossiers" as never)
    .select("*")
    .eq("user_id" as never, userId as never)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [row] = await withProfiles([data as unknown as KycDossier]);
  return row;
}

/** Statut du dossier de chaque compte (user_id → statut), rechargé à chaque changement. */
export function useKycStatuses() {
  const [statuses, setStatuses] = useState<Map<string, KycStatus>>(new Map());

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("kyc_dossiers" as never).select("user_id, status");
    if (error) return;
    const rows = (data ?? []) as unknown as Pick<KycDossier, "user_id" | "status">[];
    setStatuses(new Map(rows.map((r) => [r.user_id, r.status])));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(KYC_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(KYC_CHANGED_EVENT, refresh);
  }, [refresh]);

  return { statuses, refresh };
}
