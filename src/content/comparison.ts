/**
 * Comparatif des plateformes pour trouver un expert IA freelance (Ressources).
 * Informations tirées des sites publics de chaque acteur (relevé du 16 octobre 2026) :
 * rester factuel et positif, mettre en avant les atouts de chacun. Les chiffres cités sont
 * ceux que les acteurs annoncent eux-mêmes. Jamais « management de transition ».
 */
export type Family = "specialist" | "selective" | "global" | "open";

export const FAMILIES: Record<Family, { label: string; desc: string }> = {
  specialist: { label: "Spécialiste des métiers de l'IA", desc: "Uniquement des profils IA et data : ingénieurs, produit, leadership, avec un matching dédié." },
  selective: { label: "Plateforme sélective tech et data", desc: "Des freelances tech, data et IA présélectionnés, souvent pour les grands comptes." },
  global: { label: "Réseau international sélectif", desc: "Un vivier mondial très sélectif, en anglais, souvent à distance." },
  open: { label: "Place de marché ou job board ouvert", desc: "Un très large vivier de freelances, en libre recherche, sur tous les métiers." },
};

export type Player = {
  name: string;
  url: string;
  family: Family;
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
    family: "specialist",
    scope: "AI Engineer, AI Product, AI Leader, et Tech recruiter pour recruter en CDI",
    models: "Mission freelance, fractional, contract-to-hire, squad IA",
    idealFor: "Les startups, scale-ups, PME et ETI qui veulent mettre l'IA en production avec un expert qualifié, vite, puis internaliser leurs talents",
    summary: "Plateforme française spécialiste des métiers de l'IA en freelance : AI Engineers, AI Product et AI Leaders sélectionnés et qualifiés en entretien, en mission, en fractional ou en contract-to-hire. Le matching combine l'IA et un échange humain de 30 minutes, et des Tech recruiters freelance aident à recruter les talents IA en CDI.",
    strengths: [
      "Uniquement des métiers de l'IA, de l'ingénierie au leadership",
      "Profils qualifiés en entretien et notés, présentés sous 48 h",
      "Le recrutement en CDI des talents IA sur la même plateforme (Tech recruiters RPO)",
      "Contrat, KYC, CRA et facturation gérés pour le client comme pour le freelance",
    ],
  },
  {
    name: "TalentAI",
    url: "https://talent-ai.fr/",
    family: "specialist",
    scope: "IA, data et machine learning (LLM et RAG, ML Engineers, data scientists, MLOps, vision)",
    models: "Freelance ou CDI, abonnements (Gratuit, Pro, Team)",
    idealFor: "Les entreprises, cabinets et ESN qui veulent chercher eux-mêmes un talent IA avec un matching automatisé",
    summary: "Marketplace française des talents IA, data et ML : l'entreprise décrit sa mission, un moteur de matching classe les profils et explique chaque recommandation, puis la mise en relation se fait directement. Le site annonce une relecture humaine de chaque profil avant publication.",
    strengths: [
      "Une spécialisation complète sur l'IA, la data et le ML",
      "Un matching qui explique chaque recommandation",
      "Le choix entre freelance et CDI",
      "Un assistant IA pour rechercher en langage naturel",
    ],
  },
  {
    name: "Koïno",
    url: "https://www.koino.fr/",
    family: "specialist",
    scope: "IA et data (ML Engineers, AI Architects, data scientists et engineers), développeurs",
    models: "Projets en taskforce, mise à disposition d'experts, recrutement, formation",
    idealFor: "Les entreprises qui veulent confier un projet IA complet, avec pilotage et livrables, ou former leurs équipes",
    summary: "Cabinet de conseil en IA et data qui combine conseil et développement, mise à disposition d'experts, recrutement et formation. Son site annonce des experts activables en 48 h et un diagnostic initial gratuit de 30 minutes.",
    strengths: [
      "Une offre de bout en bout, du diagnostic au projet livré",
      "Des experts activables en 48 h selon le site",
      "Le recrutement et la formation des équipes en complément",
    ],
  },
  {
    name: "Crème de la Crème",
    url: "https://www.cremedelacreme.io/",
    family: "selective",
    scope: "IA, data, cloud, cyber, IT et digital (dont ML, AI et NLP Engineers, MLOps)",
    models: "Freelance, portage, assistance technique, équipes (IA Factory), consulting",
    idealFor: "Les grands comptes et scale-ups qui staffent des projets tech et IA, ou montent une équipe dédiée",
    summary: "Plateforme française de freelances tech et digital créée en 2015. Selon son site, 10 % des candidats sont acceptés et trois profils disponibles sont présentés en 48 h ; elle propose aussi de constituer des équipes, dont une « IA Factory ».",
    strengths: [
      "Une sélection exigeante (10 % des candidats acceptés, selon le site)",
      "Trois profils disponibles en 48 h",
      "La possibilité de monter une équipe complète",
      "Une forte habitude des grands comptes",
    ],
  },
  {
    name: "Comet",
    url: "https://www.comet.co/",
    family: "selective",
    scope: "IA, tech, data et cyber",
    models: "Missions freelances accompagnées, portage salarial",
    idealFor: "Les grands groupes qui recrutent des experts tech, data ou IA indépendants avec un accompagnement du brief à la clôture",
    summary: "Cabinet de conseil en technologie fondé sur des consultants indépendants, avec une communauté d'environ 50 000 experts selon son site, un matching algorithmique et des agents de talents. Il anime aussi Comet Explore, un laboratoire dédié à l'IA.",
    strengths: [
      "Une large communauté d'experts tech et data",
      "Un accompagnement humain du brief à la fin de mission",
      "Des agences à Paris, Lille, Lyon et Nantes",
    ],
  },
  {
    name: "LeHibou",
    url: "https://www.lehibou.com/",
    family: "selective",
    scope: "Informatique (développement, cloud, big data, DevOps, SAP, PMO, DSI…)",
    models: "Missions freelances IT, offres Corporate pour les grands comptes",
    idealFor: "Les DSI et équipes tech qui staffent des projets informatiques, dont des projets data",
    summary: "Plateforme de freelances spécialisée dans l'informatique, qui annonce plus de 140 000 profils IT, un matching combinant l'IA et des spécialistes, et des bureaux dans six grandes villes françaises.",
    strengths: [
      "Une très large communauté de consultants IT",
      "Des profils rares grâce à l'IA et à des spécialistes du matching",
      "Une présence locale dans six métropoles",
    ],
  },
  {
    name: "Toptal",
    url: "https://www.toptal.com/artificial-intelligence",
    family: "global",
    scope: "IA, machine learning, NLP, vision, et l'ensemble des métiers tech",
    models: "Freelance à l'heure, temps partiel ou temps plein, équipes",
    idealFor: "Les entreprises à l'aise en anglais et à distance qui cherchent un profil très sélectionné à l'international",
    summary: "Réseau international de freelances qui annonce retenir 3 % des candidats au terme d'un processus en plusieurs étapes (évaluation, revue technique, entretien, projet test), avec une mise en relation en moins de 24 h et une période d'essai.",
    strengths: [
      "Un processus de sélection détaillé et très exigeant",
      "Une mise en relation rapide et une période d'essai",
      "Un vivier mondial, sur tous les fuseaux horaires",
    ],
  },
  {
    name: "Malt",
    url: "https://www.malt.fr/",
    family: "open",
    scope: "Tous les métiers freelances, dont une catégorie IA (consultants, AI et ML Engineers, MLOps)",
    models: "Missions freelances de toutes durées, outils de gestion pour les grands comptes",
    idealFor: "Les équipes qui recherchent elles-mêmes un freelance, IA ou non, parmi un très large choix",
    summary: "Grande place de marché européenne du freelancing, qui revendique plus d'un million de freelances et plus de 20 000 projets d'IA en cours. Le client recherche et contacte lui-même les profils, avec contrats et paiements digitalisés.",
    strengths: [
      "Le plus large choix de profils, IA compris",
      "Une recherche en libre-service, avec une recherche par IA",
      "Paiements sécurisés, missions assurées et intégration aux outils achats",
    ],
  },
  {
    name: "Free-Work",
    url: "https://www.free-work.com/fr/tech-it",
    family: "open",
    scope: "Métiers de l'informatique, dont l'IA et la data",
    models: "Job board : missions freelance et emplois salariés",
    idealFor: "Les recruteurs IT, ESN et clients finaux qui publient eux-mêmes une mission et trient les candidatures",
    summary: "Job board de référence des métiers IT, issu de la fusion de Freelance-info et Carriere-info : missions freelance et offres d'emploi, CVthèque pour les recruteurs, et des repères de TJM et de salaires.",
    strengths: [
      "Une très large audience de professionnels IT",
      "Missions freelance et emplois au même endroit",
      "Des baromètres de TJM et de salaires utiles pour se situer",
    ],
  },
];

export const COMPARISON = {
  slug: "comparatif-plateformes-freelance-ia",
  title: "Trouver un expert IA freelance : comparatif des plateformes en France",
  seoTitle: "Expert IA freelance : comparatif des plateformes 2026",
  seoDescription: "Kistone, TalentAI, Koïno, Crème de la Crème, Comet, LeHibou, Toptal, Malt, Free-Work : qui propose quels profils IA, pour quels besoins, et comment choisir.",
  date: "2026-10-16",
  lead: "Spécialistes de l'IA, plateformes sélectives tech et data, réseaux internationaux, places de marché ouvertes : pour recruter un AI Engineer, un AI Product Manager ou un leader IA en freelance, l'offre s'est structurée. Voici une grille de lecture objective des principaux acteurs, de leurs atouts et des besoins auxquels chacun répond le mieux.",
  answer: "Pour trouver un expert IA freelance, il existe quatre familles d'acteurs : les spécialistes des métiers de l'IA (comme Kistone), les plateformes sélectives tech et data, les réseaux internationaux sélectifs et les places de marché ou job boards ouverts. Le bon choix dépend du profil recherché (ingénierie, produit ou leadership), du niveau de sélection attendu, de l'urgence, de la langue de travail et de l'envie d'internaliser ensuite le talent.",
  questions: [
    { title: "Quel profil ?", desc: "Construire (AI Engineer), concevoir et faire adopter (AI Product) ou fixer le cap (AI Leader) : un spécialiste de l'IA connaît ces nuances." },
    { title: "Quel niveau de sélection ?", desc: "Profils qualifiés en entretien et présentés par l'acteur, ou libre accès à un large vivier à évaluer vous-même." },
    { title: "Quelle urgence ?", desc: "La plupart des acteurs sélectifs présentent des profils sous 48 h ; une place de marché ouverte permet de chercher soi-même immédiatement." },
    { title: "Quelle langue et quelle proximité ?", desc: "Un vivier français, au bureau ou en hybride, ou un réseau international en anglais et à distance." },
    { title: "Et après la mission ?", desc: "Contract-to-hire, recrutement en CDI, transfert de savoir-faire : vérifiez comment l'acteur vous aide à internaliser." },
  ],
  faq: [
    { q: "Quelle différence entre une plateforme spécialisée IA et une plateforme tech généraliste ?", a: "Une plateforme spécialisée ne propose que des métiers de l'IA et sait évaluer ce qui compte pour ces profils : mise en production, évaluation des modèles, choix d'architecture. Une plateforme tech généraliste couvre un spectre plus large, de la data au cloud." },
    { q: "Plateforme sélective ou place de marché ouverte ?", a: "Une plateforme sélective qualifie chaque profil et vous présente une sélection ; une place de marché ouverte donne accès à un très large vivier dans lequel vous recherchez et évaluez vous-même." },
    { q: "Combien coûte un expert IA freelance ?", a: "Il est facturé au jour, et le TJM varie fortement selon la séniorité et la spécialité. Les missions d'AI Engineer publiées en octobre 2026 sur les job boards IT affichent souvent 600 à 900 € HT par jour ; les rôles de leadership IA se situent au-dessus." },
    { q: "Peut-on recruter ensuite l'expert en CDI ?", a: "Oui, avec le contract-to-hire : la mission commence en freelance et peut se transformer en embauche. Certains acteurs, comme Kistone avec ses Tech recruiters, aident aussi à recruter d'autres talents IA en CDI." },
  ],
};

/** Ancienne adresse du comparatif (acteurs du fractional, avant le pivot IA). */
export const LEGACY_COMPARISON_SLUG = "comparatif-acteurs-fractional";
