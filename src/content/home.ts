import { palettes, type PaletteName } from "@/lib/palettes";
import type { Vertical } from "@/lib/verticals";

// Contenus de l'accueil. Les [placeholders] restent tels quels en attendant le vrai contenu.

export const HERO = {
  // Plateforme freelance IA et RPO (jamais « management de transition »)
  titleLead: "La plateforme freelance",
  titleHighlight: "experts IA & RPO",
  titleEnd: ".",
  subtitle:
    "AI Engineers, AI Product, AI Leaders et Tech recruiters (RPO) sélectionnés et qualifiés, en mission, en fractional ou en contract-to-hire. Un premier profil en 48 h, l’administratif géré pour vous.",
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
  /** Portrait d'illustration (public/people/) ; sans fichier, la carte affiche les initiales. */
  photo?: string;
};

// Profils fictifs, pour illustrer la plateforme en attendant les vrais.
export const RECRUITERS: Recruiter[] = [
  { initials: "LN", name: "Lina", role: "AI Engineer · RAG", vertical: "engineer", rhythm: "Temps plein", xp: "8 ans", palette: "blue", photo: "/people/lina.jpg" },
  { initials: "HP", name: "Hugo", role: "LLM Engineer · agents", vertical: "engineer", rhythm: "Temps plein", xp: "6 ans", palette: "blue", photo: "/people/hugo.jpg" },
  { initials: "CD", name: "Claire", role: "Product Manager IA", vertical: "product", rhythm: "Temps plein", xp: "9 ans", palette: "lilac", photo: "/people/camille.jpg" },
  { initials: "MG", name: "Marc", role: "Head of AI", vertical: "leader", rhythm: "2 j / sem", xp: "14 ans", palette: "teal", photo: "/people/marc.jpg" },
  { initials: "SK", name: "Sami", role: "MLOps Engineer", vertical: "engineer", rhythm: "4 j / sem", xp: "9 ans", palette: "blue", photo: "/people/sami.jpg" },
  { initials: "JM", name: "Julie", role: "Tech recruiter · IA & data", vertical: "rpo", rhythm: "Temps plein", xp: "9 ans", palette: "sage", photo: "/people/sarah.jpg" },
  { initials: "YB", name: "Yanis", role: "Product Owner · produits LLM", vertical: "product", rhythm: "4 j / sem", xp: "7 ans", palette: "lilac", photo: "/people/yanis.jpg" },
  { initials: "NR", name: "Nadia", role: "CTO · IA", vertical: "leader", rhythm: "3 j / sem", xp: "16 ans", palette: "teal", photo: "/people/nadia.jpg" },
  { initials: "EL", name: "Emma", role: "AI Designer", vertical: "product", rhythm: "Temps plein", xp: "8 ans", palette: "lilac", photo: "/people/emma.jpg" },
  { initials: "AT", name: "Adam", role: "Data engineer · IA", vertical: "engineer", rhythm: "Temps plein", xp: "7 ans", palette: "blue", photo: "/people/adam.jpg" },
  { initials: "PV", name: "Paul", role: "Chief AI Officer", vertical: "leader", rhythm: "2 j / sem", xp: "18 ans", palette: "teal", photo: "/people/thomas.jpg" },
  { initials: "TR", name: "Thomas", role: "Tech recruiter", vertical: "rpo", rhythm: "3 j / sem", xp: "6 ans", palette: "sage", photo: "/people/thomas-r.jpg" },
];

export const LOGOS = ["Maison Vérane", "Groupe Altor", "Solvée", "[Logo client]", "[Logo client]", "[Logo client]", "[Logo client]"];

export const STEPS: { num: string; title: string; desc: string; link?: { label: string; href: string } }[] = [
  { num: "Étape 01", title: "Partagez votre besoin", desc: "Quelques lignes suffisent : l'IA en extrait les critères (famille, stack, rythme, budget)." },
  {
    num: "Étape 02",
    title: "Un référent IA le cadre avec vous",
    desc: "30 minutes au téléphone pour préciser l'enjeu, le format et le budget. Puis un profil qualifié sous 48 h.",
    link: { label: "Réserver 30 minutes", href: "https://calendly.com/alexandre-kistone/30mins-meetup" },
  },
  { num: "Étape 03", title: "Démarrage en 1 semaine", desc: "Contrat, KYC et onboarding gérés : l'expert démarre, on suit la mission avec vous." },
];

/**
 * « Passer en production » : les situations qui amènent un client vers Kistone, chacune vers
 * la famille qui y répond. Le recrutement en CDI n'est jamais présenté comme un problème :
 * l'expert démarre et le Tech recruiter accélère l'embauche, les deux ensemble.
 */
export const PAIN = {
  titleA: "Une démo d'IA, c'est facile.",
  titleB: "La mettre en production, c'est un métier.",
  subtitle: "Les compétences IA sont rares, et les projets n'attendent pas. Par où commencez-vous ?",
  cards: [
    { tag: "POC bloqué", title: "Un prototype qui ne passe pas en production", desc: "La démo convainc, mais il faut fiabiliser, évaluer, sécuriser et déployer.", vertical: "engineer" as Vertical },
    { tag: "Expertise absente", title: "Personne dans l'équipe ne maîtrise l'IA", desc: "LLM, RAG, agents, évaluation : une compétence pointue dont vous avez besoin maintenant.", vertical: "product" as Vertical },
    { tag: "Pas de cap", title: "Beaucoup d'idées d'IA, pas de feuille de route", desc: "Il faut prioriser les cas d'usage, choisir les plateformes et poser la gouvernance.", vertical: "leader" as Vertical },
    { tag: "Recrutement long", title: "Un recrutement IA qui prend du temps", desc: "Un expert démarre en mission dès maintenant, et notre Tech recruiter accélère l'embauche en CDI.", vertical: "rpo" as Vertical },
  ],
};

/**
 * Les besoins les plus fréquents : un rôle précis, qui pré-remplit le dépôt de besoin.
 * Le budget affiché et repris est celui de la famille (src/lib/indicativeBudget.ts).
 */
export const ROLE_CATALOG: { role: string; vertical: Vertical }[] = [
  { role: "LLM Engineer", vertical: "engineer" },
  { role: "RAG Engineer", vertical: "engineer" },
  { role: "AI Agents Engineer", vertical: "engineer" },
  { role: "MLOps / LLMOps Engineer", vertical: "engineer" },
  { role: "AI Product Manager", vertical: "product" },
  { role: "Product Owner IA", vertical: "product" },
  { role: "AI Designer", vertical: "product" },
  { role: "Fractional CTO", vertical: "leader" },
  { role: "Head of AI", vertical: "leader" },
  { role: "Chief AI Officer", vertical: "leader" },
  { role: "Tech recruiter IA & data", vertical: "rpo" },
  { role: "Recruiter GTM", vertical: "rpo" },
];

/** La squad IA : plusieurs familles sur un même projet, coordonnées par Kistone. */
export const SQUAD = {
  label: "Squad IA",
  title: "Une équipe IA complète, coordonnée par Kistone.",
  text: "Un AI Leader quelques jours par semaine pour le cap, un AI Engineer pour construire, un AI Product pour l'adoption : composés pour votre projet, ils démarrent ensemble.",
  members: [
    { vertical: "leader" as Vertical, rhythm: "2 j / sem", role: "Fixe le cap et arbitre" },
    { vertical: "engineer" as Vertical, rhythm: "Temps plein", role: "Construit et met en production" },
    { vertical: "product" as Vertical, rhythm: "Temps plein", role: "Conçoit et fait adopter" },
  ],
  points: ["Un seul interlocuteur Kistone", "Des profils choisis pour travailler ensemble", "Contrats, CRA et facturation sur la plateforme"],
};

export const ASSETS = [
  { icon: "shield", title: "Profils sélectionnés et qualifiés", desc: "Parcours, projets IA et références évalués en entretien avant la première mission.", featured: true },
  { icon: "pulse", title: "Matching sur vos critères", desc: "Stack, cas d'usage, séniorité, rythme et budget : seuls les profils pertinents remontent." },
  { icon: "clock", title: "Réactivité", desc: "Un premier profil en 48 h et un démarrage en une semaine, pas en trois mois." },
  { icon: "team", title: "Le bon format", desc: "Mission, fractional ou contract-to-hire : vous ajustez selon votre besoin." },
] as const;

/** Espace freelance : ce que la plateforme supprime (les irritants du freelance). */
export const FREELANCE_STRIKE = {
  title: "Fini les…",
  subtitle: "Ce que vous ne ferez plus jamais pour décrocher et suivre une mission.",
  items: [
    "Devis envoyés sans réponse",
    "Briefs flous et budgets découverts au troisième appel",
    "Bons de commande qui n'arrivent jamais",
    "Relances pour être payé",
    "Paperasse à refaire pour chaque client",
  ],
};

export const FREELANCE_SPACE = [
  { label: "Mission AI Engineer · Scale-up SaaS", status: "En cours", bg: "#E8F5EE", fg: "#17663F" },
  { label: "CRA d'octobre · 18 jours", status: "Validé par le client", bg: palettes.sand.soft, fg: palettes.sand.ink },
  { label: "Facture d'octobre", status: "Envoyée", bg: palettes.blue.soft, fg: palettes.blue.ink },
  { label: "Mission RPO · 4 recrutements Data/AI", status: "À consulter", bg: "#FFE3EC", fg: "#8F1747" },
];

export const RESOURCES: { kind: string; title: string; meta: string; palette: PaletteName }[] = [
  { kind: "Article", title: "[Titre d’article : RPO freelance vs cabinet]", meta: "Blog · [x] min de lecture", palette: "apricot" },
  { kind: "Comparatif", title: "Trouver un expert IA freelance : les plateformes en France", meta: "Guide · 12 acteurs", palette: "lilac" },
  { kind: "Guide", title: "[Titre de guide : staffer un projet IA]", meta: "Guide · PDF", palette: "teal" },
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
    criteria: ["RAG & recherche sémantique", "MLOps / LLMOps", "Mission 6 mois"],
    matches: [{ name: "Lina", score: 95 }, { name: "Hugo", score: 88 }],
  },
  {
    vertical: "product",
    domain: "AI Product",
    text: "Nous lançons un copilote pour nos clients : besoin d'un Product Manager IA pour prioriser les cas d'usage et piloter la roadmap.",
    criteria: ["AI Product", "Discovery & cas d'usage IA", "Roadmap & priorisation"],
    matches: [{ name: "Claire", score: 93 }, { name: "Yanis", score: 86 }],
  },
  {
    vertical: "leader",
    domain: "AI Leader",
    text: "Le comité de direction veut une stratégie IA : on cherche un Head of AI 2 jours par semaine pour la feuille de route et la gouvernance.",
    criteria: ["AI Leader", "2 j / sem", "Stratégie IA & GenAI", "Gouvernance & AI Act"],
    matches: [{ name: "Marc", score: 94 }, { name: "Paul", score: 87 }],
  },
  {
    vertical: "rpo",
    domain: "Tech recruiter",
    text: "On veut internaliser notre équipe IA : un recruteur pour 4 AI Engineers en CDI, à Paris en hybride, dès que possible.",
    criteria: ["Tech recruiter", "Data/AI", "Paris · hybride", "4 postes"],
    matches: [{ name: "Julie", score: 94 }, { name: "Thomas", score: 88 }],
  },
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

/**
 * Questions fréquentes de l'accueil : réponses courtes et factuelles (reprises par les moteurs
 * IA), uniquement des engagements déjà validés. Budgets : src/lib/indicativeBudget.ts.
 */
export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: "Qu'est-ce que Kistone ?",
    a: "Kistone est la plateforme freelance des experts IA. Elle met en relation les entreprises avec des AI Engineers, des AI Product et des AI Leaders sélectionnés et qualifiés, en mission, en fractional ou en contract-to-hire, et avec des Tech recruiters (RPO) pour recruter leurs talents IA en CDI.",
  },
  {
    q: "Quels experts IA trouve-t-on sur Kistone ?",
    a: "Trois familles : les AI Engineers (LLM, RAG, agents IA, MLOps et infrastructure IA), les AI Product (Product Managers IA, Product Owners de produits LLM, AI Designers) et les AI Leaders (CTO, Head of AI, Chief AI Officer). S'y ajoutent les Tech recruiters, intégrés à vos équipes pour recruter en CDI.",
  },
  {
    q: "En combien de temps recevez-vous un premier profil ?",
    a: "Un premier profil qualifié vous est présenté sous 48 h après le partage de votre besoin.",
  },
  {
    q: "Combien coûte un expert IA freelance ?",
    a: "Les experts sont facturés au jour, sans frais de recrutement. Budgets indicatifs HT par jour : AI Engineer 600 à 1 000 €, AI Product 500 à 800 €, AI Leader 1 000 à 1 600 €, Tech recruiter 500 à 600 €, selon l'expérience et le périmètre.",
  },
  {
    q: "Mission, fractional ou contract-to-hire : quelle différence ?",
    a: "En mission freelance, l'expert travaille à temps plein sur votre projet pour une durée définie. En fractional, un leader senior intervient quelques jours par semaine. En contract-to-hire, l'expert démarre en freelance avec la possibilité de le recruter ensuite.",
  },
  {
    q: "Comment les experts sont-ils sélectionnés ?",
    a: "Chaque freelance est qualifié en entretien par l'équipe Kistone (parcours, projets IA réalisés, références) puis noté. Seuls les profils qui correspondent à votre besoin vous sont présentés.",
  },
  {
    q: "Qui gère le contrat et la facturation ?",
    a: "Kistone gère le contrat, la conformité, le suivi des jours (CRA) et la facturation. Le freelance est payé chaque fin de mois.",
  },
];
