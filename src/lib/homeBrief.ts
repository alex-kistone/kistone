/**
 * Besoin tapé dans la démo de l'accueil, repris par /besoin pour pré-remplir la fiche.
 * Transmis par le stockage de session (jamais dans l'URL) et lu une seule fois.
 */
const KEY = "kistone-home-brief";

export function saveHomeBrief(text: string) {
  try { sessionStorage.setItem(KEY, text); } catch { /* stockage indisponible */ }
}

export function takeHomeBrief(): string | null {
  try {
    const text = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return text?.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
