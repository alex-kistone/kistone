/**
 * Comparatif des acteurs du RPO en France (Ressources) : Kistone, réseau de recruteurs freelance,
 * face aux cabinets de RPO et aux plateformes de freelances RH.
 * Informations tirées des sites publics de chaque acteur (relevé du 31 octobre 2026) : rester
 * factuel et positif, mettre en avant les atouts de chacun. Les chiffres cités sont ceux que les
 * acteurs annoncent eux-mêmes. Le statut salarié des recruteurs de Solantis et GetPro n'est pas
 * indiqué sur leurs sites : il vient de la connaissance du marché d'Alex, ce que la méthodologie
 * de la page précise. Jamais « management de transition ».
 */
export type Family = "freelance" | "cabinet" | "rh";

export const FAMILIES: Record<Family, { label: string; desc: string }> = {
  freelance: { label: "Réseau de recruteurs freelance", desc: "Uniquement des recruteurs indépendants, sélectionnés et qualifiés, spécialisés par métier." },
  cabinet: { label: "Cabinet de RPO", desc: "Un cabinet qui met à disposition ses propres recruteurs, salariés en CDI, avec sa méthode et ses outils." },
  rh: { label: "Plateforme de freelances RH", desc: "Des consultants RH indépendants sur toute la fonction RH, dont le recrutement externalisé." },
};

export type Player = {
  name: string;
  url: string;
  family: Family;
  /** Statut des recruteurs : la différence principale entre les acteurs. */
  recruiters: string;
  /** Profils couverts, en une ligne. */
  scope: string;
  models: string;
  idealFor: string;
  summary: string;
  strengths: string[];
};

export const PLAYERS: Player[] = [
  {
    name: "Kistone",
    url: "https://kistone.fr",
    family: "freelance",
    recruiters: "Recruteurs freelance",
    scope: "Tech, Data, Product, Sales & Marketing, Finance, Industrie, et Head of TA",
    models: "Au jour, à temps plein ou quelques jours par semaine, sans honoraires au placement",
    idealFor: "Les entreprises qui veulent un recruteur spécialisé de leur métier, intégré à leurs équipes, au rythme de leurs recrutements",
    summary: "Réseau de Freelance RPO : une communauté de 700+ recruteurs indépendants, sélectionnés et qualifiés, spécialisés par métier. Le recruteur rejoint l'équipe du client avec ses outils et ses managers ; Kistone gère le contrat, la conformité, le CRA et la facturation.",
    strengths: [
      "Une niche : uniquement des recruteurs freelance",
      "Un recruteur choisi pour sa spécialité, présenté sous 48 h",
      "Le temps plein ou quelques jours par semaine, selon vos postes ouverts",
      "Contrat, KYC, CRA et facturation gérés par Kistone",
    ],
  },
  {
    name: "Solantis",
    url: "https://www.solantis.fr/",
    family: "cabinet",
    recruiters: "Recruteurs salariés en CDI",
    scope: "IT et digital",
    models: "Cellule de sourcing, délégation de recruteurs, externalisation complète ; tarifs non publiés",
    idealFor: "Les entreprises IT et digitales qui veulent confier leurs recrutements à une équipe pilotée par un cabinet",
    summary: "Cabinet spécialisé dans le RPO, actif dans le recrutement depuis 2010. Ses recruteurs sont intégrés aux équipes des clients, avec un chef de projet, des engagements de suivi (KPI et SLA) et une méthodologie propre.",
    strengths: [
      "Une expertise du RPO revendiquée depuis plus de 10 ans",
      "Une spécialisation IT et digital",
      "Une équipe dédiée, pilotée par un chef de projet",
      "Des engagements suivis par indicateurs",
    ],
  },
  {
    name: "GetPro",
    url: "https://www.getpro.co/le-rpo",
    family: "cabinet",
    recruiters: "Recruteurs salariés en CDI",
    scope: "Tech, cyber et IA, et recrutements go-to-market",
    models: "Recruteurs à la demande, intégrés à l'équipe ; tarifs non publiés",
    idealFor: "Les entreprises tech qui veulent augmenter rapidement leur capacité de recrutement avec un cabinet de chasse",
    summary: "Cabinet de chasse spécialisé dans la tech et l'IA, actif depuis 2015, avec des bureaux à Paris et à Marseille. Son offre de RPO met à disposition des recruteurs intégrés à l'équipe du client, avec les outils, la méthode et un interlocuteur unique.",
    strengths: [
      "Une culture de la chasse sur les profils tech",
      "L'équipe, les outils et la méthode fournis par le cabinet",
      "Un interlocuteur unique",
      "Une capacité qui évolue selon les priorités",
    ],
  },
  {
    name: "Le Club des RH",
    url: "https://www.leclubdesrh.fr/",
    family: "rh",
    recruiters: "Consultants RH indépendants",
    scope: "Toute la fonction RH : recrutement, paie, SIRH, formation, relations sociales…",
    models: "Au jour (TJM), mission en mode projet ou en régie, à temps plein ou partagé",
    idealFor: "Les directions RH qui cherchent un expert sur toute la fonction RH, dont le RPO",
    summary: "Plateforme de freelances RH, qui annonce plus de 2 500 consultants indépendants et plus de 30 métiers RH. Le RPO y est l'un des dispositifs proposés, à côté de la paie, du SIRH, de la formation ou du DRH à temps partagé.",
    strengths: [
      "Une couverture complète de la fonction RH",
      "Une shortlist sous 48 h",
      "Un contrat tripartite et une facturation centralisée",
      "Le suivi des jours en ligne",
    ],
  },
];

export const COMPARISON = {
  slug: "comparatif-rpo-freelance",
  title: "RPO freelance ou cabinet : le comparatif des acteurs en France",
  seoTitle: "RPO freelance : comparatif des acteurs en France",
  seoDescription: "Kistone, Solantis, GetPro, Le Club des RH : recruteurs freelance ou salariés, métiers couverts, facturation. Le comparatif 2026 des acteurs du RPO en France.",
  date: "2026-10-31",
  lead: "Cabinets de RPO, plateformes de freelances RH, réseau spécialisé de recruteurs freelance : pour renforcer vos recrutements, l'offre s'est structurée. La différence principale tient au statut du recruteur. Voici une grille de lecture des acteurs, de leurs atouts et des besoins auxquels chacun répond le mieux.",
  answer: "Le RPO en France se répartit en trois familles : les cabinets de RPO, comme Solantis et GetPro, dont les recruteurs sont salariés en CDI ; les plateformes de freelances RH, comme Le Club des RH, qui couvrent toute la fonction RH ; et les réseaux spécialisés de recruteurs freelance, comme Kistone, positionné sur cette seule niche. Le bon choix dépend du métier à recruter, du rythme et du cadre que vous attendez.",
  questions: [
    { title: "Quel statut de recruteur ?", desc: "Un salarié du cabinet, encadré par sa méthode, ou un indépendant qui a choisi le freelance et enchaîne les missions." },
    { title: "Quel métier ?", desc: "Certains acteurs sont centrés sur la tech. Si vous recrutez aussi en sales, en finance ou dans l'industrie, vérifiez qu'ils couvrent ces métiers." },
    { title: "Quel rythme ?", desc: "Temps plein ou quelques jours par semaine : vérifiez que le format s'ajuste à vos postes ouverts." },
    { title: "Quelle facturation ?", desc: "Demandez comment la mission est facturée, et ce qui reste à votre charge en cas de changement de périmètre." },
    { title: "Que vous reste-t-il à la fin ?", desc: "Le vivier, les process et les outils construits pendant la mission doivent rester chez vous." },
  ],
  faq: [
    { q: "Quelle différence entre un recruteur RPO freelance et un recruteur de cabinet ?", a: "Le recruteur de cabinet est salarié de son entreprise, qui le met à disposition avec sa méthode. Le recruteur freelance est indépendant : il a choisi ce mode d'exercice et travaille directement au sein de votre équipe, avec vos outils." },
    { q: "Pourquoi passer par Kistone plutôt que de chercher un freelance soi-même ?", a: "Kistone sélectionne et qualifie les recruteurs, présente un profil adapté à votre métier sous 48 h, et gère le contrat, la conformité, le CRA et la facturation." },
    { q: "Combien coûte un recruteur RPO freelance ?", a: "Chez Kistone, il est facturé au jour, en général entre 500 et 600 € HT, sans honoraires au placement. Un Head of TA se situe plutôt entre 800 et 1 000 € HT par jour." },
    { q: "Le RPO remplace-t-il un cabinet de recrutement classique ?", a: "Pas toujours. Le cabinet classique est adapté à un poste isolé, facturé au succès. Le RPO convient mieux à plusieurs recrutements en parallèle, avec un recruteur intégré à votre équipe." },
  ],
};

/** Anciennes adresses du comparatif (acteurs du fractional, puis plateformes de freelances IA). */
export const LEGACY_COMPARISON_SLUGS = ["comparatif-acteurs-fractional", "comparatif-plateformes-freelance-ia"];
