// Page « Tarifs du recruteur freelance » (/tarifs-recruteur-freelance) : SEO et moteurs IA.
//
// LES CHIFFRES SONT À COMPLÉTER PAR ALEX : chaque `null` s'affiche « [à compléter] ».
// Tant qu'il en reste un, la page n'est ni pré-rendue (404 en production), ni dans le sitemap,
// ni dans llms.txt, ni dans les menus : elle ne peut pas partir en ligne à moitié remplie.
// En local, elle reste visible sur http://localhost:8090/tarifs-recruteur-freelance pour la relire.

/** Fourchette de TJM facturé au client, en € HT par jour : [min, max]. « — » = non proposé. */
export type Cell = [number, number] | "—" | null;

export const PRICING_PATH = "/tarifs-recruteur-freelance";

/** Niveaux de séniorité (colonnes de la grille). Libellés modifiables. */
export const LEVELS = ["Confirmé · 3 à 5 ans", "Senior · 5 à 10 ans", "Expert · 10 ans et plus"] as const;

/** Grille par fonction recrutée : TJM facturé au client, € HT / jour, une case par niveau. */
export const GRID: { fonction: string; scope: string; cells: [Cell, Cell, Cell] }[] = [
  { fonction: "Tech", scope: "Engineering, SI, infrastructure", cells: [null, null, null] },
  { fonction: "Data & IA", scope: "Data engineers, data scientists, ML", cells: [null, null, null] },
  { fonction: "Product", scope: "Product managers, designers", cells: [null, null, null] },
  { fonction: "Sales & Marketing", scope: "Fonctions GTM", cells: [null, null, null] },
  { fonction: "Finance", scope: "Contrôle de gestion, comptabilité, FP&A", cells: [null, null, null] },
  { fonction: "Industrie", scope: "Production, maintenance, supply chain", cells: [null, null, null] },
  { fonction: "Généraliste", scope: "Toutes fonctions", cells: [null, null, null] },
  { fonction: "Head of Talent Acquisition", scope: "Structurer la fonction recrutement", cells: [null, null, null] },
];

/** Répartition du TJM payé par le client (décision d'Alex, 2026-11-24 : en %, sans montant). */
export const SPLIT = { freelance: 80, kistone: 20 };

/**
 * Exemple chiffré : une mission type, comparée au coût d'un cabinet pour les mêmes recrutements.
 * Tout est à compléter ; les totaux se calculent seuls.
 */
export const EXAMPLE: {
  tjm: number | null; // TJM facturé, € HT / jour
  daysPerWeek: number | null;
  weeks: number | null;
  hires: number | null; // recrutements réalisés pendant la mission
  salary: number | null; // salaire annuel brut moyen des postes, €
  cabinetFeePct: number | null; // honoraires du cabinet, % du salaire annuel (le site annonce « souvent 20 à 25 % »)
} = { tjm: null, daysPerWeek: null, weeks: null, hires: null, salary: null, cabinetFeePct: null };

export const PRICING = {
  date: "2026-11-24",
  seoTitle: "Tarif d'un recruteur freelance (RPO) : TJM par fonction et séniorité",
  seoDescription: "Combien coûte un recruteur freelance ? TJM par fonction et niveau d'expérience, répartition du tarif, exemple chiffré et comparaison avec un cabinet de recrutement.",
  title: "Combien coûte un recruteur freelance ?",
  lead: "Un recruteur freelance (RPO) est facturé au jour, sans honoraires au placement. Voici les tarifs pratiqués dans le réseau Kistone, par fonction recrutée et par niveau d'expérience, et ce que couvre chaque euro.",
  /** Ce que paie le client : les quatre principes, déjà annoncés sur le site. */
  principles: [
    { title: "Facturé au jour", desc: "Un TJM (taux journalier moyen) en € HT, sur les seuls jours réalisés." },
    { title: "Sans honoraires au placement", desc: "Aucun pourcentage du salaire à l'embauche, quel que soit le nombre de recrutements." },
    { title: "Validé chaque mois", desc: "Les jours sont déclarés dans un compte rendu d'activité (CRA) que vous validez avant facturation." },
    { title: "Rythme au choix", desc: "À temps plein ou quelques jours par semaine, selon votre volume de postes." },
  ],
  /** Ce que couvre la part Kistone : uniquement des services déjà décrits sur le site. */
  kistoneCovers: [
    "La sélection et la qualification des recruteurs en entretien (parcours, recrutements réalisés, références)",
    "La présentation d'un premier profil qualifié sous 48 h",
    "Le contrat de mission et la conformité (KYC)",
    "Le suivi des jours (CRA) et une facture unique chaque mois",
    "Le paiement du recruteur chaque fin de mois et le suivi de la mission avec vous",
  ],
  variables: [
    { title: "La fonction recrutée", desc: "Recruter des profils Tech, Data ou des dirigeants demande une expertise de marché plus rare que des fonctions plus courantes." },
    { title: "L'expérience du recruteur", desc: "Un recruteur senior apporte un réseau, une méthode et une autonomie qui se reflètent dans son TJM." },
    { title: "Le périmètre de la mission", desc: "Exécuter des recrutements ou structurer toute la fonction (process, outils, scorecards, équipe) : un Head of TA intervient sur un périmètre plus large." },
  ],
};

/** Toutes les cases et l'exemple sont remplis : la page peut être publiée. */
export const PRICING_READY = GRID.every((r) => r.cells.every((c) => c !== null)) && Object.values(EXAMPLE).every((v) => v !== null);

const eur = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
/** « 1 250 € » ; « [à compléter] » tant que la valeur manque. */
export const money = (n: number | null) => (n === null ? "[à compléter]" : `${eur.format(n)} €`);
export const cellLabel = (c: Cell) => (c === null ? "[à compléter]" : c === "—" ? "—" : `${eur.format(c[0])} – ${eur.format(c[1])} €`);

/** Fourchette globale de la grille (hors cases vides), pour la FAQ et les données structurées. */
export function gridRange(rows = GRID): [number, number] | null {
  const vals = rows.flatMap((r) => r.cells.filter((c): c is [number, number] => Array.isArray(c))).flat();
  return vals.length ? [Math.min(...vals), Math.max(...vals)] : null;
}

/** Totaux de l'exemple (null tant qu'une donnée manque). */
export function exampleTotals() {
  const { tjm, daysPerWeek, weeks, hires, salary, cabinetFeePct } = EXAMPLE;
  const days = daysPerWeek !== null && weeks !== null ? daysPerWeek * weeks : null;
  const rpo = days !== null && tjm !== null ? days * tjm : null;
  const cabinet = hires !== null && salary !== null && cabinetFeePct !== null ? Math.round((hires * salary * cabinetFeePct) / 100) : null;
  const perHire = (total: number | null) => (total !== null && hires ? Math.round(total / hires) : null);
  return { days, rpo, cabinet, rpoPerHire: perHire(rpo), cabinetPerHire: perHire(cabinet) };
}
