/**
 * Aides partagées par les écrans admin du module ADV (phase 1) : contrats de mission,
 * ouverture de fichiers privés, lecture des erreurs des fonctions edge.
 * Les tables contracts / kyc_* ne sont pas encore dans les types générés.
 */
import { supabase } from "@/integrations/supabase/client";
import type { KycParty } from "@/lib/kyc";

export type ContractStatus = "draft" | "sent" | "signed" | "declined" | "expired";

export interface MissionContract {
  id: string;
  mission_id: string;
  party: KycParty;
  status: ContractStatus;
  document_path: string | null;
  signed_document_path: string | null;
  yousign_request_id: string | null;
  sent_at: string | null;
  signed_at: string | null;
}

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; tone: string }> = {
  draft: { label: "À signer", tone: "bg-secondary text-foreground" },
  sent: { label: "Envoyé pour signature", tone: "bg-[#EDF3FB] text-[#1E4F8F]" },
  signed: { label: "Signé", tone: "bg-[#E8F5EE] text-[#17663F]" },
  declined: { label: "Signature refusée", tone: "bg-[#FFE3EC] text-[#8F1747]" },
  expired: { label: "Demande expirée", tone: "bg-[#FFE3EC] text-[#8F1747]" },
};

export const PARTY_LABEL: Record<KycParty, string> = { client: "Client", freelance: "Freelance" };

/** Date du jour au format AAAA-MM-JJ, pour nommer les fichiers. */
export const todayStamp = () => new Date().toISOString().slice(0, 10);

/** Ouvre un fichier d'un bucket privé dans un nouvel onglet (lien signé de 5 minutes). */
export async function openPrivateFile(bucket: string, path: string): Promise<string | null> {
  // L'onglet est ouvert tout de suite (sinon le navigateur bloque la fenêtre après l'await).
  const win = window.open("", "_blank");
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    win?.close();
    return error?.message ?? "Lien indisponible";
  }
  if (win) {
    win.opener = null;
    win.location.href = data.signedUrl;
  } else {
    window.open(data.signedUrl, "_blank", "noopener");
  }
  return null;
}

/** Message lisible d'une erreur de supabase.functions.invoke (corps JSON { error } si présent). */
export async function functionErrorMessage(error: unknown): Promise<string> {
  const ctx = (error as { context?: unknown })?.context;
  if (ctx instanceof Response) {
    try {
      const body = await ctx.clone().json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      /* corps non JSON */
    }
  }
  return error instanceof Error ? error.message : "Erreur inconnue";
}

/** Libellé simple d'une date ISO (ou « — »). */
export const frDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "—");
