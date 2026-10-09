/**
 * Les départements (verticales) de la plateforme : RPO, la première, puis les fonctions
 * C-Level fractional. Chaque verticale a ses spécialités, son projet et son champ Jarvi ;
 * le socle (comptes, dossiers, contrats, CRA, facturation) est commun.
 *
 * Partagé par le site et les fonctions : pas d'API Deno ici (importé via src/lib/verticals.ts).
 * Ajouter une verticale = une entrée ici + la valeur dans les contraintes SQL `*_vertical_check`.
 *
 * Vocabulaire : jamais « management de transition ». On parle de temps plein ou de fractional
 * (quelques jours par semaine).
 */

export type Vertical = "rpo" | "drh" | "cfo" | "coo" | "cro" | "cto";

export interface VerticalConfig {
  id: Vertical;
  /** Libellé court, affiché dans les onglets et les badges. */
  short: string;
  /** Intitulé de la fonction. */
  label: string;
  /** Rôles couverts, pour les cartes (« CFO · DAF »). */
  roles: string;
  /** Une ligne de description (landing, choix de la fonction). */
  description: string;
  /** Teinte de carte du design system (jamais rose). */
  palette: "apricot" | "blue" | "sage" | "lilac" | "sand" | "teal";
  /**
   * Spécialités proposées au freelance et au client. Pour le RPO, ce sont les métiers recrutés
   * (taxonomy.ts) ; pour les autres, les valeurs du champ Jarvi de la verticale, au caractère près.
   */
  specialties: readonly string[];
  /** Valeur Jarvi ajoutée automatiquement quand le freelance est à temps partiel (« CFO Part-time »). */
  partTimeTag?: string;
  jarvi: {
    /** Projet « New X via plateforme » où arrive tout freelance inscrit. */
    projectId: string | null;
    /** Champ Jarvi des spécialités de la verticale (null : pas encore créé, pas de synchro des spécialités). */
    specialtiesFieldId: string | null;
  };
}

// Valeurs Jarvi relevées le 2026-10-09 (« Spécialité CFO », « Spécialité RH »). Les formats
// « CFO Part-time » / « DRH Part-time » ne sont pas proposés : ils se déduisent de la capacité.
const CFO_SPECIALTIES = [
  "Analyse de rentabilité", "Budget & Forecast", "Comptabilité", "Consolidation", "Controle de gestion",
  "FP&A", "M&A / Levée de fonds", "Process & outils", "Reporting / Closing", "Trésorerie",
] as const;
const DRH_SPECIALTIES = [
  "Compensations & bénéfices", "culture / Marque employeur", "Diversité & inclusion", "Formations",
  "HRBP", "HR Ops", "HR strategy", "Paye", "Relations sociales", "Transformation RH",
] as const;
// Listes proposées (créées dans Jarvi à la première synchro) : CTO axé IA, CRO et COO
// orientés management d'équipe et ouverture de marché.
const CTO_SPECIALTIES = [
  "Stratégie IA & GenAI", "Intégration IA / LLM", "Data & MLOps", "Architecture & scalabilité",
  "Management d'équipes tech", "Delivery & agilité", "Cloud & DevOps", "Cybersécurité",
  "Due diligence tech", "Produit & engineering",
] as const;
const CRO_SPECIALTIES = [
  "Management d'équipe commerciale", "Ouverture de marché", "Expansion internationale",
  "Stratégie go-to-market", "Sales Ops / RevOps", "Pricing", "Grands comptes",
  "Partenariats & channel", "Customer Success & rétention", "Structuration du pipeline",
] as const;
const COO_SPECIALTIES = [
  "Management d'équipe", "Structuration & process", "Scaling des opérations", "Ouverture de marché",
  "Supply chain & logistique", "Transformation & conduite du changement", "Pilotage de la performance",
  "Achats", "Service client", "Automatisation & outils",
] as const;

export const VERTICALS: readonly VerticalConfig[] = [
  {
    id: "rpo", short: "RPO", label: "Recrutement RPO", roles: "Recruteur freelance",
    description: "Des recruteurs seniors intégrés à vos équipes pour vos embauches.",
    palette: "sage", specialties: [], // métiers recrutés : METIERS (taxonomy.ts)
    jarvi: { projectId: "a28725c1-24c0-46b4-bb63-afd1854df1d9", specialtiesFieldId: "adc61fa4-ad68-4f12-983b-69afe9c03d4c" },
  },
  {
    id: "drh", short: "DRH", label: "Ressources humaines", roles: "DRH · CHRO",
    description: "Organisation, rémunération, relations sociales et structuration RH.",
    palette: "apricot", specialties: DRH_SPECIALTIES, partTimeTag: "DRH Part-time",
    jarvi: { projectId: "bbe43e4b-7a5a-4363-b937-4c218af120d8", specialtiesFieldId: "00a2639f-470d-4efb-93e2-83ababdafe5d" },
  },
  {
    id: "cfo", short: "CFO", label: "Finance", roles: "CFO · DAF",
    description: "Pilotage financier, closing, reporting investisseurs et levée de fonds.",
    palette: "lilac", specialties: CFO_SPECIALTIES, partTimeTag: "CFO Part-time",
    jarvi: { projectId: "4e8961fd-53f4-417d-9add-6a95ce4bf0a3", specialtiesFieldId: "f96c2a0c-dac9-4c86-bf3c-8b6dd20229a1" },
  },
  {
    id: "coo", short: "COO", label: "Opérations", roles: "COO · Head of Ops",
    description: "Process, scaling des opérations, pilotage de la performance.",
    palette: "sand", specialties: COO_SPECIALTIES,
    jarvi: { projectId: null, specialtiesFieldId: null }, // projet et champ Jarvi à créer
  },
  {
    id: "cro", short: "CRO", label: "Revenue", roles: "CRO · Head of Sales",
    description: "Stratégie commerciale, équipes, ouverture de marché et pipeline.",
    palette: "blue", specialties: CRO_SPECIALTIES,
    jarvi: { projectId: "673fb8cf-3e51-4abe-8887-b16f1e23ebfd", specialtiesFieldId: "b1d64ff3-dbf6-4cdf-ae53-5ac4ce0b0d29" },
  },
  {
    id: "cto", short: "CTO", label: "Tech, Data & IA", roles: "CTO · CDO · Head of AI",
    description: "Architecture, équipes tech, data et intégration de l'IA.",
    palette: "teal", specialties: CTO_SPECIALTIES,
    jarvi: { projectId: "f01d8cf4-86f8-4681-adbe-62abc4080fbe", specialtiesFieldId: "f09ec442-2d93-4bf5-b6b4-788e35d3a102" },
  },
];

export const VERTICAL_IDS = VERTICALS.map((v) => v.id);
export const DEFAULT_VERTICAL: Vertical = "rpo";

export const verticalOf = (id: string | null | undefined): VerticalConfig =>
  VERTICALS.find((v) => v.id === id) ?? VERTICALS[0];

export const isVertical = (id: unknown): id is Vertical => typeof id === "string" && (VERTICAL_IDS as string[]).includes(id);

/** Capacité « temps plein » en jours par semaine (une capacité absente vaut temps plein). */
export const FULL_TIME_DAYS = 5;

/** Libellé d'un rythme : « Temps plein » ou « 2 j / sem ». */
export const rhythmLabel = (days: number | null | undefined) =>
  !days || days >= FULL_TIME_DAYS ? "Temps plein" : `${days} j / sem`;

/** « RPO · Tech, Data » ou « CFO · Trésorerie, FP&A » : la fonction et ce qui est attendu. */
export function needSummary(n: { vertical?: string | null; profile_types?: string[] | null; specialties?: string[] | null }): string {
  const v = verticalOf(n.vertical);
  const items = v.id === "rpo" ? n.profile_types ?? [] : n.specialties ?? [];
  return items.length ? `${v.short} · ${items.join(", ")}` : v.short;
}
