import { palettes, type PaletteName } from "@/lib/palettes";

// Contenus de l'accueil. Les [placeholders] restent tels quels en attendant le vrai contenu.

export const HERO = {
  // « Plateforme Freelance » / « Fractional Leaders » (jamais « management de transition »)
  title: "Plateforme Freelance",
  titleHighlight: "Freelance",
  titleSecond: "Fractional Leaders",
  // Un soulignement rose passe d'une fonction à l'autre sous le titre
  functions: ["RPO", "DRH", "CFO", "COO", "CRO", "CTO"],
  subtitle: [
    "Des dirigeants et des recruteurs freelance pour les entreprises Tech & Digital, à temps plein ou quelques jours par semaine. En quelques jours, pas en quelques mois.",
  ],
  primary: "Partager un besoin",
  secondary: "Je suis freelance",
  badgeChip: "Tech & Digital",
  reassurance: "Fractional et temps plein",
};

export type Recruiter = {
  initials: string;
  name: string;
  role: string;
  /** Fonction (rpo, drh, cfo, coo, cro, cto). */
  vertical: string;
  rhythm: string;
  xp: string;
  palette: PaletteName;
};

// Profils fictifs, pour illustrer la plateforme en attendant les vrais.
export const RECRUITERS: Recruiter[] = [
  { initials: "JM", name: "Julie M.", role: "Recruteuse Tech & Produit", vertical: "rpo", rhythm: "Temps plein", xp: "9 ans", palette: "sage" },
  { initials: "TR", name: "Thomas R.", role: "Recruteur Tech", vertical: "rpo", rhythm: "3 j / sem", xp: "6 ans", palette: "blue" },
  { initials: "CM", name: "Camille M.", role: "DRH part-time", vertical: "drh", rhythm: "3 j / sem", xp: "12 ans", palette: "apricot" },
  { initials: "VB", name: "Valérie B.", role: "DRH · Transformation RH", vertical: "drh", rhythm: "2 j / sem", xp: "15 ans", palette: "apricot" },
  { initials: "TL", name: "Thomas L.", role: "CFO fractional · ex-Qonto", vertical: "cfo", rhythm: "2 j / sem", xp: "15 ans", palette: "lilac" },
  { initials: "YK", name: "Youssef K.", role: "CFO · levées de fonds", vertical: "cfo", rhythm: "Temps plein", xp: "13 ans", palette: "lilac" },
  { initials: "AD", name: "Aminata D.", role: "COO · scaling des opérations", vertical: "coo", rhythm: "3 j / sem", xp: "14 ans", palette: "sand" },
  { initials: "RP", name: "Rohit P.", role: "COO · supply chain", vertical: "coo", rhythm: "Temps plein", xp: "11 ans", palette: "sand" },
  { initials: "SB", name: "Sylvie B.", role: "CRO · ouverture de marché", vertical: "cro", rhythm: "Temps plein", xp: "14 ans", palette: "blue" },
  { initials: "KB", name: "Karim B.", role: "Head of Sales · SaaS B2B", vertical: "cro", rhythm: "2 j / sem", xp: "12 ans", palette: "blue" },
  { initials: "LN", name: "Lina N.", role: "CTO · intégration IA", vertical: "cto", rhythm: "3 j / sem", xp: "16 ans", palette: "teal" },
  { initials: "MG", name: "Marc G.", role: "Head of AI · data", vertical: "cto", rhythm: "2 j / sem", xp: "10 ans", palette: "teal" },
];

export const LOGOS = ["Maison Vérane", "Groupe Altor", "Solvée", "[Logo client]", "[Logo client]", "[Logo client]", "[Logo client]"];

export const STEPS = [
  { num: "Étape 01", title: "Partagez votre besoin", desc: "On qualifie ensemble l'enjeu, le temps utile et le budget." },
  { num: "Étape 02", title: "Un profil en 48 h", desc: "Un freelance senior, présélectionné sur la fonction et vos enjeux." },
  { num: "Étape 03", title: "Démarrage en 1 semaine", desc: "Contrat, conformité, onboarding : puis un suivi régulier de la mission." },
];

export const ASSETS = [
  { icon: "shield", title: "Profils vérifiés", desc: "Identité, statut, parcours et références contrôlés avant la première mission.", featured: true },
  { icon: "clock", title: "Fractional ou temps plein", desc: "Quelques jours par semaine ou à plein temps. Vous ajustez selon vos besoins." },
  { icon: "team", title: "Intégré à votre équipe", desc: "Vos outils, vos rituels, vos objectifs. Un dirigeant qui travaille avec vous." },
  { icon: "pulse", title: "Spécialisés par fonction", desc: "RPO, DRH, CFO, COO, CRO, CTO : un expert qui connaît vos enjeux." },
] as const;

export const FREELANCE_SPACE = [
  { label: "Mission CFO · Scale-up SaaS · 2 j/sem.", status: "En cours", bg: "#E8F5EE", fg: "#17663F" },
  { label: "CRA d'octobre · 8 jours", status: "Validé par le client", bg: palettes.sand.soft, fg: palettes.sand.ink },
  { label: "Facture d'octobre", status: "Envoyée", bg: palettes.blue.soft, fg: palettes.blue.ink },
  { label: "Nouvelle mission proposée", status: "À consulter", bg: "#FFE3EC", fg: "#8F1747" },
];

export const STUDIO_TILES: { title: string; desc: string; palette: PaletteName; pct: string }[] = [
  { title: "Onboarding", desc: "Parcours des recrues", palette: "apricot", pct: "80%" },
  { title: "Assistant RH", desc: "Questions salariés", palette: "blue", pct: "64%" },
  { title: "Budget RH", desc: "Budget vs réel", palette: "lilac", pct: "68%" },
  { title: "Engagement", desc: "Pulses et plans d’action", palette: "teal", pct: "72%" },
];

export const RESOURCES: { kind: string; title: string; meta: string; palette: PaletteName }[] = [
  { kind: "Article", title: "[Titre d’article : RPO freelance vs cabinet]", meta: "Blog · [x] min de lecture", palette: "apricot" },
  { kind: "Podcast", title: "[Titre d’épisode]", meta: "Podcast · [durée]", palette: "lilac" },
  { kind: "Guide", title: "[Titre de guide : outiller ses RH avec l’IA]", meta: "Guide · PDF", palette: "teal" },
];

// ── Refonte 2027 ────────────────────────────────────────────────────────────

/** Rangée de réassurance sous le hero (promesses validées uniquement). */
export const HERO_TRUST = {
  avatars: ["JM", "CM", "TL", "LN"] as const,
  lead: "700+ experts vérifiés",
  points: ["Profil sous 48 h", "Sans engagement"],
};

/**
 * Démo « brief → matching » : un besoin se tape tout seul, l'IA en extrait les critères,
 * puis les profils correspondants apparaissent. Un exemple par fonction (onglets).
 * Profils fictifs en attendant les vrais : la démo illustre le produit.
 */
export type Brief = { domain: string; text: string; criteria: string[]; matches: { name: string; score: number }[] };
export const BRIEFS: Brief[] = [
  {
    domain: "RPO",
    text: "Je cherche un recruteur pour 3 développeurs backend, à Paris en hybride, dès que possible.",
    criteria: ["RPO Tech", "Paris · hybride", "Dès que possible", "3 postes"],
    matches: [{ name: "Julie M.", score: 94 }, { name: "Thomas R.", score: 88 }],
  },
  {
    domain: "DRH",
    text: "Scale-up de 120 personnes : on cherche un DRH 3 jours par semaine pour structurer la rémunération et les relations sociales.",
    criteria: ["DRH", "3 j / sem", "Compensations & bénéfices", "Relations sociales"],
    matches: [{ name: "Camille M.", score: 93 }, { name: "Valérie B.", score: 86 }],
  },
  {
    domain: "CFO",
    text: "Après notre série A, besoin d'un CFO 2 jours par semaine pour le budget, la trésorerie et le reporting investisseurs.",
    criteria: ["CFO", "2 j / sem", "Trésorerie", "Budget & Forecast"],
    matches: [{ name: "Thomas L.", score: 95 }, { name: "Youssef K.", score: 84 }],
  },
  {
    domain: "COO",
    text: "Nous ouvrons deux nouveaux marchés : il nous faut un COO pour structurer les process et manager les équipes ops.",
    criteria: ["COO", "Ouverture de marché", "Structuration & process", "Management d'équipe"],
    matches: [{ name: "Aminata D.", score: 92 }, { name: "Rohit P.", score: 81 }],
  },
  {
    domain: "CRO",
    text: "On veut ouvrir l'Allemagne et monter une équipe de 5 commerciaux : CRO à temps plein, démarrage en janvier.",
    criteria: ["CRO", "Temps plein", "Expansion internationale", "Management d'équipe"],
    matches: [{ name: "Sylvie B.", score: 96 }, { name: "Karim B.", score: 79 }],
  },
  {
    domain: "CTO",
    text: "Startup SaaS : on cherche un CTO 3 jours par semaine pour intégrer l'IA générative au produit et structurer l'équipe tech.",
    criteria: ["CTO", "3 j / sem", "Intégration IA / LLM", "Management d'équipes tech"],
    matches: [{ name: "Lina N.", score: 94 }, { name: "Marc G.", score: 87 }],
  },
];

/** Chiffres clés (promesses validées : 48 h ; communauté annoncée dans le hero). */
export const PROOF = [
  { value: "48", unit: "h", label: "pour recevoir vos premiers profils" },
  { value: "2 à 5", unit: "j", label: "par semaine, selon votre besoin réel" },
  { value: "700", unit: "+", label: "experts freelance qualifiés" },
];

/** Cadre administratif : la liste se coche toute seule dans la carte sombre. */
export const ADMIN_CHECKLIST = ["Contrat de mission signé", "KYC vérifié", "CRA validé chaque mois", "Facture unique émise"];

export const FINAL_CTA = {
  title: "Votre prochain dirigeant",
  titleEnd: "est peut-être déjà disponible.",
  text: "Décrivez votre besoin en quelques lignes : vous recevez des profils sous 48 h.",
  primary: "Partager un besoin",
  secondary: "Je suis freelance",
};
