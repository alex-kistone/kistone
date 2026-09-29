/**
 * URL de profil LinkedIn, obligatoire pour les freelances : c'est la clé de
 * rapprochement avec l'ATS (Jarvi). On la stocke toujours sous la même forme
 * canonique : https://www.linkedin.com/in/<identifiant>
 */
const PROFILE_PATH = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]{3,100})\/?(?:[?#].*)?$/i;

/** Retourne l'URL canonique, ou null si ce n'est pas une URL de profil LinkedIn. */
export function normalizeLinkedinUrl(input: string | null | undefined): string | null {
  const match = (input ?? "").trim().match(PROFILE_PATH);
  return match ? `https://www.linkedin.com/in/${match[1]}` : null;
}

export const LINKEDIN_HINT = "Format attendu : linkedin.com/in/votre-identifiant";
