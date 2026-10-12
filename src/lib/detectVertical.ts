import type { Vertical } from "@/lib/verticals";

/**
 * Fonction évoquée dans un besoin tapé librement (accueil), pour basculer l'onglet pendant
 * la frappe. Indicatif seulement : l'IA de /besoin tranche ensuite. Première mention gagnante.
 */
const PATTERNS: [Vertical, RegExp][] = [
  ["cto", /\b(cto|directeur technique|directrice technique|head of (engineering|tech|ai)|vp engineering)\b/i],
  ["cfo", /\b(cfo|daf|directeur financier|directrice financière|head of finance)\b/i],
  ["drh", /\b(drh|rrh|directeur des ressources humaines|directrice des ressources humaines|head of people|people manager)\b/i],
  ["coo", /\b(coo|directeur des opérations|directrice des opérations|head of ops|head of operations)\b/i],
  ["cro", /\b(cro|directeur commercial|directrice commerciale|head of sales|vp sales|chief revenue)\b/i],
  ["rpo", /\b(rpo|recruteur|recruteuse|recruteurs|talent acquisition|recrutement)\b/i],
];

export function detectVertical(text: string): Vertical | null {
  let best: { v: Vertical; at: number } | null = null;
  for (const [v, re] of PATTERNS) {
    const m = re.exec(text);
    if (m && (!best || m.index < best.at)) best = { v, at: m.index };
  }
  return best?.v ?? null;
}
