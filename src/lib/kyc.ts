/**
 * Référentiel des dossiers KYC (phase 1 du module ADV) : pièces exigées par partie,
 * libellés et règle de complétude. Partagé par « Mon dossier » (client, freelance)
 * et par la revue admin.
 */

export type KycParty = "client" | "freelance";
export type KycStatus = "incomplete" | "submitted" | "approved" | "rejected";
export type KycDocKind = "kbis" | "identity" | "rib" | "insurance" | "urssaf" | "other";

export interface KycDossier {
  user_id: string;
  party: KycParty;
  status: KycStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface KycDocument {
  id: string;
  user_id: string;
  kind: KycDocKind;
  path: string;
  file_name: string;
  mime: string | null;
  size: number | null;
  expires_at: string | null;
  uploaded_at: string;
}

export const KYC_STATUS: Record<KycStatus, { label: string; tone: string }> = {
  incomplete: { label: "À compléter", tone: "bg-secondary text-foreground" },
  submitted: { label: "En cours de vérification", tone: "bg-[#EDF3FB] text-[#1E4F8F]" },
  approved: { label: "Validé", tone: "bg-[#E8F5EE] text-[#17663F]" },
  rejected: { label: "À corriger", tone: "bg-[#FFE3EC] text-[#8F1747]" },
};

export interface KycDocSpec {
  kind: KycDocKind;
  label: string;
  hint: string;
  /** Pièce à date de validité (attestation URSSAF, assurance) : date d'expiration demandée. */
  expires?: boolean;
}

/** Pièces exigées. Le client ne fournit que son Kbis : sa société est identifiée par ses informations légales. */
export const REQUIRED_DOCS: Record<KycParty, KycDocSpec[]> = {
  freelance: [
    { kind: "kbis", label: "Kbis ou avis de situation SIRENE", hint: "De moins de 3 mois" },
    { kind: "identity", label: "Pièce d'identité", hint: "Carte d'identité ou passeport en cours de validité" },
    { kind: "rib", label: "RIB", hint: "Au nom de votre société" },
    { kind: "urssaf", label: "Attestation de vigilance URSSAF", hint: "De moins de 6 mois", expires: true },
    { kind: "insurance", label: "Attestation d'assurance RC Pro", hint: "En cours de validité", expires: true },
  ],
  client: [{ kind: "kbis", label: "Kbis", hint: "De moins de 3 mois" }],
};

/** Champs société obligatoires, par partie (colonnes des tables de profil). */
export const REQUIRED_FIELDS: Record<KycParty, { key: string; label: string }[]> = {
  freelance: [
    { key: "company_name", label: "Raison sociale" },
    { key: "legal_form", label: "Forme juridique" },
    { key: "siret", label: "SIRET" },
    { key: "company_address", label: "Adresse du siège" },
    { key: "iban", label: "IBAN" },
    { key: "bic", label: "BIC" },
  ],
  client: [
    { key: "company_name", label: "Raison sociale" },
    { key: "legal_form", label: "Forme juridique" },
    { key: "siret", label: "SIRET" },
    { key: "company_address", label: "Adresse du siège" },
    { key: "representative_name", label: "Représentant légal" },
    { key: "representative_title", label: "Qualité du représentant" },
    { key: "billing_email", label: "Email de facturation" },
  ],
};

/** SIRET : 14 chiffres, clé de Luhn (sauf La Poste, 356 000 000). */
export function isValidSiret(value: string | null | undefined): boolean {
  const s = (value ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(s)) return false;
  if (s.startsWith("356000000")) return true;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = Number(s[13 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

/** IBAN : format et clé modulo 97. */
export function isValidIban(value: string | null | undefined): boolean {
  const s = (value ?? "").replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const ch of digits) rest = (rest * 10 + Number(ch)) % 97;
  return rest === 1;
}

/** Ce qui manque encore pour pouvoir envoyer le dossier (liste vide = complet). */
export function missingForSubmission(
  party: KycParty,
  fields: Record<string, unknown>,
  documents: Pick<KycDocument, "kind" | "expires_at">[],
): string[] {
  const missing: string[] = [];
  for (const f of REQUIRED_FIELDS[party]) {
    if (!String(fields[f.key] ?? "").trim()) missing.push(f.label);
  }
  if (fields.siret && !isValidSiret(String(fields.siret))) missing.push("SIRET valide");
  if (party === "freelance" && fields.iban && !isValidIban(String(fields.iban))) missing.push("IBAN valide");
  const today = new Date().toISOString().slice(0, 10);
  for (const d of REQUIRED_DOCS[party]) {
    const doc = documents.find((x) => x.kind === d.kind);
    if (!doc) missing.push(d.label);
    else if (d.expires && (!doc.expires_at || doc.expires_at < today)) missing.push(`${d.label} (date de validité)`);
  }
  return missing;
}
