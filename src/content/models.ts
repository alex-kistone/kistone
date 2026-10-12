import type { PaletteName } from "@/lib/palettes";

/**
 * Les modèles d'intervention (/modeles/…) : Fractional, Interim & transition, Contract-to-hire.
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
    slug: "fractional",
    name: "Fractional",
    short: "Un dirigeant senior quelques jours par semaine.",
    palette: "lilac",
    h1: "Le modèle Fractional",
    highlight: "Fractional",
    lead: "Un dirigeant expérimenté rejoint votre équipe un à quatre jours par semaine, dans la durée. Vous accédez à un niveau de séniorité que vous n'auriez pas à temps plein, au rythme dont votre entreprise a réellement besoin.",
    seoTitle: "Fractional : un dirigeant à temps partagé",
    seoDescription: "Le modèle Fractional : un DRH, CFO, CTO, CRO, COO, CPO ou CDO senior quelques jours par semaine. Définition, fonctionnement, situations et tarifs.",
    definition: [
      "Un dirigeant fractional (ou à temps partagé) exerce une fonction de direction, CFO, DRH, CTO ou autre, pour plusieurs entreprises à la fois, chacune quelques jours par semaine. Il porte les mêmes responsabilités qu'un dirigeant à temps plein sur le périmètre convenu : stratégie, décisions, management et pilotage.",
      "Le modèle répond à un constat simple : beaucoup d'entreprises ont besoin du niveau d'un dirigeant expérimenté, mais pas de cinq jours par semaine. Le fractional ajuste le temps à l'enjeu réel, et le rythme évolue avec vous.",
    ],
    facts: [
      { label: "Rythme", value: "1 à 4 j / sem" },
      { label: "Durée type", value: "6 à 24 mois" },
      { label: "Démarrage", value: "~1 semaine" },
      { label: "À l'issue", value: "Relais interne ou suite" },
    ],
    steps: [
      { title: "Cadrer l'enjeu", desc: "On définit ensemble le périmètre, les objectifs à 3 et 6 mois et le temps utile : souvent 1 à 3 jours par semaine." },
      { title: "Choisir le profil", desc: "Un premier profil qualifié vous est présenté sous 48 h, spécialisé dans votre fonction et votre stade de croissance." },
      { title: "Intégrer l'équipe", desc: "Le dirigeant rejoint vos rituels, vos outils et votre comité de direction, avec des jours fixes et une disponibilité entre deux." },
      { title: "Ajuster le rythme", desc: "Plus de jours lors d'un pic (levée, réorganisation), moins quand l'équipe prend le relais. Le contrat suit." },
    ],
    situations: [
      { title: "Startup ou scale-up en croissance", desc: "Vous avez besoin d'un CFO ou d'un DRH senior, mais pas encore d'un poste à temps plein." },
      { title: "Une fonction à structurer", desc: "Finance, RH, data ou produit : poser les process, les outils et le cap avant de faire grandir une équipe." },
      { title: "Une équipe junior à encadrer", desc: "Votre responsable interne a besoin d'un senior pour fixer la direction et le faire progresser." },
      { title: "Un sujet stratégique ponctuel", desc: "Levée de fonds, ouverture de marché, intégration de l'IA : une expertise pointue sur la durée du projet." },
      { title: "Un budget à maîtriser", desc: "Vous accédez à un profil de haut niveau pour un budget ajusté au temps réellement passé." },
    ],
    benefits: [
      "Séniorité d'un dirigeant expérimenté, au rythme de votre besoin",
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
      { q: "Qu'est-ce qu'un dirigeant fractional ?", a: "Un dirigeant expérimenté qui exerce une fonction de direction pour votre entreprise quelques jours par semaine, en freelance, en parallèle d'autres missions." },
      { q: "Combien de jours par semaine ?", a: "Le plus souvent 1 à 3 jours par semaine. Le rythme se fixe au départ selon l'enjeu et peut évoluer pendant la mission." },
      { q: "Combien coûte un dirigeant fractional ?", a: "Il est facturé au jour, en général entre 800 et 1 600 € HT selon la fonction et l'expérience. Les ordres de grandeur par fonction sont indiqués sur chaque page métier." },
      { q: "Fractional ou interim ?", a: "Le fractional est à temps partiel et dans la durée ; l'interim est à temps plein, sur une période définie, souvent pour remplacer ou conduire un changement." },
    ],
  },
  {
    slug: "interim-transition",
    name: "Interim & transition",
    short: "Un dirigeant à temps plein, le temps d'une période clé.",
    palette: "apricot",
    h1: "Le modèle Interim & transition",
    highlight: "Interim",
    lead: "Un dirigeant expérimenté prend un poste à temps plein pour une période définie : remplacer un départ, traverser une phase critique ou conduire une transformation. Il est opérationnel dès la première semaine et passe le relais à la fin de la mission.",
    seoTitle: "Interim & transition : un dirigeant à temps plein",
    seoDescription: "Dirigeant par intérim : un DRH, CFO, CTO, CRO, COO, CPO ou CDO à temps plein pour une période définie (remplacement, crise, transformation). Fonctionnement et situations.",
    definition: [
      "Un dirigeant par intérim occupe une fonction de direction à temps plein pendant une période limitée, en général de 3 à 12 mois. Il dispose de l'autorité du poste et prend les décisions nécessaires, avec un objectif défini dès le départ.",
      "C'est le modèle des moments où l'entreprise ne peut pas attendre : un poste clé vacant, une situation qui se tend, un projet de transformation qui demande quelqu'un de dédié à plein temps.",
    ],
    facts: [
      { label: "Rythme", value: "Temps plein" },
      { label: "Durée type", value: "3 à 12 mois" },
      { label: "Démarrage", value: "Quelques jours" },
      { label: "À l'issue", value: "Passage de relais" },
    ],
    steps: [
      { title: "Qualifier l'urgence", desc: "Contexte, enjeux, objectif de sortie : on cadre la mission en un appel." },
      { title: "Présenter un profil", desc: "Un dirigeant qualifié, qui a déjà vécu une situation comparable, présenté sous 48 h." },
      { title: "Prendre le poste", desc: "Il s'intègre immédiatement, établit un diagnostic et un plan d'action dans les premières semaines." },
      { title: "Passer le relais", desc: "Il prépare la suite : recrutement du titulaire, montée en compétence de l'équipe ou passage en fractional." },
    ],
    situations: [
      { title: "Un départ imprévu", desc: "Votre CFO, DRH ou CTO quitte l'entreprise : la fonction ne peut pas rester vide pendant le recrutement." },
      { title: "Une absence longue", desc: "Congé maternité, maladie, détachement : un remplacement à la hauteur du poste." },
      { title: "Une phase critique", desc: "Tension de trésorerie, conflit social, incident majeur : il faut un dirigeant aguerri, présent chaque jour." },
      { title: "Une transformation", desc: "Réorganisation, fusion, changement d'outils ou de modèle : un pilote dédié jusqu'à l'atterrissage." },
      { title: "Une opération stratégique", desc: "Levée de fonds, acquisition, cession, ouverture d'un pays : un renfort à plein temps sur la durée de l'opération." },
    ],
    benefits: [
      "Un dirigeant opérationnel immédiatement",
      "Une expérience des situations sensibles",
      "Un regard neutre, sans enjeu de carrière interne",
      "Une mission bornée, avec un objectif de sortie clair",
    ],
    watchouts: [
      "Définissez l'objectif de fin de mission dès le départ",
      "Donnez-lui l'autorité réelle du poste auprès des équipes",
      "Anticipez la suite : recrutement, relais interne ou fractional",
    ],
    faq: [
      { q: "Qu'est-ce qu'un dirigeant par intérim ?", a: "Un dirigeant expérimenté qui occupe un poste de direction à temps plein pendant une période définie, avec l'autorité du poste et un objectif de sortie précis." },
      { q: "Combien de temps dure une mission ?", a: "En général de 3 à 12 mois, selon l'objectif : couvrir une vacance de poste, traverser une crise ou mener une transformation." },
      { q: "En combien de temps peut-il démarrer ?", a: "Un premier profil vous est présenté sous 48 h ; le démarrage peut avoir lieu dans les jours qui suivent." },
      { q: "Peut-il ensuite continuer à temps partiel ?", a: "Oui. Beaucoup de missions passent en fractional après la phase la plus intense, le temps que le relais interne soit solide." },
    ],
  },
  {
    slug: "contract-to-hire",
    name: "Contract-to-hire",
    short: "Commencer en mission, puis recruter en interne.",
    palette: "sage",
    h1: "Le modèle Contract-to-hire",
    highlight: "Contract-to-hire",
    lead: "Le dirigeant démarre en mission freelance, et vous avez la possibilité de le recruter dans vos équipes à l'issue de la période. Vous travaillez ensemble pour de vrai avant de vous engager, des deux côtés.",
    seoTitle: "Contract-to-hire : tester avant de recruter",
    seoDescription: "Contract-to-hire : un dirigeant ou recruteur démarre en mission freelance, avec la possibilité de le recruter ensuite. Fonctionnement, situations et conditions.",
    definition: [
      "Le contract-to-hire (mission avec option d'embauche) consiste à démarrer une collaboration en freelance, sur une période définie, avec l'intention partagée de la transformer en recrutement si elle fonctionne. Les conditions du passage en interne sont fixées dès le départ dans le contrat.",
      "Le modèle réduit le risque d'une erreur de recrutement sur un poste clé : vous jugez sur des résultats et une collaboration réelle, et le dirigeant découvre l'entreprise de l'intérieur avant de s'engager.",
    ],
    facts: [
      { label: "Rythme", value: "Temps plein ou partiel" },
      { label: "Durée type", value: "3 à 6 mois" },
      { label: "Démarrage", value: "~1 semaine" },
      { label: "À l'issue", value: "Recrutement interne" },
    ],
    steps: [
      { title: "Définir le poste cible", desc: "Le rôle à terme, la rémunération envisagée et les critères de réussite de la période de mission." },
      { title: "Choisir le profil", desc: "Un profil qualifié ouvert à un recrutement, présenté sous 48 h." },
      { title: "Travailler ensemble", desc: "Le dirigeant démarre en mission, avec des points d'étape réguliers sur les objectifs fixés." },
      { title: "Décider", desc: "À l'issue de la période, chacun décide : recrutement aux conditions prévues, prolongation ou fin de mission." },
    ],
    situations: [
      { title: "Un premier poste de direction", desc: "Votre premier CFO, DRH ou CTO : un recrutement structurant que vous voulez sécuriser." },
      { title: "Un poste où l'erreur coûte cher", desc: "Fonction très exposée ou difficile à recruter : vous jugez sur pièce avant de vous engager." },
      { title: "Un besoin immédiat", desc: "Le poste doit être tenu tout de suite, sans attendre la fin d'un long process de recrutement." },
      { title: "Un candidat qui hésite", desc: "Un très bon profil, freelance aujourd'hui, prêt à rejoindre une entreprise qui lui plaît vraiment." },
      { title: "Un poste encore flou", desc: "Le périmètre se précise en avançant : la mission permet de le définir avant d'ouvrir le poste." },
    ],
    benefits: [
      "Une décision de recrutement fondée sur des résultats réels",
      "Un poste tenu dès la première semaine",
      "Un engagement choisi des deux côtés",
      "Des conditions de passage en interne connues dès le départ",
    ],
    watchouts: [
      "Fixez par écrit les conditions de passage en interne",
      "Définissez des critères de réussite mesurables pour la période",
      "Gardez des points d'étape réguliers pour décider en confiance",
    ],
    faq: [
      { q: "Qu'est-ce que le contract-to-hire ?", a: "Une mission freelance avec option d'embauche : le dirigeant démarre en mission, et vous pouvez le recruter en interne à l'issue de la période, aux conditions prévues au contrat." },
      { q: "Combien de temps dure la période de mission ?", a: "Le plus souvent 3 à 6 mois, le temps de juger la collaboration sur des résultats concrets." },
      { q: "Le freelance est-il obligé d'accepter le recrutement ?", a: "Non. L'option est choisie des deux côtés : seuls des profils ouverts à un recrutement vous sont proposés dans ce modèle." },
      { q: "Comment se passe le recrutement en interne ?", a: "Les conditions (délai, rémunération envisagée, éventuels frais) sont fixées dès le départ dans le contrat, pour que la décision finale soit simple." },
    ],
  },
];

export const modelPath = (m: Pick<ModelPage, "slug">) => `/modeles/${m.slug}`;
export const modelBySlug = (slug: string | undefined) => MODEL_PAGES.find((m) => m.slug === slug);
