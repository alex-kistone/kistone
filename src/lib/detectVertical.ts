import type { Vertical } from "@/lib/verticals";

/**
 * Famille évoquée dans un besoin tapé librement (accueil), pour basculer l'onglet pendant
 * la frappe. Indicatif seulement : l'IA de /besoin tranche ensuite. Première mention gagnante.
 */
const PATTERNS: [Vertical, RegExp][] = [
  ["leader", /\b(cto|caio|chief ai officer|head of (ai|data|engineering|tech)|vp (engineering|ai)|directeur technique|directrice technique|directeur ia|directrice ia)\b/i],
  ["product", /\b(product manager|product owner|chef de produit|cheffe de produit|pm ia|ai designer|designer ia|ux ia|head of product|cpo)\b/i],
  ["engineer", /\b(ai engineer|llm engineer|ml engineer|machine learning|mlops|llmops|rag|agents? ia|ai agents?|data engineer|data scientist|ing[ée]nieur(e)? (ia|ml|data)|d[ée]veloppeur(se)? ia|genai)\b/i],
  ["rpo", /\b(rpo|tech recruiter|recruteur|recruteuse|recruteurs|talent acquisition|recrutement)\b/i],
];

export function detectVertical(text: string): Vertical | null {
  let best: { v: Vertical; at: number } | null = null;
  for (const [v, re] of PATTERNS) {
    const m = re.exec(text);
    if (m && (!best || m.index < best.at)) best = { v, at: m.index };
  }
  return best?.v ?? null;
}
