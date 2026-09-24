// Contenus de la landing /studio (maquettes 02 à 05 du kit Kistone).
// Les placeholders entre crochets restent tels quels tant que le contenu réel manque.
import type { PaletteName } from "@/lib/palettes";

export const STUDIO_SEO = {
  title: "Studio IA : vos outils RH sur mesure en 30 jours",
  description:
    "Kistone conçoit et livre des outils RH sur mesure (onboarding, assistant RH, tri de candidatures) en 30 jours. Appel de 15 min, sans engagement.",
};

export const HERO = {
  badgeDesktop: "Produits IA sur mesure pour les équipes RH",
  badgeMobile: "Produits IA pour les RH",
  titleLine1: "Vos outils RH sur mesure.",
  titleLead: "Livrés en",
  titleHighlight: "30 jours.",
  subtitle: "Onboarding, recrutement, support salarié. Sans DSI débordée, sans projet interminable.",
  primary: "Réserver un appel de 15 min",
  secondary: "Voir nos réalisations",
  note: "Sans engagement · Réponse sous 48 h",
};

export type ProductKind = "onboarding" | "assistant" | "talents" | "interviews" | "leave";
export type Product = { kind: ProductKind; url: string; title: string; desc: string; descMobile: string };

export const PRODUCTS: Product[] = [
  { kind: "onboarding", url: "kistone.app/onboarding", title: "Parcours d’onboarding", desc: "Chaque recrue sait quoi faire, jour après jour.", descMobile: "Chaque recrue sait quoi faire." },
  { kind: "assistant", url: "kistone.app/assistant", title: "Assistant RH", desc: "Congés, mutuelle, paie. Réponses instantanées.", descMobile: "Congés, mutuelle, paie." },
  { kind: "talents", url: "kistone.app/talents", title: "Tri de candidatures", desc: "Les meilleurs profils remontent en premier.", descMobile: "Les meilleurs profils en premier." },
  { kind: "interviews", url: "kistone.app/entretiens", title: "Campagne d’entretiens", desc: "Relances et suivi, sans tableur.", descMobile: "Relances et suivi, sans tableur." },
  { kind: "leave", url: "kistone.app/conges", title: "Gestion des absences", desc: "Demandes validées en un clic.", descMobile: "Demandes validées en un clic." },
];

export const KEY_FIGURES = [
  { value: "7", unit: "jours", label: "pour tester un prototype cliquable" },
  { value: "30", unit: "jours", label: "pour un produit en production, en moyenne" },
  { value: "15", unit: "min", label: "pour un diagnostic chiffré de votre besoin" },
];

export const LOGOS = {
  caption: "Ils ont confié leurs outils RH à Kistone",
  items: ["Maison Vérane", "Groupe Altor", "Solvée", "[Logo client]", "[Logo client]", "[Logo client]", "[Logo client]"],
};

export const METHOD = {
  tag: "Méthode",
  title: "Quatre étapes. Zéro jargon.",
  subtitle: "De votre besoin à un produit utilisé par vos équipes. Vous validez chaque étape.",
  steps: [
    { num: "01", title: "Diagnostic", desc: "15 minutes pour cerner le problème et le gain attendu." },
    { num: "02", title: "Prototype", desc: "Une maquette cliquable en 7 jours. Vous testez, on ajuste." },
    { num: "03", title: "Construction", desc: "Développement, intégration SIRH, sécurité RGPD." },
    { num: "04", title: "Déploiement", desc: "Mise en ligne, formation, suivi des usages." },
  ],
};

export type CaseStudy = {
  palette: PaletteName;
  category: string;
  metric: string;
  pct: string;
  client: string;
  title: string;
  meta: string;
  delay: string;
};

export const CASES = {
  tag: "Réalisations",
  titleA: "Des produits utilisés.",
  titleB: "Pas des démos.",
  subtitle: "Trois projets récents, livrés et adoptés par les équipes.",
  items: [
    { palette: "apricot", category: "Onboarding", metric: "-62 % de temps d’intégration", pct: "72%", client: "Maison Vérane", title: "Onboarding piloté par l’IA", meta: "Retail · 2 400 salariés", delay: "Livré en 5 semaines" },
    { palette: "blue", category: "Support salarié", metric: "71 % des questions résolues seules", pct: "71%", client: "Groupe Altor", title: "Assistant RH interne", meta: "Industrie · 8 000 salariés", delay: "Livré en 6 semaines" },
    { palette: "sage", category: "Recrutement", metric: "3× plus de candidats qualifiés", pct: "80%", client: "Solvée", title: "Tri de candidatures intelligent", meta: "Services · 900 salariés", delay: "Livré en 4 semaines" },
  ] satisfies CaseStudy[],
};

export type UseCaseKind = "budget" | "freelances" | "engagement";
export type UseCase = { kind: UseCaseKind; palette: PaletteName; label: string; title: string; desc: string; tags: string[] };

export const USE_CASES = {
  eyebrow: "Et aussi, sur mesure",
  title: "D’autres outils RH. Même méthode.",
  intro: "Budget, freelances, engagement : on conçoit l’outil autour de vos process, pas l’inverse.",
  cta: "En parler en 15 min",
  items: [
    { kind: "budget", palette: "lilac", label: "Pilotage RH", title: "Gérer son budget RH", desc: "Budget vs réel, masse salariale, recrutements prévus. Une vue claire, partagée avec la finance.", tags: ["Prévisionnel", "Scénarios", "Alertes d’écart"] },
    { kind: "freelances", palette: "sand", label: "Freelances", title: "Freelances en mission", desc: "Timesheets, KYC et conformité au même endroit. Chaque mission est suivie, chaque document à jour.", tags: ["Timesheet", "KYC", "Compliance"] },
    { kind: "engagement", palette: "teal", label: "Engagement", title: "Engagement des collaborateurs", desc: "Pulses courts, signaux faibles, plans d’action par équipe. Vous agissez avant les départs.", tags: ["Pulse surveys", "eNPS", "Plans d’action"] },
  ] satisfies UseCase[],
};

export type WhyIcon = "shield" | "bolt" | "users" | "layers";

export const WHY = {
  tag: "Pourquoi Kistone",
  titleA: "Construit pour les RH.",
  titleB: "Pas pour la DSI.",
  lead: {
    label: "Un seul interlocuteur",
    title: "Stratégie, design, IA et code. Une équipe, un contrat, un résultat.",
    roles: ["Product manager", "Designer", "Ingénieur IA", "Développeur"],
  },
  items: [
    { num: "01", icon: "shield", highlight: true, title: "RGPD by design", desc: "Données hébergées en France. Conformité documentée.", descMobile: "Données hébergées en France." },
    { num: "02", icon: "bolt", highlight: false, title: "Livré en semaines", desc: "Un produit en production en 30 jours en moyenne.", descMobile: "En production en 30 jours en moyenne." },
    { num: "03", icon: "users", highlight: false, title: "Pensé pour l’adoption", desc: "Interfaces simples. Vos salariés l’utilisent dès le jour 1.", descMobile: "Utilisé dès le jour 1." },
    { num: "04", icon: "layers", highlight: false, title: "Branché à vos outils", desc: "Workday, Lucca, Slack, Teams. On s’intègre à l’existant.", descMobile: "Workday, Lucca, Slack, Teams." },
  ] satisfies { num: string; icon: WhyIcon; highlight: boolean; title: string; desc: string; descMobile: string }[],
  strike: {
    title: "Fini les…",
    subtitle: "Ce que vos équipes RH ne feront plus jamais à la main.",
    items: [
      "Tableurs Excel à 40 onglets",
      "Relances manuelles par e-mail",
      "Questions répétées 50 fois par jour",
      "Projets IT de 18 mois",
      "Outils génériques que personne n’ouvre",
    ],
  },
};

export type Plan = {
  id: "sprint" | "partner";
  name: string;
  promise: string;
  price: string;
  unit: string;
  unitMobile: string;
  items: string[];
  cta: string;
  featured: boolean;
  badge?: string;
};

export const PRICING = {
  tag: "Tarifs",
  title: "Un prix clair. Pas de surprise.",
  subtitle: "Choisissez le rythme. Changez quand vous voulez.",
  note: "Sans engagement · Résiliable à tout moment",
  plans: [
    {
      id: "sprint",
      name: "Sprint",
      promise: "Un produit, livré clé en main.",
      price: "9 900 €",
      unit: "HT par produit",
      unitMobile: "HT / produit",
      items: ["Atelier de cadrage", "Prototype cliquable en 7 jours", "Développement et intégration SIRH", "Formation de vos équipes", "30 jours de support inclus"],
      cta: "Démarrer avec Sprint",
      featured: false,
    },
    {
      id: "partner",
      name: "Partenaire",
      promise: "Une équipe produit IA dédiée à vos RH.",
      price: "4 900 €",
      unit: "HT par mois",
      unitMobile: "HT / mois",
      items: ["Tout le forfait Sprint", "Nouveaux produits en continu", "Product manager dédié", "Suivi mensuel des usages", "Support prioritaire sous 4 h"],
      cta: "Démarrer avec Partenaire",
      featured: true,
      badge: "Le plus choisi",
    },
  ] satisfies Plan[],
};

export const BOOKING = {
  badge: "15 minutes, pas une de plus",
  title: "Réservez un appel de 15 min.",
  text: "Vous repartez avec un diagnostic clair et une estimation chiffrée. Même si vous ne travaillez pas avec nous.",
  date: "Jeudi 1er octobre",
  slots: ["09:00", "09:30", "10:15", "11:00", "14:00", "14:45", "15:30", "16:15", "17:00"],
  defaultSlot: "14:00",
  where: "Visio · Google Meet ou Teams",
  pending: "[Réservation en ligne à brancher : outil de prise de rendez-vous]",
};

export const TESTIMONIALS = {
  tag: "Témoignages",
  title: "Ce qu’en disent les DRH.",
  items: [
    { quote: "[Citation client : le problème de départ et le résultat obtenu, en 2 ou 3 phrases.]", name: "[Prénom Nom]", role: "[DRH · Entreprise]" },
    { quote: "[Citation client : ce qui a changé pour les équipes au quotidien.]", name: "[Prénom Nom]", role: "[Responsable recrutement · Entreprise]" },
    { quote: "[Citation client : la rapidité de livraison ou la simplicité du projet.]", name: "[Prénom Nom]", role: "[HRBP · Entreprise]" },
  ],
};

export type FaqItem = { id: string; q: string; a: string };

export const FAQ = {
  tag: "FAQ",
  title: "Vos questions, nos réponses.",
  subtitle: "Une question qui n’est pas là ? Posez-la pendant l’appel.",
  cta: "Réserver un appel",
  defaultOpen: "q1",
  groups: [
    {
      theme: "Offre & tarifs",
      items: [
        { id: "q1", q: "Quelle différence entre Sprint et Partenaire ?", a: "Sprint, c’est un produit livré clé en main pour 9 900 € HT. Partenaire, c’est une équipe produit IA dédiée qui livre de nouveaux produits en continu, pour 4 900 € HT par mois." },
        { id: "q2", q: "Y a-t-il un engagement ?", a: "Non. Les deux offres sont sans engagement et résiliables à tout moment." },
        { id: "q3", q: "Que se passe-t-il après les 30 jours de support ?", a: "[À préciser : maintenance, évolutions et tarif après la période de support incluse.]" },
      ],
    },
    {
      theme: "Projet & délais",
      items: [
        { id: "q4", q: "Combien de temps pour un premier produit ?", a: "Un prototype cliquable en 7 jours, un produit en production en 30 jours en moyenne." },
        { id: "q5", q: "Quel temps attendez-vous de nos équipes ?", a: "Un référent RH qui valide chaque étape. [À préciser : temps moyen par semaine.]" },
        { id: "q6", q: "Et si le produit ne convient pas ?", a: "Vous testez le prototype avant la construction. On ajuste tant que ça ne colle pas à vos usages." },
      ],
    },
    {
      theme: "Technique & sécurité",
      items: [
        { id: "q7", q: "Nos données sont-elles en sécurité ?", a: "Oui. Données hébergées en France, RGPD by design, conformité documentée." },
        { id: "q8", q: "Vous intégrez-vous à notre SIRH ?", a: "Oui : Workday, Lucca, Slack, Teams. On s’intègre à l’existant plutôt que de le remplacer." },
        { id: "q9", q: "À qui appartient le produit livré ?", a: "[À préciser : propriété du code, des données et conditions de réversibilité.]" },
      ],
    },
  ] satisfies { theme: string; items: FaqItem[] }[],
};

/** Ancre de la carte de réservation : cible de tous les CTA « Réserver un appel ». */
export const BOOKING_HREF = "#rdv";
