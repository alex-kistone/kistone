/**
 * Fonctions du cabinet de management de transition : le métier d'un freelance et la fonction
 * recherchée par un client. Les identifiants sont ceux des fiches de src/content/transition.ts
 * (même ordre) et des contraintes en base (recruiter_profiles.fonction, need_requests.fonction) :
 * en ajouter un impose une migration.
 */
export const FONCTIONS = [
  { value: "direction-generale", label: "Direction générale" },
  { value: "finance", label: "Finance" },
  { value: "rh", label: "Ressources humaines" },
  { value: "logistique", label: "Logistique" },
  { value: "commerce", label: "Commerce" },
  { value: "marketing", label: "Marketing" },
  { value: "juridique", label: "Juridique" },
  { value: "rse", label: "RSE" },
  { value: "dsi-innovation-digitale", label: "DSI et innovation digitale" },
  { value: "operations-industrielles", label: "Opérations industrielles" },
  { value: "recrutement", label: "Recrutement (RPO)" },
] as const;

export type Fonction = (typeof FONCTIONS)[number]["value"];

export const isFonction = (v: unknown): v is Fonction => FONCTIONS.some((f) => f.value === v);
export const fonctionLabel = (v: string | null | undefined) =>
  v === "autre" ? "Autre" : FONCTIONS.find((f) => f.value === v)?.label ?? null;

/** Niveaux d'anglais proposés au freelance (stockés dans recruiter_profiles.languages). */
export const ENGLISH_LEVELS = [
  { value: "Notions", label: "Notions" },
  { value: "Intermédiaire", label: "Intermédiaire (B1-B2)" },
  { value: "Courant", label: "Courant (C1)" },
  { value: "Bilingue", label: "Bilingue" },
] as const;

/** Demande de rappel déposée sur le site (formulaire « Être rappelé·e par un associé »). */
export interface CallbackRequest {
  contact_name: string;
  company: string;
  phone: string;
  /** Une des FONCTIONS, ou « autre ». */
  fonction: string;
  brief: string | null;
  /** Formulaire et page d'origine, pour Alex. */
  source: string | null;
}

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Valide une demande de rappel ; renvoie un message d'erreur en cas de problème. */
export function parseCallbackRequest(body: Record<string, unknown>): CallbackRequest | string {
  const contact_name = text(body.name, 120);
  const company = text(body.company, 160);
  const phone = text(body.phone, 40);
  if (!contact_name || !company || !phone) return "Merci de renseigner votre nom, votre entreprise et votre téléphone.";
  if (phone.replace(/\D/g, "").length < 6) return "Numéro de téléphone invalide.";
  const fonction = isFonction(body.fonction) ? body.fonction : "autre";
  const brief = text(body.message, 4000);
  const source = [text(body.source, 120), text(body.page, 200)].filter(Boolean).join(" · ");
  return { contact_name, company, phone, fonction, brief: brief || null, source: source || null };
}
