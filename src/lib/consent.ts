/**
 * Consentement aux cookies (bandeau CookieConsent). Les services tiers qui déposent des
 * cookies (chat Crisp) ne se chargent qu'après « Accepter » ; l'événement prévient les
 * composants déjà affichés au moment du choix.
 */
export const CONSENT_KEY = "kistone_cookie_consent";
export const CONSENT_EVENT = "kistone:consent";
export type Consent = "accepted" | "refused";

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "refused" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}
