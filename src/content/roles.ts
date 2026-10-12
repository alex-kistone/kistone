import type { Vertical } from "@/lib/verticals";

/**
 * Pages métier publiques (/recruter/…) : une par fonction, pour le SEO et les moteurs IA.
 * Même trame pour toutes : promesse, profils récents, chiffres clés, quand recruter,
 * définition et fiche de poste, FAQ. Vocabulaire : jamais « management de transition ».
 *
 * TJM indicatifs (€ HT / jour) : ordres de grandeur du marché français, à valider.
 */
export type SampleProfile = { name: string; job: string; xp: number; specialties: string[]; days: number | null; available: boolean };

export type RolePage = {
  vertical: Vertical;
  slug: string;
  /** Nom du poste, au singulier (« Fractional CFO »). */
  role: string;
  /** Nom du poste en toutes lettres (« directeur financier »). */
  longName: string;
  h1: string;
  lead: string;
  seoTitle: string;
  seoDescription: string;
  rate: [number, number];
  when: { title: string; desc: string }[];
  definition: string[];
  missions: string[];
  skills: string[];
  profile: string;
  faq: { q: string; a: string }[];
  /** Profils d'illustration, affichés tant qu'il n'y a pas assez de vrais profils 4-5 étoiles. */
  samples: SampleProfile[];
};

export const ROLE_PAGES: RolePage[] = [
  {
    vertical: "rpo",
    slug: "fractional-rpo",
    role: "Fractional RPO",
    longName: "recruteur externalisé (RPO)",
    h1: "Recrutez un Fractional RPO",
    lead: "Des recruteurs seniors spécialisés par métier, intégrés à vos équipes en 48 h pour mener vos embauches du brief à l'onboarding. Sans honoraires au placement.",
    seoTitle: "Fractional RPO : externalisez vos recrutements",
    seoDescription: "Recrutement externalisé (RPO) : un recruteur freelance senior intégré à vos équipes en 48 h, spécialisé Tech, Data, Product, Sales ou Finance. Facturé au jour, sans honoraires au placement.",
    rate: [450, 750],
    when: [
      { title: "Un pic d'embauches", desc: "Une levée de fonds, un nouveau produit ou une ouverture de site : vous devez recruter 5, 10 ou 20 personnes en quelques mois." },
      { title: "Des profils pénuriques", desc: "Développeurs, data engineers, commerciaux grands comptes : vos annonces ne suffisent plus, il faut chasser." },
      { title: "Pas encore d'équipe Talent", desc: "Vous n'avez pas de recruteur interne et vos managers passent trop de temps à trier des CV." },
      { title: "Des cabinets trop chers", desc: "Les honoraires de 20 à 25 % du salaire annuel pèsent sur chaque embauche, sans visibilité sur le travail fourni." },
      { title: "Une marque employeur à construire", desc: "Vous voulez structurer le process, les grilles d'entretien et l'expérience candidat pour la suite." },
    ],
    definition: [
      "Le RPO (Recruitment Process Outsourcing) consiste à confier tout ou partie de vos recrutements à un recruteur externe qui travaille comme un membre de votre équipe : il utilise vos outils, parle au nom de votre entreprise et rend compte à vos managers.",
      "Avec un RPO freelance, vous payez du temps de recrutement (au jour) plutôt qu'un pourcentage par embauche. Le coût est prévisible, le recruteur se consacre à vos postes et le savoir-faire reste chez vous à la fin de la mission.",
    ],
    missions: [
      "Cadrer chaque poste avec le manager : missions, compétences clés, fourchette de salaire",
      "Rédiger et diffuser les annonces, animer les canaux de sourcing",
      "Chasser sur LinkedIn et les viviers spécialisés",
      "Mener les entretiens de présélection et présenter une shortlist argumentée",
      "Coordonner le process jusqu'à l'offre et à la prise de poste",
      "Suivre les indicateurs : délais, taux de conversion, sources",
    ],
    skills: [
      "Spécialisation métier (Tech, Data, Product, Sales, Finance…)",
      "Chasse et approche directe",
      "Maîtrise des ATS et de LinkedIn Recruiter",
      "Évaluation des compétences et de la motivation",
      "Négociation et closing des offres",
      "Pilotage par les données du recrutement",
    ],
    profile: "Un recruteur avec au moins 5 ans d'expérience, souvent passé par un cabinet puis une équipe Talent Acquisition en startup ou scale-up, qui connaît le marché des profils que vous cherchez.",
    faq: [
      { q: "Combien coûte un RPO freelance ?", a: "Il est facturé au jour, en général entre 450 et 750 € HT selon la spécialité et l'expérience. Pour plusieurs recrutements en parallèle, c'est le plus souvent bien moins cher que des honoraires de cabinet à 20 % du salaire." },
      { q: "Quelle différence avec un cabinet de recrutement ?", a: "Le cabinet est payé au succès, poste par poste. Le RPO freelance travaille à temps plein ou partiel au sein de votre équipe, sur l'ensemble de vos postes, et vous gardez le vivier et le process construits." },
      { q: "Combien de temps dure une mission RPO ?", a: "De 3 à 12 mois le plus souvent, à temps plein ou quelques jours par semaine. La mission s'ajuste au volume de postes à pourvoir." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Julie M.", job: "Recruteuse Tech & Produit", xp: 9, specialties: ["Tech", "Product"], days: null, available: true },
      { name: "Thomas R.", job: "Recruteur Tech", xp: 6, specialties: ["Tech", "Data"], days: 3, available: true },
      { name: "Inès B.", job: "Recruteuse Sales & GTM", xp: 8, specialties: ["Sales", "GTM"], days: 4, available: false },
    ],
  },
  {
    vertical: "drh",
    slug: "fractional-drh",
    role: "Fractional DRH",
    longName: "directeur des ressources humaines (CHRO)",
    h1: "Recrutez un Fractional DRH",
    lead: "Des DRH et CHRO présélectionnés pour vos enjeux RH, présentés en 48 h. Quelques jours par semaine ou à temps plein, avec la flexibilité du freelance et sans frais de recrutement.",
    seoTitle: "Fractional DRH (CHRO) à temps partagé",
    seoDescription: "DRH à temps partagé ou à temps plein : un CHRO senior pour structurer vos RH, la rémunération et les relations sociales. Profil présenté en 48 h, facturé au jour.",
    rate: [800, 1300],
    when: [
      { title: "Le cap des 50 salariés", desc: "CSE, obligations sociales, grilles de rémunération : il faut structurer les RH avant que les sujets ne s'accumulent." },
      { title: "Une forte croissance", desc: "Vous doublez l'effectif en un an et l'onboarding, les entretiens et la culture ne suivent plus." },
      { title: "Une réorganisation", desc: "Fusion, nouvelle organisation, plan de départs : vous avez besoin d'un DRH expérimenté pour conduire le changement." },
      { title: "Un DRH parti", desc: "Le poste est vacant pendant le recrutement du titulaire et les sujets RH ne peuvent pas attendre." },
      { title: "Un premier poste RH", desc: "Votre équipe RH est junior et a besoin d'un senior pour fixer le cap et la faire grandir." },
    ],
    definition: [
      "Le DRH (ou CHRO, Chief Human Resources Officer) définit et pilote la politique RH de l'entreprise : organisation, rémunération, développement des talents, relations sociales et conformité au droit du travail.",
      "Un Fractional DRH assure ce rôle quelques jours par semaine. Il apporte l'expérience d'un DRH confirmé à une entreprise qui n'a pas encore besoin, ou pas les moyens, d'un poste à temps plein.",
    ],
    missions: [
      "Construire la stratégie RH alignée sur le plan de croissance",
      "Mettre en place la politique de rémunération et les grilles de salaires",
      "Structurer les process : onboarding, entretiens annuels, plans de formation",
      "Piloter les relations sociales et le dialogue avec le CSE",
      "Sécuriser la conformité sociale et la paie",
      "Accompagner les managers et les réorganisations",
    ],
    skills: [
      "Droit du travail et relations sociales",
      "Rémunération et avantages sociaux",
      "Organisation et conduite du changement",
      "Développement des talents et management",
      "Pilotage RH par les indicateurs",
      "Posture de conseil auprès de la direction",
    ],
    profile: "Un DRH ou HRBP senior avec 10 ans d'expérience ou plus, dont plusieurs en startup ou scale-up, habitué à structurer une fonction RH en croissance.",
    faq: [
      { q: "Qu'est-ce qu'un DRH à temps partagé ?", a: "C'est un DRH expérimenté qui travaille pour vous quelques jours par semaine, souvent 1 à 3, en freelance. Il apporte la séniorité d'un DRH sans le coût d'un poste à temps plein." },
      { q: "Combien coûte un Fractional DRH ?", a: "Comptez en général 800 à 1 300 € HT par jour. À 2 jours par semaine, vous avez un DRH senior pour un budget ajusté à votre besoin réel." },
      { q: "Pour quelle taille d'entreprise ?", a: "Le format convient surtout entre 30 et 300 salariés : assez grand pour avoir de vrais sujets RH, pas encore assez pour un DRH à temps plein." },
      { q: "Peut-il gérer la paie ?", a: "Il pilote la paie et sa conformité, en s'appuyant sur votre prestataire ou votre gestionnaire de paie. Les spécialités de chaque profil sont indiquées avant la mise en relation." },
    ],
    samples: [
      { name: "Camille M.", job: "Fractional DRH", xp: 12, specialties: ["HR strategy", "Paye", "Relations sociales"], days: 3, available: true },
      { name: "Valérie B.", job: "DRH · Transformation RH", xp: 15, specialties: ["Transformation RH", "HRBP"], days: 2, available: true },
      { name: "Nicolas F.", job: "CHRO scale-up", xp: 14, specialties: ["Compensations & bénéfices", "HR Ops"], days: null, available: false },
    ],
  },
  {
    vertical: "cfo",
    slug: "fractional-cfo",
    role: "Fractional CFO",
    longName: "directeur administratif et financier (DAF)",
    h1: "Recrutez un Fractional CFO",
    lead: "Des CFO et DAF présélectionnés pour vos enjeux financiers, présentés en 48 h. Budget, trésorerie, reporting ou levée de fonds, à la carte : quelques jours par semaine ou à temps plein.",
    seoTitle: "Fractional CFO : DAF à temps partagé",
    seoDescription: "Fractional CFO ou DAF à temps partagé : pilotage financier, trésorerie, closing, reporting investisseurs et levée de fonds. Profil senior présenté en 48 h, facturé au jour.",
    rate: [900, 1500],
    when: [
      { title: "Avant ou après une levée", desc: "Préparer la data room, le business plan et le reporting investisseurs, puis tenir les engagements pris." },
      { title: "Une trésorerie sous tension", desc: "Vous manquez de visibilité sur le cash et devez bâtir un prévisionnel fiable à 12 ou 18 mois." },
      { title: "Des closings trop longs", desc: "Les comptes mensuels arrivent tard, les chiffres divergent et la direction pilote à l'aveugle." },
      { title: "Une opération de M&A", desc: "Acquisition, cession ou entrée d'un fonds : il faut un financier expérimenté pour l'audit et la négociation." },
      { title: "Une équipe finance à structurer", desc: "Votre comptable ou contrôleur de gestion a besoin d'un senior pour les outils, les process et le cap." },
    ],
    definition: [
      "Le CFO (Chief Financial Officer), ou DAF en France, est responsable de la santé financière de l'entreprise : budget, trésorerie, comptabilité, contrôle de gestion, financement et relation avec les investisseurs et les banques.",
      "Un Fractional CFO exerce ce rôle quelques jours par semaine. C'est le format privilégié des startups et PME qui ont besoin d'un regard financier de haut niveau sans recruter un DAF à temps plein.",
    ],
    missions: [
      "Construire le budget et le prévisionnel de trésorerie",
      "Fiabiliser et accélérer les clôtures mensuelles",
      "Mettre en place le reporting de direction et investisseurs",
      "Préparer et conduire les levées de fonds et financements bancaires",
      "Piloter la rentabilité par activité, produit ou client",
      "Choisir et déployer les outils financiers",
    ],
    skills: [
      "FP&A, budget et forecast",
      "Gestion de trésorerie",
      "Comptabilité et consolidation",
      "Levée de fonds et M&A",
      "Contrôle de gestion et analyse de rentabilité",
      "Outils finance (ERP, BI, outils de forecast)",
    ],
    profile: "Un DAF ou CFO avec 10 à 20 ans d'expérience, souvent passé par l'audit puis la direction financière de startups, scale-ups ou PME, et habitué aux échanges avec les investisseurs.",
    faq: [
      { q: "Qu'est-ce qu'un Fractional CFO ?", a: "Un directeur financier expérimenté qui travaille pour plusieurs entreprises, quelques jours par semaine chacune. Vous bénéficiez de son expertise au rythme dont vous avez besoin." },
      { q: "Combien coûte un Fractional CFO ?", a: "En général 900 à 1 500 € HT par jour selon l'expérience et le périmètre. À 2 jours par semaine, vous bénéficiez d'un DAF senior pour un budget ajusté à votre besoin réel." },
      { q: "Fractional CFO ou expert-comptable ?", a: "L'expert-comptable tient et certifie les comptes. Le Fractional CFO pilote : budget, trésorerie, financement, reporting et décisions stratégiques. Les deux travaillent ensemble." },
      { q: "Peut-il accompagner une levée de fonds ?", a: "Oui, c'est l'un des besoins les plus fréquents : business plan, data room, valorisation, échanges avec les fonds, puis reporting après la levée." },
    ],
    samples: [
      { name: "Thomas L.", job: "Fractional CFO", xp: 15, specialties: ["Trésorerie", "FP&A", "M&A / Levée de fonds"], days: 2, available: true },
      { name: "Youssef K.", job: "CFO · levées de fonds", xp: 13, specialties: ["M&A / Levée de fonds", "Reporting / Closing"], days: null, available: true },
      { name: "Hélène D.", job: "DAF PME", xp: 18, specialties: ["Comptabilité", "Controle de gestion"], days: 3, available: false },
    ],
  },
  {
    vertical: "cto",
    slug: "fractional-cto",
    role: "Fractional CTO",
    longName: "directeur technique",
    h1: "Recrutez un Fractional CTO",
    lead: "Des CTO présélectionnés pour vos enjeux tech et IA, présentés en 48 h. Architecture, équipes, delivery ou intégration de l'IA générative, quelques jours par semaine ou à temps plein.",
    seoTitle: "Fractional CTO : directeur technique à temps partagé",
    seoDescription: "Fractional CTO ou directeur technique à temps partagé : architecture, équipes tech, delivery et intégration de l'IA générative. Profil senior présenté en 48 h.",
    rate: [1000, 1600],
    when: [
      { title: "Pas de CTO dans l'équipe fondatrice", desc: "Vous devez faire les bons choix techniques et recruter vos premiers développeurs sans profil tech au board." },
      { title: "L'IA générative à intégrer", desc: "Vos clients l'attendent dans le produit : il faut choisir les cas d'usage, l'architecture et les fournisseurs." },
      { title: "Une plateforme qui ne suit plus", desc: "Lenteurs, incidents, dette technique : la croissance met l'architecture sous pression." },
      { title: "Une équipe tech qui grandit", desc: "De 5 à 30 développeurs : organisation, rituels, recrutement et management sont à construire." },
      { title: "Une due diligence", desc: "Un investisseur ou un acquéreur veut un audit technique sérieux de votre produit et de votre équipe." },
    ],
    definition: [
      "Le CTO (Chief Technology Officer), ou directeur technique, définit la stratégie technologique de l'entreprise et en garantit l'exécution : architecture, choix techniques, sécurité, organisation et recrutement des équipes d'ingénierie.",
      "Un Fractional CTO apporte cette vision et cette expérience quelques jours par semaine. Il convient aux startups qui n'ont pas encore de CTO, aux PME qui digitalisent leur offre et aux équipes qui doivent intégrer l'IA.",
    ],
    missions: [
      "Définir la stratégie et la roadmap technique avec la direction",
      "Concevoir une architecture capable de suivre la croissance",
      "Cadrer et piloter l'intégration de l'IA générative dans le produit",
      "Recruter, organiser et faire grandir l'équipe tech",
      "Mettre en place les pratiques de delivery, de qualité et de sécurité",
      "Représenter la tech auprès des investisseurs et des clients",
    ],
    skills: [
      "Architecture logicielle et cloud",
      "IA générative et intégration de LLM",
      "Management d'équipes d'ingénierie",
      "Delivery, qualité et DevOps",
      "Cybersécurité",
      "Arbitrages produit et technique",
    ],
    profile: "Un CTO ou VP Engineering avec 12 ans d'expérience ou plus, ayant déjà fait grandir une équipe tech en startup ou scale-up, et à l'aise avec les sujets IA.",
    faq: [
      { q: "Qu'est-ce qu'un Fractional CTO ?", a: "Un directeur technique expérimenté qui intervient quelques jours par semaine. Il prend les décisions techniques structurantes et encadre l'équipe, sans le coût d'un CTO à temps plein." },
      { q: "Combien coûte un Fractional CTO ?", a: "En général 1 000 à 1 600 € HT par jour, selon l'expérience et le périmètre. La plupart des missions se font à 2 ou 3 jours par semaine." },
      { q: "Peut-il coder ?", a: "Certains restent très opérationnels, d'autres se concentrent sur l'architecture et le management. Précisez-le dans votre besoin : le matching en tient compte." },
      { q: "Peut-il nous aider sur l'IA générative ?", a: "Oui. De nombreux CTO de la plateforme sont spécialisés en stratégie IA et intégration de LLM, du choix des cas d'usage à la mise en production." },
    ],
    samples: [
      { name: "Lina N.", job: "CTO · intégration IA", xp: 16, specialties: ["Stratégie IA & GenAI", "Intégration IA / LLM"], days: 3, available: true },
      { name: "Marc G.", job: "Head of AI", xp: 10, specialties: ["Intégration IA / LLM", "Architecture & scalabilité"], days: 2, available: true },
      { name: "Antoine P.", job: "CTO SaaS", xp: 14, specialties: ["Management d'équipes tech", "Cloud & DevOps"], days: null, available: false },
    ],
  },
  {
    vertical: "cro",
    slug: "fractional-cro",
    role: "Fractional CRO",
    longName: "directeur commercial (Chief Revenue Officer)",
    h1: "Recrutez un Fractional CRO",
    lead: "Des CRO et directeurs commerciaux présélectionnés pour vos enjeux de croissance, présentés en 48 h. Go-to-market, équipe sales, pipeline ou nouveau marché, au rythme qui vous convient.",
    seoTitle: "Fractional CRO : directeur commercial à temps partagé",
    seoDescription: "Fractional CRO ou directeur commercial à temps partagé : go-to-market, équipes sales, pipeline, RevOps et ouverture de marché. Profil senior présenté en 48 h.",
    rate: [900, 1500],
    when: [
      { title: "Passer du fondateur à une équipe", desc: "Les fondateurs vendent encore seuls : il faut un process, des recrutements et un management commercial." },
      { title: "Un nouveau marché", desc: "Ouverture d'un pays ou d'un segment : stratégie d'entrée, premiers clients, recrutement local." },
      { title: "Un pipeline imprévisible", desc: "Les prévisions ne tiennent pas, le CRM est mal tenu et les cycles s'allongent." },
      { title: "Des objectifs de levée à tenir", desc: "Le plan promis aux investisseurs suppose une accélération forte du chiffre d'affaires." },
      { title: "Sales, marketing et CSM désalignés", desc: "Chaque équipe a ses chiffres : il faut une vision revenue unifiée, de l'acquisition à la rétention." },
    ],
    definition: [
      "Le CRO (Chief Revenue Officer) est responsable de l'ensemble du chiffre d'affaires : ventes, développement commercial, et souvent marketing et customer success. Il aligne ces équipes sur un même objectif de revenu.",
      "Un Fractional CRO intervient quelques jours par semaine pour poser la stratégie commerciale, structurer l'équipe et le process de vente, et accompagner les managers jusqu'à ce que la machine tourne.",
    ],
    missions: [
      "Définir la stratégie go-to-market et le plan commercial",
      "Recruter, organiser et manager l'équipe commerciale",
      "Structurer le process de vente et le pipeline dans le CRM",
      "Mettre en place les prévisions et les indicateurs revenue",
      "Ouvrir de nouveaux marchés, segments ou canaux",
      "Améliorer la rétention et l'expansion des clients existants",
    ],
    skills: [
      "Stratégie go-to-market B2B",
      "Management d'équipes commerciales",
      "Sales Ops et RevOps",
      "Pricing et négociation grands comptes",
      "Expansion internationale",
      "Customer success et rétention",
    ],
    profile: "Un CRO, VP Sales ou directeur commercial avec 10 ans d'expérience ou plus, qui a déjà fait passer une équipe de quelques commerciaux à une organisation structurée.",
    faq: [
      { q: "CRO ou directeur commercial ?", a: "Le directeur commercial pilote les ventes. Le CRO couvre l'ensemble du revenu : ventes, marketing et customer success. Sur la plateforme, les deux profils sont proposés selon votre besoin." },
      { q: "Combien coûte un Fractional CRO ?", a: "En général 900 à 1 500 € HT par jour. Une part variable liée aux résultats peut se discuter selon les missions." },
      { q: "Peut-il vendre lui-même ?", a: "Certains profils restent sur le terrain pour les grands comptes, d'autres se concentrent sur l'équipe et le process. Précisez-le dans votre besoin." },
      { q: "Combien de temps dure la mission ?", a: "Souvent 6 à 12 mois, le temps de structurer l'équipe et le process, puis de recruter ou faire monter un responsable interne." },
    ],
    samples: [
      { name: "Sylvie B.", job: "CRO · ouverture de marché", xp: 14, specialties: ["Ouverture de marché", "Expansion internationale"], days: null, available: true },
      { name: "Karim B.", job: "Head of Sales · SaaS B2B", xp: 12, specialties: ["Management d'équipe commerciale", "Sales Ops / RevOps"], days: 2, available: true },
      { name: "Paul V.", job: "VP Sales", xp: 15, specialties: ["Grands comptes", "Stratégie go-to-market"], days: 3, available: false },
    ],
  },
  {
    vertical: "coo",
    slug: "fractional-coo",
    role: "Fractional COO",
    longName: "directeur des opérations",
    h1: "Recrutez un Fractional COO",
    lead: "Des COO présélectionnés pour vos enjeux opérationnels, présentés en 48 h. Process, scaling, pilotage de la performance ou ouverture de marché, quelques jours par semaine ou à temps plein.",
    seoTitle: "Fractional COO : directeur des opérations à temps partagé",
    seoDescription: "Fractional COO ou directeur des opérations à temps partagé : process, scaling, pilotage de la performance et organisation. Profil senior présenté en 48 h.",
    rate: [900, 1400],
    when: [
      { title: "Des fondateurs débordés", desc: "Le CEO gère tout l'opérationnel au détriment de la stratégie, des clients et des investisseurs." },
      { title: "Une croissance qui casse les process", desc: "Ce qui marchait à 20 personnes ne tient plus à 80 : il faut des process, des outils et des responsables." },
      { title: "Une ouverture de site ou de pays", desc: "Lancer de nouvelles opérations demande quelqu'un qui l'a déjà fait." },
      { title: "Une rentabilité à améliorer", desc: "Marges sous pression, coûts qui dérivent : il faut piloter la performance au plus près." },
      { title: "Une transformation", desc: "Nouvelle organisation, nouveaux outils, automatisation : le changement doit être conduit." },
    ],
    definition: [
      "Le COO (Chief Operating Officer), ou directeur des opérations, transforme la stratégie en exécution : organisation, process, supply chain, service client, outils et pilotage de la performance au quotidien.",
      "Un Fractional COO prend ce rôle quelques jours par semaine. Il libère les fondateurs de l'opérationnel et met en place une organisation capable de suivre la croissance.",
    ],
    missions: [
      "Traduire la stratégie en plan opérationnel et en objectifs",
      "Structurer les process et l'organisation des équipes",
      "Mettre en place les indicateurs et les rituels de pilotage",
      "Optimiser la supply chain, les achats ou le service client",
      "Choisir et déployer les outils, automatiser ce qui peut l'être",
      "Conduire les transformations et l'ouverture de nouvelles activités",
    ],
    skills: [
      "Organisation et management transverse",
      "Conception et amélioration des process",
      "Pilotage de la performance",
      "Supply chain et achats",
      "Conduite du changement",
      "Outils et automatisation",
    ],
    profile: "Un COO ou directeur des opérations avec 10 ans d'expérience ou plus, souvent passé par le conseil puis l'opérationnel en scale-up, habitué aux phases de forte croissance.",
    faq: [
      { q: "Qu'est-ce qu'un Fractional COO ?", a: "Un directeur des opérations expérimenté qui intervient quelques jours par semaine pour organiser, structurer et piloter vos opérations, sans recruter un COO à temps plein." },
      { q: "Combien coûte un Fractional COO ?", a: "En général 900 à 1 400 € HT par jour, selon l'expérience et le périmètre de la mission." },
      { q: "COO ou chef de projet ?", a: "Le chef de projet mène un chantier. Le COO a une vision d'ensemble des opérations et la légitimité pour arbitrer entre les équipes." },
      { q: "Pour quelle taille d'entreprise ?", a: "Le format convient surtout aux entreprises de 20 à 300 personnes en croissance, où les fondateurs ont besoin de déléguer l'opérationnel." },
    ],
    samples: [
      { name: "Aminata D.", job: "COO · scaling des opérations", xp: 14, specialties: ["Scaling des opérations", "Structuration & process"], days: 3, available: true },
      { name: "Rohit P.", job: "COO · supply chain", xp: 11, specialties: ["Supply chain & logistique", "Achats"], days: null, available: true },
      { name: "Claire T.", job: "Directrice des opérations", xp: 16, specialties: ["Pilotage de la performance", "Transformation & conduite du changement"], days: 2, available: false },
    ],
  },
  {
    vertical: "cpo",
    slug: "fractional-cpo",
    role: "Fractional CPO",
    longName: "directeur produit (Chief Product Officer)",
    h1: "Recrutez un Fractional CPO",
    lead: "Des CPO et Heads of Product présélectionnés pour vos enjeux produit, présentés en 48 h. Vision, roadmap, discovery ou équipe produit, quelques jours par semaine ou à temps plein.",
    seoTitle: "Fractional CPO : directeur produit à temps partagé",
    seoDescription: "Fractional CPO ou Head of Product à temps partagé : vision produit, roadmap, discovery, product-led growth et équipes produit. Profil senior présenté en 48 h.",
    rate: [900, 1400],
    when: [
      { title: "Une roadmap dictée par les urgences", desc: "Les demandes clients et commerciales s'empilent, sans vision ni priorisation claire." },
      { title: "La recherche du product-market fit", desc: "Vous devez tester vite, parler aux utilisateurs et savoir quoi arrêter." },
      { title: "Une équipe produit à créer", desc: "Premiers PM et designers : recrutement, organisation et méthodes sont à poser." },
      { title: "Un fondateur qui fait le produit seul", desc: "Le CEO ne peut plus porter la vision produit, les ventes et la levée en même temps." },
      { title: "Un virage IA ou une nouvelle offre", desc: "Lancer un produit ou intégrer l'IA demande un cadrage produit solide." },
    ],
    definition: [
      "Le CPO (Chief Product Officer), ou directeur produit, porte la vision du produit et décide de ce que l'entreprise construit : stratégie, roadmap, discovery, priorisation et organisation des équipes produit et design.",
      "Un Fractional CPO exerce ce rôle quelques jours par semaine. Il apporte méthode et recul à des équipes qui livrent beaucoup mais sans toujours savoir pourquoi.",
    ],
    missions: [
      "Définir la vision et la stratégie produit avec la direction",
      "Construire et prioriser la roadmap",
      "Installer la discovery : entretiens utilisateurs, tests, données d'usage",
      "Recruter et faire grandir les PM et designers",
      "Aligner produit, tech, sales et marketing",
      "Suivre les indicateurs d'usage, d'activation et de rétention",
    ],
    skills: [
      "Stratégie et vision produit",
      "Discovery et recherche utilisateur",
      "Priorisation et roadmap",
      "Product-led growth et monétisation",
      "Management d'équipes produit et design",
      "Produits IA",
    ],
    profile: "Un CPO, VP Product ou Head of Product avec 10 ans d'expérience ou plus, passé par des éditeurs SaaS ou des scale-ups, qui a déjà construit une équipe produit.",
    faq: [
      { q: "Qu'est-ce qu'un Fractional CPO ?", a: "Un directeur produit expérimenté qui intervient quelques jours par semaine pour cadrer la vision, la roadmap et l'équipe produit." },
      { q: "Combien coûte un Fractional CPO ?", a: "En général 900 à 1 400 € HT par jour, selon l'expérience et le périmètre." },
      { q: "CPO ou product manager ?", a: "Le product manager gère un périmètre du produit. Le CPO fixe la vision d'ensemble, arbitre les priorités et organise l'équipe produit." },
      { q: "Peut-il recruter nos premiers PM ?", a: "Oui, c'est souvent une partie de la mission : définir les postes, mener les entretiens et intégrer les nouveaux PM." },
    ],
    samples: [
      { name: "Élodie R.", job: "CPO SaaS B2B", xp: 13, specialties: ["Stratégie produit", "Roadmap & priorisation"], days: 2, available: true },
      { name: "Samuel K.", job: "Head of Product", xp: 10, specialties: ["Discovery & recherche utilisateur", "Product-led growth"], days: 3, available: true },
      { name: "Maud L.", job: "VP Product", xp: 15, specialties: ["Management d'équipes produit", "Produit IA"], days: null, available: false },
    ],
  },
  {
    vertical: "cdo",
    slug: "fractional-cdo",
    role: "Fractional CDO",
    longName: "directeur data (Chief Data Officer)",
    h1: "Recrutez un Fractional CDO",
    lead: "Des CDO et Heads of Data présélectionnés pour vos enjeux data et IA, présentés en 48 h. Stratégie, gouvernance, plateforme ou équipe data, quelques jours par semaine ou à temps plein.",
    seoTitle: "Fractional CDO : directeur data à temps partagé",
    seoDescription: "Fractional CDO ou Head of Data à temps partagé : stratégie data, gouvernance, plateforme, analytics et cas d'usage IA. Profil senior présenté en 48 h.",
    rate: [1000, 1500],
    when: [
      { title: "Des chiffres qui ne concordent pas", desc: "Chaque équipe a son tableur et ses indicateurs : personne ne fait confiance aux données." },
      { title: "Une plateforme data à construire", desc: "Entrepôt, pipelines, outils de BI : il faut faire les bons choix dès le départ." },
      { title: "Des projets IA qui piétinent", desc: "Les cas d'usage existent, mais les données ne sont ni prêtes ni gouvernées." },
      { title: "Une équipe data à structurer", desc: "Data engineers, analysts et data scientists travaillent sans cap ni priorités communes." },
      { title: "Des obligations de conformité", desc: "RGPD, sécurité, exigences clients : la gouvernance des données devient indispensable." },
    ],
    definition: [
      "Le CDO (Chief Data Officer), ou directeur data, fait de la donnée un actif de l'entreprise : stratégie data, gouvernance et qualité, plateforme technique, analytics et cas d'usage d'IA.",
      "Un Fractional CDO prend ce rôle quelques jours par semaine. Il convient aux entreprises qui veulent tirer parti de leurs données et de l'IA sans encore recruter un directeur data à temps plein.",
    ],
    missions: [
      "Définir la stratégie data et les cas d'usage prioritaires",
      "Mettre en place la gouvernance et la qualité des données",
      "Concevoir la plateforme data et choisir les outils",
      "Fiabiliser le reporting et les indicateurs de direction",
      "Lancer les premiers projets de data science et d'IA générative",
      "Recruter et organiser l'équipe data",
    ],
    skills: [
      "Stratégie et gouvernance des données",
      "Architecture de plateformes data",
      "Analytics et BI",
      "Data science, machine learning et IA générative",
      "RGPD et conformité",
      "Management d'équipes data",
    ],
    profile: "Un CDO, Head of Data ou directeur data avec 10 ans d'expérience ou plus, qui a déjà construit une plateforme et une équipe data en scale-up ou en grand groupe.",
    faq: [
      { q: "Qu'est-ce qu'un Fractional CDO ?", a: "Un directeur data expérimenté qui intervient quelques jours par semaine pour poser la stratégie, la gouvernance et la plateforme data." },
      { q: "Combien coûte un Fractional CDO ?", a: "En général 1 000 à 1 500 € HT par jour, selon l'expérience et le périmètre." },
      { q: "CDO ou CTO ?", a: "Le CTO est responsable de la technologie et du produit. Le CDO se concentre sur la donnée : sa qualité, sa gouvernance et sa valorisation, notamment par l'IA." },
      { q: "Peut-il lancer nos projets d'IA ?", a: "Oui. Il identifie les cas d'usage rentables, prépare les données nécessaires et pilote les premiers projets jusqu'en production." },
    ],
    samples: [
      { name: "Mehdi A.", job: "CDO · data & IA", xp: 14, specialties: ["Stratégie data", "IA générative"], days: 2, available: true },
      { name: "Sophie G.", job: "Head of Data", xp: 11, specialties: ["Data engineering", "Analytics & BI"], days: 3, available: true },
      { name: "Olivier C.", job: "Chief Data Officer", xp: 17, specialties: ["Gouvernance & qualité des données", "RGPD & conformité"], days: null, available: false },
    ],
  },
];

export const rolePath = (r: Pick<RolePage, "slug">) => `/recruter/${r.slug}`;
export const roleBySlug = (slug: string | undefined) => ROLE_PAGES.find((r) => r.slug === slug);
