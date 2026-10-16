import type { PaletteName } from "@/lib/palettes";

/**
 * Les modèles d'intervention (/modeles/…) : Mission freelance, Fractional, Contract-to-hire.
 * Même trame : définition, fonctionnement, situations, ce que ça change, comparaison, FAQ.
 * Vocabulaire : jamais « management de transition » ; pas d'opposition au CDI.
 */
export type ModelPage = {
  slug: string;
  name: string;
  /** Une ligne, pour le menu et le pied de page. */
  short: string;
  palette: PaletteName;
  h1: string;
  highlight: string;
  lead: string;
  seoTitle: string;
  seoDescription: string;
  definition: string[];
  /** Mêmes libellés, dans le même ordre, pour tous les modèles (tableau comparatif). */
  facts: { label: string; value: string }[];
  steps: { title: string; desc: string }[];
  situations: { title: string; desc: string }[];
  benefits: string[];
  watchouts: string[];
  faq: { q: string; a: string }[];
};

export const MODEL_PAGES: ModelPage[] = [
  {
    slug: "mission-freelance",
    name: "Mission freelance",
    short: "Un expert IA à temps plein, le temps du projet.",
    palette: "blue",
    h1: "Le modèle Mission freelance",
    highlight: "Mission freelance",
    lead: "Un expert IA rejoint votre équipe à temps plein pour une durée définie : construire un RAG, industrialiser un prototype, lancer un produit IA. Il est opérationnel en quelques jours et repart quand l'objectif est atteint.",
    seoTitle: "Mission freelance : un expert IA à temps plein",
    seoDescription: "Le modèle Mission freelance : un AI Engineer, un AI Product Manager ou un AI Leader à temps plein pour la durée de votre projet. Définition, fonctionnement, situations et tarifs.",
    definition: [
      "Une mission freelance confie un projet ou une phase de construction à un expert indépendant, à temps plein, pour une durée définie, souvent de 3 à 12 mois. Il travaille dans votre équipe, avec vos outils et vos rituels, sur des objectifs fixés au départ.",
      "C'est le format le plus courant pour les AI Engineers et les AI Product Managers : l'expertise IA est rare, les projets ont un début et une fin, et la mission permet de démarrer en quelques jours au lieu d'attendre des mois un recrutement.",
    ],
    facts: [
      { label: "Rythme", value: "Temps plein" },
      { label: "Durée type", value: "3 à 12 mois" },
      { label: "Démarrage", value: "~1 semaine" },
      { label: "À l'issue", value: "Livraison et passation" },
    ],
    steps: [
      { title: "Cadrer le projet", desc: "On définit ensemble le cas d'usage, les livrables, la stack et la durée de la mission." },
      { title: "Choisir le profil", desc: "Un premier profil qualifié vous est présenté sous 48 h, choisi pour votre stack et votre contexte." },
      { title: "Construire avec l'équipe", desc: "L'expert rejoint vos rituels et vos outils, avec des points d'étape réguliers sur les objectifs." },
      { title: "Livrer et transmettre", desc: "En fin de mission, il documente, forme l'équipe et passe le relais, ou la mission se prolonge." },
    ],
    situations: [
      { title: "Un prototype à industrialiser", desc: "Votre POC d'IA générative doit passer en production, de façon fiable et sécurisée." },
      { title: "Un produit IA à lancer", desc: "Un copilote, un assistant ou des agents : une équipe à renforcer le temps du lancement." },
      { title: "Une expertise absente de l'équipe", desc: "RAG, évaluation des modèles, MLOps : une compétence pointue dont vous avez besoin maintenant." },
      { title: "Un pic de charge", desc: "La roadmap s'accélère et votre équipe tech ne peut pas tout absorber." },
      { title: "Un recrutement qui tarde", desc: "Le poste est ouvert depuis des mois : un expert en mission fait avancer le projet en attendant." },
    ],
    benefits: [
      "Un expert IA opérationnel en quelques jours",
      "Une durée et un budget définis dès le départ",
      "Une compétence rare, sans long process de recrutement",
      "Un transfert de savoir-faire à votre équipe",
    ],
    watchouts: [
      "Fixez des livrables et des critères de réussite clairs",
      "Prévoyez la documentation et la passation dès le départ",
      "Désignez un référent interne qui suit la mission au quotidien",
    ],
    faq: [
      { q: "Qu'est-ce qu'une mission freelance ?", a: "Un expert indépendant qui rejoint votre équipe à temps plein pour une durée définie, sur un projet ou une phase précise." },
      { q: "Combien de temps dure une mission ?", a: "Le plus souvent 3 à 12 mois. La mission peut être prolongée si le projet évolue." },
      { q: "Combien coûte un expert IA en mission ?", a: "Il est facturé au jour, en général entre 500 et 1 600 € HT selon la famille et l'expérience. Les ordres de grandeur sont indiqués sur chaque fiche de poste." },
      { q: "Mission ou fractional ?", a: "La mission est à temps plein, sur une période définie : idéale pour construire. Le fractional est à temps partiel et dans la durée : idéal pour piloter une stratégie." },
    ],
  },
  {
    slug: "fractional",
    name: "Fractional",
    short: "Un AI Leader senior quelques jours par semaine.",
    palette: "teal",
    h1: "Le modèle Fractional",
    highlight: "Fractional",
    lead: "Un CTO, Head of AI ou Chief AI Officer rejoint votre équipe un à quatre jours par semaine, dans la durée. Vous accédez à un niveau de séniorité que vous n'auriez pas à temps plein, au rythme dont votre entreprise a besoin.",
    seoTitle: "Fractional : un AI Leader à temps partagé",
    seoDescription: "Le modèle Fractional : un CTO, Head of AI ou Chief AI Officer senior quelques jours par semaine pour piloter votre stratégie IA. Définition, fonctionnement, situations et tarifs.",
    definition: [
      "Un leader fractional (ou à temps partagé) exerce un rôle de direction, CTO, Head of AI ou Chief AI Officer, pour plusieurs entreprises à la fois, chacune quelques jours par semaine. Il porte les mêmes responsabilités qu'un dirigeant à temps plein sur le périmètre convenu : stratégie, arbitrages, management et pilotage.",
      "Le modèle répond à un constat simple : beaucoup d'entreprises ont besoin d'un leader IA expérimenté pour fixer le cap, mais pas de cinq jours par semaine. Le fractional ajuste le temps à l'enjeu, et le rythme évolue avec vous.",
    ],
    facts: [
      { label: "Rythme", value: "1 à 4 j / sem" },
      { label: "Durée type", value: "6 à 24 mois" },
      { label: "Démarrage", value: "~1 semaine" },
      { label: "À l'issue", value: "Relais interne ou suite" },
    ],
    steps: [
      { title: "Cadrer l'enjeu", desc: "On définit ensemble le périmètre, les objectifs à 3 et 6 mois et le temps utile : souvent 1 à 3 jours par semaine." },
      { title: "Choisir le profil", desc: "Un premier profil qualifié vous est présenté sous 48 h, choisi pour votre stade de maturité IA." },
      { title: "Intégrer l'équipe", desc: "Le leader rejoint vos rituels, vos outils et votre comité de direction, avec des jours fixes et une disponibilité entre deux." },
      { title: "Ajuster le rythme", desc: "Plus de jours lors d'un lancement, moins quand l'équipe prend le relais. Le contrat suit." },
    ],
    situations: [
      { title: "Une stratégie IA à définir", desc: "Le comité de direction veut avancer sur l'IA : il faut une feuille de route réaliste et priorisée." },
      { title: "Une équipe IA junior à encadrer", desc: "Vos AI Engineers ont besoin d'un senior pour fixer la direction et les faire progresser." },
      { title: "Des choix structurants", desc: "Build ou buy, modèles, plateformes, gouvernance : des décisions qui demandent de l'expérience." },
      { title: "Une conformité à anticiper", desc: "AI Act, sécurité, données : poser le cadre avant de déployer à grande échelle." },
      { title: "Un budget à maîtriser", desc: "Vous accédez à un leader de haut niveau pour un budget ajusté au temps réellement passé." },
    ],
    benefits: [
      "Séniorité d'un leader IA expérimenté, au rythme de votre besoin",
      "Rythme ajustable à la hausse comme à la baisse",
      "Regard extérieur nourri par plusieurs entreprises",
      "Démarrage rapide, sans long process de recrutement",
    ],
    watchouts: [
      "Fixez des jours de présence réguliers et un canal pour les urgences",
      "Formalisez des objectifs clairs pour mesurer l'impact",
      "Prévoyez qui prend le relais en interne sur l'opérationnel quotidien",
    ],
    faq: [
      { q: "Qu'est-ce qu'un leader IA fractional ?", a: "Un CTO, Head of AI ou Chief AI Officer expérimenté qui exerce son rôle pour votre entreprise quelques jours par semaine, en freelance, en parallèle d'autres missions." },
      { q: "Combien de jours par semaine ?", a: "Le plus souvent 1 à 3 jours par semaine. Le rythme se fixe au départ selon l'enjeu et peut évoluer pendant la mission." },
      { q: "Combien coûte un AI Leader fractional ?", a: "Il est facturé au jour, en général entre 1 000 et 1 600 € HT selon l'expérience et le périmètre." },
      { q: "Le fractional convient-il aux AI Engineers ?", a: "Rarement : construire un système d'IA demande en général un temps plein. Le fractional convient surtout aux rôles de leadership, qui fixent le cap et arbitrent." },
    ],
  },
  {
    slug: "contract-to-hire",
    name: "Contract-to-hire",
    short: "Commencer en mission, puis recruter en interne.",
    palette: "sage",
    h1: "Le modèle Contract-to-hire",
    highlight: "Contract-to-hire",
    lead: "L'expert IA démarre en mission freelance, et vous avez la possibilité de le recruter dans vos équipes à l'issue de la période. Vous jugez sur des résultats réels avant de vous engager.",
    seoTitle: "Contract-to-hire : tester un expert IA avant de recruter",
    seoDescription: "Contract-to-hire : un AI Engineer, AI Product Manager ou AI Leader démarre en mission freelance, avec la possibilité de le recruter ensuite. Fonctionnement, situations et FAQ.",
    definition: [
      "Le contract-to-hire combine une mission freelance et une option de recrutement. L'expert travaille d'abord comme freelance, le temps de prouver sa valeur ; à l'issue, si les deux parties le souhaitent, il rejoint vos équipes.",
      "Le modèle réduit le risque d'une erreur de recrutement sur des profils IA rares et chers : vous jugez sur des résultats et une collaboration réelle, et l'expert découvre votre entreprise avant de s'engager.",
    ],
    facts: [
      { label: "Rythme", value: "Temps plein" },
      { label: "Durée type", value: "3 à 6 mois, puis recrutement" },
      { label: "Démarrage", value: "~1 semaine" },
      { label: "À l'issue", value: "Recrutement en interne" },
    ],
    steps: [
      { title: "Cadrer le poste", desc: "Missions, objectifs de la période et conditions d'un éventuel recrutement, fixés dès le départ." },
      { title: "Choisir le profil", desc: "Un expert ouvert à un recrutement, qualifié et présenté sous 48 h." },
      { title: "Travailler ensemble", desc: "L'expert démarre en mission, avec des points d'étape réguliers sur les objectifs fixés." },
      { title: "Décider", desc: "À l'issue de la période, vous recrutez si les deux parties le souhaitent, dans les conditions prévues." },
    ],
    situations: [
      { title: "Un premier expert IA", desc: "Votre premier AI Engineer ou Head of AI : un recrutement structurant que vous voulez sécuriser." },
      { title: "Une équipe IA à internaliser", desc: "Vos experts sont en freelance et vous voulez construire une équipe interne durable." },
      { title: "Un profil rare", desc: "Les talents IA sont très demandés : la mission vous permet de commencer tout de suite." },
      { title: "Un poste où l'erreur coûte cher", desc: "Vous jugez sur pièce avant de vous engager sur un salaire élevé." },
    ],
    benefits: [
      "Un recrutement jugé sur des résultats réels",
      "Un démarrage immédiat, sans attendre la fin du process",
      "Moins de risque pour vous comme pour l'expert",
      "Des conditions claires dès le départ",
    ],
    watchouts: [
      "Fixez les conditions de recrutement dans le contrat initial",
      "Définissez des objectifs mesurables pour la période de mission",
      "Faites un point à mi-parcours pour préparer la décision",
    ],
    faq: [
      { q: "Qu'est-ce que le contract-to-hire ?", a: "Une mission freelance avec option d'embauche : l'expert démarre en mission, et vous pouvez le recruter en interne à l'issue de la période, aux conditions prévues au contrat." },
      { q: "Combien de temps dure la période de mission ?", a: "Le plus souvent 3 à 6 mois, le temps de juger la collaboration sur des résultats concrets." },
      { q: "Le freelance est-il obligé d'accepter le recrutement ?", a: "Non. L'option est choisie des deux côtés : seuls des profils ouverts à un recrutement vous sont proposés dans ce modèle." },
      { q: "Et pour recruter d'autres profils en CDI ?", a: "Un Tech recruiter freelance peut vous aider à construire toute l'équipe : il chasse et recrute vos talents IA en CDI, à vos côtés." },
    ],
  },
];

/** Ancienne page « Interim & transition » (avant le pivot IA) : redirigée vers la mission freelance. */
export const LEGACY_MODEL_SLUGS: Record<string, string> = { "interim-transition": "mission-freelance" };

export const modelPath = (m: Pick<ModelPage, "slug">) => `/modeles/${m.slug}`;
export const modelBySlug = (slug: string | undefined) => MODEL_PAGES.find((m) => m.slug === slug);
