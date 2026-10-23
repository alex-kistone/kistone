/**
 * Les familles (verticales) de la plateforme : trois familles d'experts IA (Engineer, Product,
 * Leader) et le RPO « Tech Recruiter », qui aide le client à internaliser ses talents IA en CDI.
 * Chaque verticale a ses spécialités, son projet et son champ Jarvi ; le socle (comptes,
 * dossiers, contrats, CRA, facturation) est commun.
 *
 * Partagé par le site et les fonctions : pas d'API Deno ici (importé via src/lib/verticals.ts).
 * Ajouter une verticale = une entrée ici + la valeur dans les contraintes SQL `*_vertical_check`.
 *
 * Vocabulaire : jamais « management de transition ». On parle de mission, de temps plein ou de
 * fractional (quelques jours par semaine).
 */

export type Vertical = "rpo" | "engineer" | "product" | "leader";

export interface VerticalConfig {
  id: Vertical;
  /** Libellé court, affiché dans les onglets et les badges. */
  short: string;
  /** Intitulé de la famille. */
  label: string;
  /** Famille du choix client : « AI » pour les experts IA, « RPO » pour le recrutement. */
  group: "AI" | "RPO";
  /** Profil recherché, après « Je recherche » (« un Tech Recruiter », « un AI Engineer »). */
  seeking: string;
  /** Fiche de poste publique : /recruter/<pageSlug>. */
  pageSlug: string;
  /** Rôles couverts, pour les cartes (« AI Engineer · LLM Engineer »). */
  roles: string;
  /** Une ligne de description (landing, choix de la famille). */
  description: string;
  /** Teinte de carte du design system (jamais rose). */
  palette: "apricot" | "blue" | "sage" | "lilac" | "sand" | "teal" | "olive" | "slate";
  /**
   * Spécialités proposées au freelance et au client. Pour le RPO, ce sont les métiers recrutés
   * (taxonomy.ts) ; pour les autres, les valeurs du champ Jarvi de la verticale, au caractère près.
   */
  specialties: readonly string[];
  /** Valeur Jarvi ajoutée automatiquement quand le freelance est à temps partiel (« AI Leader Part-time »). */
  partTimeTag?: string;
  jarvi: {
    /** Valeur du champ Jarvi « Métier » (choix unique), identique au caractère près. */
    metier: string;
    /** Projet « New X via plateforme » où arrive tout freelance inscrit. */
    projectId: string | null;
    /** Champ Jarvi des spécialités de la verticale (null : pas encore créé, pas de synchro des spécialités). */
    specialtiesFieldId: string | null;
  };
}

// Listes validées par Alex le 2026-10-16 ; les valeurs sont créées dans les champs Jarvi
// « Spécialités AI Engineer / AI Product / AI Leader » à la première synchro.
const ENGINEER_SPECIALTIES = [
  "LLM & IA générative", "RAG & recherche sémantique", "Agents IA", "MLOps / LLMOps",
  "Infrastructure IA & GPU", "Fine-tuning & évaluation", "Machine learning",
  "Intégration IA (API, back-end)", "Data engineering", "Vision & NLP",
] as const;
const PRODUCT_SPECIALTIES = [
  "Product Manager IA", "Product Owner produits LLM", "AI Designer / UX IA", "Discovery & cas d'usage IA",
  "Évaluation & qualité des modèles", "Prompt & conversation design", "Roadmap & priorisation",
  "Go-to-market produit IA", "AI Act & conformité", "Product ops",
] as const;
const LEADER_SPECIALTIES = [
  "CTO", "Head of AI", "Chief AI Officer", "Stratégie IA & GenAI", "Transformation IA",
  "Gouvernance & AI Act", "Management d'équipes IA & data", "Build vs buy & plateformes",
  "Due diligence IA", "Acculturation des dirigeants",
] as const;

export const VERTICALS: readonly VerticalConfig[] = [
  {
    id: "engineer", short: "AI Engineer", label: "Ingénierie IA", group: "AI", seeking: "un AI Engineer", pageSlug: "ai-engineer",
    roles: "AI Engineer · LLM Engineer · MLOps",
    description: "LLM, RAG et agents, MLOps et infrastructure IA : des ingénieurs qui mettent l'IA en production.",
    palette: "blue", specialties: ENGINEER_SPECIALTIES,
    jarvi: { metier: "AI Engineer", projectId: "a8d4ac0f-d7fa-46b8-a8b3-3924bdc07d3e", specialtiesFieldId: "eaba6143-8e57-4384-89a4-08693de4e9c5" },
  },
  {
    id: "product", short: "AI Product", label: "Produit IA", group: "AI", seeking: "un AI Product", pageSlug: "ai-product-manager",
    roles: "Product Manager IA · AI Designer",
    description: "Product Managers, Product Owners et designers qui conçoivent des produits IA utiles.",
    palette: "lilac", specialties: PRODUCT_SPECIALTIES,
    jarvi: { metier: "AI Product", projectId: "627670cb-b090-4061-a534-fb5f195e4637", specialtiesFieldId: "26d7fa39-43fc-4c90-af0e-c790180bae2a" },
  },
  {
    id: "leader", short: "AI Leader", label: "Leadership IA", group: "AI", seeking: "un AI Leader", pageSlug: "ai-leader",
    roles: "CTO · Head of AI · Chief AI Officer",
    description: "CTO, Head of AI ou Chief AI Officer, en fractional ou en mission, pour porter votre stratégie IA.",
    palette: "teal", specialties: LEADER_SPECIALTIES, partTimeTag: "AI Leader Part-time",
    jarvi: { metier: "AI Leader", projectId: "a6d15b5e-1eaa-4153-a1f2-543af70c5aa8", specialtiesFieldId: "c5f1c316-4911-478b-bded-220bebe7c639" },
  },
  {
    id: "rpo", short: "RPO", label: "Tech Recruiter", group: "RPO", seeking: "un Tech Recruiter", pageSlug: "tech-recruiter",
    roles: "Tech Recruiter freelance",
    description: "Des recruteurs tech et IA intégrés à vos équipes pour internaliser vos talents en CDI.",
    palette: "sage", specialties: [], // métiers recrutés : METIERS (taxonomy.ts)
    jarvi: { metier: "Recruiter", projectId: "a28725c1-24c0-46b4-bb63-afd1854df1d9", specialtiesFieldId: "adc61fa4-ad68-4f12-983b-69afe9c03d4c" },
  },
];

export const VERTICAL_IDS = VERTICALS.map((v) => v.id);
/** Valeur par défaut des colonnes `vertical` en base. */
export const DEFAULT_VERTICAL: Vertical = "rpo";

export const verticalOf = (id: string | null | undefined): VerticalConfig =>
  VERTICALS.find((v) => v.id === id) ?? VERTICALS.find((v) => v.id === DEFAULT_VERTICAL)!;

export const isVertical = (id: unknown): id is Vertical => typeof id === "string" && (VERTICAL_IDS as string[]).includes(id);

/** Capacité « temps plein » en jours par semaine (une capacité absente vaut temps plein). */
export const FULL_TIME_DAYS = 5;

/** Libellé d'un rythme : « Temps plein » ou « 2 j / sem ». */
export const rhythmLabel = (days: number | null | undefined) =>
  !days || days >= FULL_TIME_DAYS ? "Temps plein" : `${days} j / sem`;

/** « RPO · Tech, Data/AI » ou « AI Engineer · RAG, Agents IA » : la famille et ce qui est attendu. */
export function needSummary(n: { vertical?: string | null; profile_types?: string[] | null; specialties?: string[] | null }): string {
  const v = verticalOf(n.vertical);
  const items = v.id === "rpo" ? n.profile_types ?? [] : n.specialties ?? [];
  return items.length ? `${v.short} · ${items.join(", ")}` : v.short;
}
