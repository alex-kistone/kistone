import { palettes, type PaletteName } from "@/lib/palettes";
import type { Vertical } from "@/lib/verticals";

// Contenus de l'accueil. Les [placeholders] restent tels quels en attendant le vrai contenu.

export const HERO = {
  // Plateforme freelance des experts IA (jamais « management de transition »)
  eyebrow: "Plateforme freelance des experts IA",
  titleLead: "Votre prochain",
  titleHighlight: "expert IA",
  titleEnd: "est déjà disponible.",
  subtitle:
    "AI Engineers, AI Product et AI Leaders sélectionnés et qualifiés, en mission, en fractional ou en contract-to-hire. Un premier profil en 48 h, l'administratif géré pour vous.",
  primary: "Accéder aux profils",
  secondary: "Je suis freelance",
  note: "Profils qualifiés · Premier profil sous 48 h · Contrat, KYC et facturation inclus",
};

export type Recruiter = {
  initials: string;
  name: string;
  role: string;
  /** Famille (engineer, product, leader, rpo). */
  vertical: string;
  rhythm: string;
  xp: string;
  palette: PaletteName;
};

// Profils fictifs, pour illustrer la plateforme en attendant les vrais.
export const RECRUITERS: Recruiter[] = [
  { initials: "LN", name: "Lina N.", role: "AI Engineer · RAG", vertical: "engineer", rhythm: "Temps plein", xp: "8 ans", palette: "blue" },
  { initials: "HP", name: "Hugo P.", role: "LLM Engineer · agents", vertical: "engineer", rhythm: "Temps plein", xp: "6 ans", palette: "blue" },
  { initials: "CD", name: "Claire D.", role: "Product Manager IA", vertical: "product", rhythm: "Temps plein", xp: "9 ans", palette: "lilac" },
  { initials: "MG", name: "Marc G.", role: "Head of AI", vertical: "leader", rhythm: "2 j / sem", xp: "14 ans", palette: "teal" },
  { initials: "SK", name: "Sami K.", role: "MLOps Engineer", vertical: "engineer", rhythm: "4 j / sem", xp: "9 ans", palette: "blue" },
  { initials: "JM", name: "Julie M.", role: "Tech recruiter · IA & data", vertical: "rpo", rhythm: "Temps plein", xp: "9 ans", palette: "sage" },
  { initials: "YB", name: "Yanis B.", role: "Product Owner · produits LLM", vertical: "product", rhythm: "4 j / sem", xp: "7 ans", palette: "lilac" },
  { initials: "NR", name: "Nadia R.", role: "CTO · IA", vertical: "leader", rhythm: "3 j / sem", xp: "16 ans", palette: "teal" },
  { initials: "EL", name: "Emma L.", role: "AI Designer", vertical: "product", rhythm: "Temps plein", xp: "8 ans", palette: "lilac" },
  { initials: "AT", name: "Adam T.", role: "Data engineer · IA", vertical: "engineer", rhythm: "Temps plein", xp: "7 ans", palette: "blue" },
  { initials: "PV", name: "Paul V.", role: "Chief AI Officer", vertical: "leader", rhythm: "2 j / sem", xp: "18 ans", palette: "teal" },
  { initials: "TR", name: "Thomas R.", role: "Tech recruiter", vertical: "rpo", rhythm: "3 j / sem", xp: "6 ans", palette: "sage" },
];

export const LOGOS = ["Maison Vérane", "Groupe Altor", "Solvée", "[Logo client]", "[Logo client]", "[Logo client]", "[Logo client]"];

export const STEPS = [
  { num: "Étape 01", title: "Partagez votre besoin", desc: "Quelques lignes suffisent : l'IA en extrait les critères, on les qualifie avec vous." },
  { num: "Étape 02", title: "Matching et profil en 48 h", desc: "Un expert IA sélectionné et qualifié en entretien, choisi pour votre contexte." },
  { num: "Étape 03", title: "Démarrage en 1 semaine", desc: "Contrat, KYC et onboarding gérés : l'expert démarre, on suit la mission avec vous." },
];

export const ASSETS = [
  { icon: "shield", title: "Profils sélectionnés et qualifiés", desc: "Parcours, projets IA et références évalués en entretien avant la première mission.", featured: true },
  { icon: "pulse", title: "Matching sur vos critères", desc: "Stack, cas d'usage, séniorité, rythme et budget : seuls les profils pertinents remontent." },
  { icon: "clock", title: "Réactivité", desc: "Un premier profil en 48 h et un démarrage en une semaine, pas en trois mois." },
  { icon: "team", title: "Le bon format", desc: "Mission, fractional ou contract-to-hire : vous ajustez selon votre besoin." },
] as const;

export const FREELANCE_SPACE = [
  { label: "Mission AI Engineer · Scale-up SaaS", status: "En cours", bg: "#E8F5EE", fg: "#17663F" },
  { label: "CRA d'octobre · 18 jours", status: "Validé par le client", bg: palettes.sand.soft, fg: palettes.sand.ink },
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
  { kind: "Comparatif", title: "Dirigeants fractional et intérim : les acteurs en France", meta: "Guide · 11 acteurs", palette: "lilac" },
  { kind: "Guide", title: "[Titre de guide : outiller ses RH avec l’IA]", meta: "Guide · PDF", palette: "teal" },
];

/**
 * Démo « brief → matching » : un besoin se tape tout seul, l'IA en extrait les critères,
 * puis les profils correspondants apparaissent. Un exemple par fonction (onglets).
 * Profils fictifs en attendant les vrais : la démo illustre le produit.
 */
export type Brief = { vertical: Vertical; domain: string; text: string; criteria: string[]; matches: { name: string; score: number }[] };
export const BRIEFS: Brief[] = [
  {
    vertical: "engineer",
    domain: "AI Engineer",
    text: "Notre POC d'assistant interne marche en démo : on cherche un AI Engineer pour industrialiser le RAG et le passer en production.",
    criteria: ["AI Engineer", "RAG & recherche sémantique", "MLOps / LLMOps", "Mission 6 mois"],
    matches: [{ name: "Lina N.", score: 95 }, { name: "Hugo P.", score: 88 }],
  },
  {
    vertical: "product",
    domain: "AI Product",
    text: "Nous lançons un copilote pour nos clients : besoin d'un Product Manager IA pour prioriser les cas d'usage et piloter la roadmap.",
    criteria: ["AI Product", "Discovery & cas d'usage IA", "Roadmap & priorisation", "Temps plein"],
    matches: [{ name: "Claire D.", score: 93 }, { name: "Yanis B.", score: 86 }],
  },
  {
    vertical: "leader",
    domain: "AI Leader",
    text: "Le comité de direction veut une stratégie IA : on cherche un Head of AI 2 jours par semaine pour la feuille de route et la gouvernance.",
    criteria: ["AI Leader", "2 j / sem", "Stratégie IA & GenAI", "Gouvernance & AI Act"],
    matches: [{ name: "Marc G.", score: 94 }, { name: "Paul V.", score: 87 }],
  },
  {
    vertical: "rpo",
    domain: "Tech recruiter",
    text: "On veut internaliser notre équipe IA : un recruteur pour 4 AI Engineers en CDI, à Paris en hybride, dès que possible.",
    criteria: ["Tech recruiter", "Data/AI", "Paris · hybride", "4 postes"],
    matches: [{ name: "Julie M.", score: 94 }, { name: "Thomas R.", score: 88 }],
  },
];

/** Chiffres clés (promesses validées uniquement). */
export const KEY_FIGURES = [
  { value: "48", unit: "h", label: "pour recevoir un premier profil qualifié" },
  { value: "1", unit: "semaine", label: "pour démarrer la mission" },
  { value: "30", unit: "min", label: "pour cadrer votre besoin avec nous" },
];

/** Cadre administratif : la liste se coche toute seule dans la carte sombre. */
export const ADMIN_CHECKLIST = ["Contrat de mission signé", "KYC vérifié", "CRA validé chaque mois", "Facture unique émise"];

export const FINAL_CTA = {
  title: "Votre prochain expert IA",
  titleEnd: "est déjà disponible.",
  text: "Décrivez votre besoin en quelques lignes : vous recevez un premier profil qualifié sous 48 h.",
  primary: "Accéder aux profils",
  secondary: "Je suis freelance",
};
