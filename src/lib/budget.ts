/** Erreur de saisie du budget TJM d'un besoin, ou null s'il est valide (min < max). */
export function budgetError(min: string, max: string): string | null {
  const lo = min ? parseInt(min) : null;
  const hi = max ? parseInt(max) : null;
  if ((lo !== null && lo <= 0) || (hi !== null && hi <= 0)) return "Le TJM doit être positif.";
  if (lo !== null && hi !== null && lo >= hi) return "Le TJM min doit être inférieur au TJM max.";
  return null;
}
