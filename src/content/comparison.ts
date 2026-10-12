/**
 * Comparatif des acteurs du fractional et de l'intérim de direction (Ressources).
 * Informations tirées des sites publics de chaque acteur (relevé du 12 octobre 2026) :
 * rester factuel et positif, mettre en avant les atouts de chacun. Les chiffres cités sont
 * ceux que les acteurs annoncent eux-mêmes. Jamais « management de transition ».
 */
export type Family = "selective" | "specialist" | "firm" | "open";

export const FAMILIES: Record<Family, { label: string; desc: string }> = {
  selective: { label: "Plateforme sélective multi-fonctions", desc: "Des dirigeants et recruteurs qualifiés sur toutes les fonctions clés, présentés sous 48 h." },
  specialist: { label: "Spécialiste d'une fonction", desc: "Une expertise profonde sur un métier : RH, finance, marketing et revenu, ou tech." },
  firm: { label: "Cabinet d'intérim et de transition", desc: "Des réseaux de managers expérimentés pour les missions à temps plein, souvent urgentes." },
  open: { label: "Plateforme ouverte", desc: "Un très large vivier de freelances, en libre recherche, sur tous les métiers." },
};

export type Player = {
  name: string;
  url: string;
  family: Family;
  /** Fonctions couvertes, en une ligne. */
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
    family: "selective",
    scope: "RPO, DRH, CFO, COO, CRO, CTO, CPO, CDO",
    models: "Fractional, intérim, contract-to-hire",
    idealFor: "Startups, scale-ups et PME Tech & Digital qui veulent un dirigeant ou un recruteur qualifié, vite, sur n'importe quelle fonction clé",
    summary: "Plateforme française de Fractional Leaders : uniquement des profils qualifiés en entretien, sur les huit fonctions de direction et de recrutement, à temps partagé, à temps plein ou en contract-to-hire. Le matching combine l'IA et un échange humain avant chaque mise en relation.",
    strengths: [
      "Couverture de toutes les fonctions clés sur une seule plateforme, recrutement (RPO) compris",
      "Profils qualifiés en entretien et notés : pas de place de marché ouverte",
      "Un premier profil présenté sous 48 h, un démarrage en une semaine en général",
      "Contrat, CRA et facturation unique gérés pour le client comme pour le freelance",
    ],
  },
  {
    name: "Le Club des RH",
    url: "https://www.leclubdesrh.fr/",
    family: "specialist",
    scope: "Ressources humaines (DRH, paie, recrutement, formation…)",
    models: "Temps partagé, intérim, régie, projet, RPO, audit, formation",
    idealFor: "Les entreprises qui cherchent un expert RH pointu, du DRH à temps partagé à l'audit de paie",
    summary: "Plateforme de consultants RH indépendants, couvrant plus de 30 métiers RH selon son site. Son offre va de l'audit et du conseil à l'externalisation (DRH à temps partagé, paie, RPO) et à la formation, via un organisme certifié Qualiopi.",
    strengths: [
      "Une profondeur rare sur toute la fonction RH, de la paie à la QVCT",
      "Une shortlist de 2 à 3 consultants sous 48 h",
      "Un contrat tripartite, une facture unique et le suivi des temps en ligne",
      "Une offre de formation certifiée Qualiopi",
    ],
  },
  {
    name: "Mateerz",
    url: "https://mateerz.com/",
    family: "specialist",
    scope: "Marketing et revenu (CMO, CRO / CSO, growth)",
    models: "Fractional, intérim, squads, agence hybride, recrutement",
    idealFor: "Les startups et scale-ups B2B qui veulent structurer leur marketing ou leur machine commerciale",
    summary: "Spécialiste du leadership marketing et revenu : CMO et CRO à temps partagé, mais aussi squads de freelances, agence hybride et go-to-market, avec des bureaux à Paris, Barcelone et Londres.",
    strengths: [
      "Une expertise très poussée sur le marketing, la croissance et le revenu",
      "Une sélection exigeante des profils",
      "Des formats complémentaires : du dirigeant seul à l'équipe d'exécution",
      "Une présence internationale (Paris, Barcelone, Londres)",
    ],
  },
  {
    name: "CO-CTO",
    url: "https://co-cto.fr/en",
    family: "specialist",
    scope: "Tech, produit et IA (CTO, CPO, Chief AI Officer)",
    models: "Fractional, audit, due diligence, recrutement",
    idealFor: "Les startups qui ont besoin d'un CTO senior, d'un audit technique ou d'une due diligence avant une levée",
    summary: "Collectif de CTO, CPO et responsables IA (environ 700 selon son site), spécialisé dans l'accompagnement tech des startups et scale-ups : CTO à temps partagé, audit, due diligence technique et recrutement de CTO.",
    strengths: [
      "Une communauté de CTO très expérimentés (18 ans en moyenne selon son site)",
      "Une forte expertise en audit et due diligence technique",
      "Une couverture produit et IA en plus de la tech",
    ],
  },
  {
    name: "MyCFO",
    url: "https://mycfo.fr/",
    family: "specialist",
    scope: "Finance et comptabilité",
    models: "CFO à temps partagé, renfort, expertise comptable",
    idealFor: "Les startups et PME qui veulent réunir pilotage financier et tenue comptable chez un même partenaire",
    summary: "Cabinet de conseil financier et comptable implanté à Paris, Nice et près de Genève. Il propose des CFO à temps partagé aux startups et PME, et des renforts comptables et financiers aux ETI et grands groupes.",
    strengths: [
      "Finance et comptabilité réunies chez un même partenaire",
      "Une expertise technique solide (normes françaises, IFRS, fiscalité, FP&A)",
      "Une présence en France et en Suisse",
    ],
  },
  {
    name: "Finaxim",
    url: "https://finaxim.fr/",
    family: "firm",
    scope: "Direction générale, DAF, DRH, DSI, commerce, marketing, achats, RSE",
    models: "Temps partagé, missions de direction",
    idealFor: "Les PME et ETI qui veulent un cadre dirigeant expérimenté quelques jours par mois, près de chez elles",
    summary: "Cabinet historique du temps partagé pour PME et ETI, présent dans six régions. Il met à disposition des cadres dirigeants expérimentés sur la plupart des fonctions, quelques jours par mois ou par semaine.",
    strengths: [
      "Une longue expérience du temps partagé en PME et ETI",
      "Un maillage régional (six bureaux en France)",
      "Une sélection et une certification des experts",
    ],
  },
  {
    name: "Reactive Executive",
    url: "https://www.reactive-executive.com/",
    family: "firm",
    scope: "Toutes les fonctions de direction",
    models: "Intérim de direction, transformation, redressement",
    idealFor: "Les entreprises qui doivent remplacer un dirigeant en urgence ou conduire une transformation",
    summary: "Cabinet d'intérim de direction basé à Paris et Lyon. Il propose des managers expérimentés pour remplacer un dirigeant, conduire une transformation ou redresser une situation, en France et à l'international.",
    strengths: [
      "Trois managers présentés sous 48 h",
      "Un très large réseau de managers",
      "Un suivi régulier de la mission avec le client et le manager",
    ],
  },
  {
    name: "Adequancy",
    url: "https://adequancy.com/",
    family: "firm",
    scope: "Direction générale, finance, RH, opérations, IT et data, achats, commerce, juridique",
    models: "Intérim, conseil, expertise",
    idealFor: "Les entreprises en transformation, en restructuration ou en forte croissance",
    summary: "Cabinet d'intérim et de conseil appuyé sur une plateforme d'experts indépendants. Il associe un matching par IA à une qualification humaine, et propose conseil, intérim de direction et expertise ponctuelle.",
    strengths: [
      "Un matching IA complété par une qualification humaine",
      "Une équipe de trois interlocuteurs pendant toute la mission",
      "Des formats qui peuvent évoluer du conseil à l'exécution",
    ],
  },
  {
    name: "SNR Partners",
    url: "https://snr-partners.com/",
    family: "firm",
    scope: "Direction générale, finance, RH, opérations, supply chain, commerce, juridique, SI",
    models: "Intérim de direction, transformation, gestion de crise",
    idealFor: "Les grands comptes et ETI qui cherchent un manager expérimenté pour une mission complexe",
    summary: "Cabinet d'intérim de direction fondé en 2009, qui intervient en France et à l'international, notamment pour de grands groupes, sur les départs, les transformations, les projets et les crises.",
    strengths: [
      "Une expérience des grands comptes et des projets complexes",
      "Deux à trois profils proposés sous 48 à 72 h",
      "Un accompagnement du client et du manager tout au long de la mission",
    ],
  },
  {
    name: "Malt",
    url: "https://www.malt.fr/",
    family: "open",
    scope: "Tous les métiers freelances (tech, data, design, marketing, conseil…)",
    models: "Missions freelances de toutes durées",
    idealFor: "Les équipes qui recherchent elles-mêmes un freelance, sur des métiers très variés",
    summary: "Grande place de marché européenne du freelancing : le client recherche et contacte lui-même les freelances parmi un très large vivier, avec contrats et paiements digitalisés et des outils de gestion pour les grands comptes.",
    strengths: [
      "Le plus large choix de profils et de métiers",
      "Une recherche en libre-service, rapide",
      "Paiements sécurisés, missions assurées et intégration aux outils achats",
    ],
  },
  {
    name: "LeHibou",
    url: "https://www.lehibou.com/",
    family: "open",
    scope: "Informatique (développement, cloud, data, SAP, PMO, DSI…)",
    models: "Missions freelances IT",
    idealFor: "Les DSI et équipes tech qui staffent des projets informatiques",
    summary: "Plateforme de freelances spécialisée dans l'informatique, avec une communauté de consultants IT et des bureaux dans six grandes villes françaises.",
    strengths: [
      "Une très large communauté de consultants IT",
      "Des profils techniques rares grâce à l'IA et à des spécialistes du matching",
      "Une présence locale dans six métropoles",
    ],
  },
];

export const COMPARISON = {
  slug: "comparatif-acteurs-fractional",
  title: "Dirigeants fractional et intérim : comparatif des acteurs en France",
  seoTitle: "Fractional et intérim de direction : comparatif des acteurs 2026",
  seoDescription: "Kistone, Le Club des RH, Mateerz, CO-CTO, MyCFO, Finaxim, Reactive Executive, Adequancy, SNR Partners, Malt, LeHibou : qui fait quoi, pour quels besoins, et comment choisir.",
  date: "2026-10-12",
  lead: "Plateformes sélectives, spécialistes d'une fonction, cabinets d'intérim, places de marché ouvertes : le marché des dirigeants freelance s'est structuré. Voici une grille de lecture objective des principaux acteurs en France, de leurs atouts et des besoins auxquels chacun répond le mieux.",
  answer: "Pour trouver un dirigeant à temps partagé ou par intérim, il existe quatre familles d'acteurs : les plateformes sélectives multi-fonctions (comme Kistone), les spécialistes d'une fonction (RH, finance, marketing, tech), les cabinets d'intérim et de transition, et les places de marché ouvertes. Le bon choix dépend de la fonction recherchée, du rythme (quelques jours par semaine ou temps plein), de l'urgence et du niveau de sélection attendu.",
  questions: [
    { title: "Quelle fonction ?", desc: "Un seul métier (RH, finance, tech) oriente vers un spécialiste ; plusieurs fonctions ou un besoin qui évolue, vers une plateforme multi-fonctions." },
    { title: "Quel rythme ?", desc: "Quelques jours par semaine dans la durée (fractional), temps plein sur une période (intérim) ou une mission qui peut déboucher sur un recrutement." },
    { title: "Quelle urgence ?", desc: "La plupart des acteurs sélectifs présentent des profils sous 48 à 72 h ; une place de marché ouverte permet de chercher soi-même immédiatement." },
    { title: "Quel niveau de sélection ?", desc: "Profils qualifiés en entretien et présentés par l'acteur, ou libre accès à un large vivier à évaluer vous-même." },
    { title: "Quel accompagnement ?", desc: "Contrat, suivi des temps, facturation unique, remplacement si besoin : vérifiez ce qui est pris en charge." },
  ],
  faq: [
    { q: "Quelle différence entre une plateforme sélective et une place de marché ouverte ?", a: "Une plateforme sélective qualifie chaque profil en entretien et vous présente une sélection ; une place de marché ouverte donne accès à un très large vivier dans lequel vous recherchez et évaluez vous-même." },
    { q: "Quelle différence entre fractional et intérim ?", a: "Le fractional est un engagement à temps partiel dans la durée, quelques jours par semaine ; l'intérim est un engagement à temps plein sur une période définie, souvent pour remplacer un dirigeant ou conduire un changement." },
    { q: "Combien coûte un dirigeant fractional ?", a: "Il est facturé au jour, en général entre 800 et 1 600 € HT selon la fonction et l'expérience, ce que confirment plusieurs acteurs du marché." },
    { q: "Faut-il choisir un spécialiste ou une plateforme multi-fonctions ?", a: "Un spécialiste apporte une grande profondeur sur un métier ; une plateforme multi-fonctions est plus simple si vous avez plusieurs besoins ou si votre besoin évolue (un CFO aujourd'hui, un DRH demain)." },
  ],
};
