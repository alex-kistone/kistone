import type { Vertical } from "@/lib/verticals";
import { HEAD_OF_TA_BUDGET, INDICATIVE_BUDGET } from "@/lib/indicativeBudget";

/**
 * Pages métier publiques (/recruter/…) : une par spécialité, pour le SEO et les moteurs IA.
 * Même trame pour toutes : promesse, profils récents, chiffres clés, quand recruter,
 * définition et fiche de poste, FAQ. Vocabulaire : jamais « management de transition ».
 *
 * Budgets indicatifs (€ HT / jour, prix client, marge Kistone comprise) : ceux validés par Alex
 * (src/lib/indicativeBudget.ts), repris ici pour que pages métiers et formulaire concordent.
 */
export type SampleProfile = { name: string; job: string; xp: number; specialties: string[]; days: number | null; available: boolean };

export type RolePage = {
  vertical: Vertical;
  slug: string;
  /** Nom du poste, au singulier (« AI Engineer »). */
  role: string;
  /** Ligne au-dessus du titre et sous-titre du menu (rôles de la famille par défaut). */
  eyebrow?: string;
  /** Métiers couverts : seuls les vrais profils de ces métiers sont montrés (tous par défaut). */
  metiers?: string[];
  /** Nom du poste en toutes lettres (« ingénieur IA »). */
  longName: string;
  h1: string;
  /** Mot du titre surligné en rose. */
  highlight: string;
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

/** Date de dernière révision des fiches métier (affichée « Mis à jour le » et dans les données structurées). */
export const ROLES_UPDATED = "2026-10-31";

export const ROLE_PAGES: RolePage[] = [
  {
    vertical: "engineer",
    slug: "ai-engineer",
    role: "AI Engineer",
    longName: "ingénieur IA",
    h1: "Recrutez un AI Engineer freelance",
    highlight: "AI Engineer",
    lead: "Des AI Engineers et LLM Engineers sélectionnés et qualifiés, présentés en 48 h. RAG, agents, MLOps et infrastructure : pour passer vos projets d'IA du prototype à la production.",
    seoTitle: "AI Engineer freelance : LLM, RAG, agents et MLOps",
    seoDescription: "AI Engineer ou LLM Engineer freelance : RAG, agents IA, MLOps et infrastructure IA. Profils qualifiés présentés en 48 h, en mission ou en contract-to-hire.",
    rate: INDICATIVE_BUDGET.engineer,
    when: [
      { title: "Un prototype à industrialiser", desc: "Votre POC d'IA générative impressionne en démo, mais il faut le fiabiliser, le sécuriser et le mettre en production." },
      { title: "Un RAG ou des agents à construire", desc: "Recherche dans vos documents, assistant métier, agents qui automatisent des tâches : il faut un spécialiste des LLM." },
      { title: "Une équipe tech sans expertise IA", desc: "Vos développeurs maîtrisent votre produit, pas encore l'évaluation des modèles, les embeddings ou l'orchestration d'agents." },
      { title: "Des coûts et une qualité à maîtriser", desc: "Latence, coût par requête, hallucinations : il faut mesurer, évaluer et optimiser vos modèles en continu." },
      { title: "Une plateforme MLOps à poser", desc: "Pipelines, monitoring, déploiement des modèles, GPU : votre IA a besoin d'une infrastructure solide." },
    ],
    definition: [
      "L'AI Engineer conçoit, intègre et met en production des systèmes fondés sur l'IA : modèles de langage (LLM), recherche augmentée (RAG), agents, modèles de machine learning, ainsi que les pipelines et l'infrastructure qui les font tourner.",
      "En freelance, il rejoint votre équipe le temps d'un projet ou d'une phase de construction. Vous accédez à une expertise rare et très demandée, sans attendre des mois un recrutement.",
    ],
    missions: [
      "Cadrer le cas d'usage et choisir les modèles adaptés",
      "Construire des pipelines RAG et des agents IA",
      "Mettre en place l'évaluation, les garde-fous et le monitoring",
      "Industrialiser : API, déploiement, MLOps / LLMOps",
      "Optimiser la latence, la qualité et le coût d'inférence",
      "Transmettre les bonnes pratiques à l'équipe tech",
    ],
    skills: [
      "LLM, embeddings et IA générative",
      "RAG, bases vectorielles et recherche sémantique",
      "Agents et orchestration (outils, frameworks d'agents)",
      "Python, API et intégration back-end",
      "MLOps / LLMOps, cloud et GPU",
      "Évaluation et fine-tuning des modèles",
    ],
    profile: "Un ingénieur logiciel ou data avec plusieurs années d'expérience, qui a déjà mis des projets d'IA générative en production et sait arbitrer entre qualité, coût et délai.",
    faq: [
      { q: "Combien coûte un AI Engineer freelance ?", a: "En général 600 à 1 000 € HT par jour selon l'expérience et la spécialité (RAG, agents, MLOps). Kistone vous donne un prix clair avant le démarrage." },
      { q: "AI Engineer ou data scientist ?", a: "Le data scientist explore les données et construit des modèles. L'AI Engineer met l'IA en production : intégration des LLM, RAG, agents, déploiement et suivi en conditions réelles." },
      { q: "Peut-il rejoindre notre équipe en CDI ensuite ?", a: "Oui, avec le contract-to-hire : la mission commence en freelance et peut se transformer en embauche si les deux parties le souhaitent." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil qualifié sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Lina", job: "AI Engineer · RAG", xp: 8, specialties: ["RAG & recherche sémantique", "LLM & IA générative"], days: null, available: true },
      { name: "Hugo", job: "LLM Engineer", xp: 6, specialties: ["Agents IA", "Intégration IA (API, back-end)"], days: null, available: true },
      { name: "Sami", job: "MLOps Engineer", xp: 9, specialties: ["MLOps / LLMOps", "Infrastructure IA & GPU"], days: 4, available: false },
    ],
  },
  {
    vertical: "product",
    slug: "ai-product-manager",
    role: "AI Product",
    longName: "Product Manager IA",
    h1: "Recrutez un AI Product Manager freelance",
    highlight: "AI Product",
    lead: "Des Product Managers, Product Owners et designers spécialisés IA, présentés en 48 h. Pour trouver les bons cas d'usage, concevoir des produits LLM utiles et les faire adopter.",
    seoTitle: "AI Product Manager freelance : produits IA et LLM",
    seoDescription: "Product Manager IA, Product Owner LLM ou AI Designer freelance : discovery, cas d'usage, roadmap et évaluation. Profils qualifiés présentés en 48 h.",
    rate: INDICATIVE_BUDGET.product,
    when: [
      { title: "Trop d'idées d'IA, pas de priorités", desc: "Chaque équipe veut son assistant : il faut identifier les cas d'usage qui créent vraiment de la valeur." },
      { title: "Un produit LLM à lancer", desc: "Vous construisez un copilote, un assistant ou une fonctionnalité IA et avez besoin d'un PM qui connaît ses spécificités." },
      { title: "Une adoption décevante", desc: "La fonctionnalité IA est en ligne mais peu utilisée : il faut repenser l'expérience et la confiance des utilisateurs." },
      { title: "Une qualité difficile à mesurer", desc: "Comment savoir si les réponses sont bonnes ? Il faut des critères d'évaluation et des boucles de feedback." },
      { title: "Une conformité à anticiper", desc: "AI Act, données personnelles, transparence : le produit doit intégrer ces exigences dès la conception." },
    ],
    definition: [
      "L'AI Product Manager fait le lien entre les besoins des utilisateurs, les possibilités des modèles d'IA et les contraintes de l'entreprise. Il choisit les cas d'usage, conçoit l'expérience et définit comment mesurer la qualité d'un produit dont les réponses ne sont jamais tout à fait déterministes.",
      "En freelance, il intervient pour lancer un produit IA, structurer une roadmap ou accompagner une équipe qui découvre ces sujets, le temps qu'il faut.",
    ],
    missions: [
      "Identifier et prioriser les cas d'usage d'IA à fort impact",
      "Mener la discovery avec les utilisateurs et les métiers",
      "Concevoir l'expérience : conversation, confiance, gestion des erreurs",
      "Définir les critères d'évaluation et de qualité des réponses",
      "Piloter la roadmap avec les AI Engineers",
      "Préparer le lancement et suivre l'adoption",
    ],
    skills: [
      "Product management et discovery",
      "Connaissance des LLM et de leurs limites",
      "Design conversationnel et UX de l'IA",
      "Évaluation de la qualité des modèles",
      "Roadmap et priorisation par la valeur",
      "AI Act et conformité",
    ],
    profile: "Un Product Manager ou Product Owner expérimenté qui a déjà lancé au moins un produit ou une fonctionnalité fondée sur l'IA générative, à l'aise avec les équipes techniques comme avec les métiers.",
    faq: [
      { q: "Combien coûte un AI Product Manager freelance ?", a: "En général 500 à 800 € HT par jour selon l'expérience et le périmètre du produit." },
      { q: "Qu'est-ce qui change par rapport à un PM classique ?", a: "Un produit IA ne se teste pas comme un logiciel classique : ses réponses varient. L'AI PM sait définir des critères de qualité, organiser l'évaluation et concevoir une expérience qui reste fiable." },
      { q: "Travaille-t-il avec nos développeurs ?", a: "Oui. Il pilote la roadmap avec votre équipe tech ou avec un AI Engineer freelance, que Kistone peut aussi vous présenter." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil qualifié sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Claire", job: "Product Manager IA", xp: 9, specialties: ["Product Manager IA", "Discovery & cas d'usage IA"], days: null, available: true },
      { name: "Yanis", job: "Product Owner · produits LLM", xp: 7, specialties: ["Product Owner produits LLM", "Évaluation & qualité des modèles"], days: 4, available: true },
      { name: "Emma", job: "AI Designer", xp: 8, specialties: ["AI Designer / UX IA", "Prompt & conversation design"], days: null, available: false },
    ],
  },
  {
    vertical: "leader",
    slug: "ai-leader",
    role: "AI Leader",
    longName: "directeur IA",
    h1: "Recrutez un AI Leader freelance",
    highlight: "AI Leader",
    lead: "CTO, Head of AI ou Chief AI Officer, en fractional ou en mission, présentés en 48 h. Pour définir votre stratégie IA, structurer l'équipe et faire passer les projets à l'échelle.",
    seoTitle: "AI Leader freelance : CTO, Head of AI, CAIO",
    seoDescription: "CTO, Head of AI ou Chief AI Officer en fractional ou en mission : stratégie IA, AI Act, équipes et plateformes. Profils seniors qualifiés présentés en 48 h.",
    rate: INDICATIVE_BUDGET.leader,
    when: [
      { title: "Une stratégie IA à définir", desc: "Le comité de direction veut de l'IA partout : il faut une feuille de route réaliste, chiffrée et priorisée." },
      { title: "Des projets IA qui piétinent", desc: "Les POC se multiplient sans passer en production : il faut un leader pour arbitrer et industrialiser." },
      { title: "Une équipe IA à construire", desc: "Recruter, organiser et faire grandir une équipe d'AI Engineers et de data scientists." },
      { title: "Des choix de plateformes structurants", desc: "Build ou buy, quels modèles, quel cloud : des décisions lourdes qui demandent de l'expérience." },
      { title: "Une gouvernance à poser", desc: "AI Act, sécurité, usage des données : il faut un cadre clair avant de déployer à grande échelle." },
    ],
    definition: [
      "L'AI Leader porte la stratégie IA de l'entreprise : CTO qui intègre l'IA au produit, Head of AI qui dirige l'équipe, ou Chief AI Officer qui pilote la transformation à l'échelle du groupe. Il arbitre les investissements, fixe le cadre de gouvernance et fait le lien avec la direction générale.",
      "En fractional, il intervient quelques jours par semaine ; en mission, à temps plein sur une période définie. Vous bénéficiez d'un dirigeant senior au rythme dont vous avez besoin.",
    ],
    missions: [
      "Définir la stratégie et la feuille de route IA",
      "Prioriser les cas d'usage et arbitrer build vs buy",
      "Mettre en place la gouvernance, la sécurité et la conformité AI Act",
      "Structurer et recruter l'équipe IA et data",
      "Faire passer les projets du POC à la production",
      "Acculturer le comité de direction et les équipes",
    ],
    skills: [
      "Stratégie IA et IA générative",
      "Leadership d'équipes tech, IA et data",
      "Architecture et choix de plateformes",
      "Gouvernance, sécurité et AI Act",
      "Conduite de la transformation",
      "Dialogue avec le comité de direction et les investisseurs",
    ],
    profile: "Un CTO, Head of AI ou directeur data avec 10 ans d'expérience ou plus, qui a déjà mené des projets d'IA jusqu'en production et dirigé des équipes techniques.",
    faq: [
      { q: "Combien coûte un AI Leader freelance ?", a: "En général 1 000 à 1 600 € HT par jour selon l'expérience et le périmètre. En fractional, à 2 jours par semaine, vous bénéficiez d'un dirigeant senior pour un budget ajusté à votre besoin." },
      { q: "Fractional ou mission ?", a: "Le fractional (quelques jours par semaine) convient pour piloter une stratégie dans la durée. La mission à temps plein convient à un lancement ou à une phase de construction intense." },
      { q: "Head of AI ou Chief AI Officer ?", a: "Le Head of AI dirige l'équipe qui construit les systèmes d'IA. Le Chief AI Officer pilote la transformation IA de toute l'entreprise, au niveau du comité de direction." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil qualifié sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Marc", job: "Head of AI", xp: 14, specialties: ["Head of AI", "Stratégie IA & GenAI"], days: 2, available: true },
      { name: "Nadia", job: "CTO · IA", xp: 16, specialties: ["CTO", "Build vs buy & plateformes"], days: 3, available: true },
      { name: "Paul", job: "Chief AI Officer", xp: 18, specialties: ["Chief AI Officer", "Gouvernance & AI Act"], days: null, available: false },
    ],
  },
  {
    vertical: "rpo",
    slug: "tech-recruiter",
    role: "Recruteur Tech",
    eyebrow: "Engineering · Data/AI · Product · Système d'information",
    metiers: ["Tech", "Data/AI", "Product"],
    longName: "recruteur tech freelance (RPO)",
    h1: "Un Recruteur Tech freelance, intégré à vos équipes",
    highlight: "Recruteur Tech",
    lead: "Un recruteur spécialisé sur les métiers Engineering, Data/AI, Product et système d'information, aux côtés des CTO de startups et des DSI de grands comptes. Facturé au jour, sans honoraires au placement.",
    seoTitle: "Recruteur Tech freelance (RPO) : Engineering, Data, Product, SI",
    seoDescription: "Recruteur Tech freelance (RPO) intégré à vos équipes pour recruter en CDI vos profils Engineering, Data/AI, Product et SI. Facturé au jour, sans honoraires au placement.",
    rate: INDICATIVE_BUDGET.rpo,
    when: [
      { title: "Une équipe tech à structurer", desc: "Startup en croissance : le CTO recrute ses développeurs, son lead et ses profils data, en plus de tout le reste." },
      { title: "Des profils pénuriques", desc: "Développeurs seniors, data engineers, architectes : vos annonces ne suffisent plus, il faut chasser." },
      { title: "Un pic d'embauches", desc: "Une levée de fonds ou un nouveau produit : vous devez recruter 5, 10 ou 20 personnes en quelques mois." },
      { title: "Une DSI à renforcer", desc: "Grand compte : des postes SI ouverts en parallèle, et une équipe recrutement qui ne couvre pas tout." },
      { title: "Des managers trop sollicités", desc: "Vos équipes techniques passent trop de temps à trier des CV au lieu de construire." },
    ],
    definition: [
      "Le RPO (Recruitment Process Outsourcing) consiste à confier tout ou partie de vos recrutements à un recruteur externe qui travaille comme un membre de votre équipe : il utilise vos outils, parle au nom de votre entreprise et rend compte à vos managers.",
      "Un Recruteur Tech freelance est spécialisé sur les métiers Engineering, Data/AI, Product et système d'information. Il intervient auprès des CTO de startups comme des DSI de grands comptes. Vous payez du temps de recrutement au jour plutôt qu'un pourcentage par embauche : le coût est prévisible et le savoir-faire reste chez vous.",
    ],
    missions: [
      "Cadrer chaque poste avec le CTO, le DSI ou le manager : stack, compétences clés, fourchette de salaire",
      "Chasser sur LinkedIn, GitHub et les communautés tech",
      "Préqualifier les compétences techniques et évaluer les candidats avec vos équipes",
      "Présenter une shortlist argumentée",
      "Coordonner le process jusqu'à l'offre et à la prise de poste",
      "Suivre les indicateurs : délais, taux de conversion, sources",
    ],
    skills: [
      "Connaissance des métiers Engineering, Data/AI, Product et SI",
      "Chasse et approche directe des profils tech",
      "Maîtrise des ATS et de LinkedIn Recruiter",
      "Dialogue avec les CTO, les DSI et les équipes techniques",
      "Négociation et closing des offres",
      "Pilotage par les données du recrutement",
    ],
    profile: "Un recruteur avec au moins 5 ans d'expérience sur des profils tech, souvent passé par un cabinet puis une équipe Talent Acquisition, en startup, en scale-up ou en grand compte.",
    faq: [
      { q: "Combien coûte un Recruteur Tech freelance ?", a: "Il est facturé au jour, en général entre 500 et 600 € HT selon l'expérience. Pour plusieurs recrutements en parallèle, c'est le plus souvent bien moins cher que des honoraires de cabinet à 20 % du salaire." },
      { q: "Quelle différence avec un cabinet de recrutement ?", a: "Le cabinet est payé au succès, poste par poste. Le Recruteur Tech freelance travaille au sein de votre équipe, sur l'ensemble de vos postes, et vous gardez le vivier et le process construits." },
      { q: "Intervient-il en startup comme en grand compte ?", a: "Oui. Il accompagne les CTO de startups qui structurent leur équipe comme les DSI de grands comptes qui ont plusieurs postes ouverts en parallèle." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Julie", job: "Recruteuse Tech", xp: 9, specialties: ["Tech", "Data/AI"], days: null, available: true },
      { name: "Thomas", job: "Recruteur Tech · DSI", xp: 6, specialties: ["Tech"], days: 3, available: true },
      { name: "Hugo", job: "Recruteur Data & Product", xp: 8, specialties: ["Data/AI", "Product"], days: 4, available: false },
    ],
  },
  {
    vertical: "rpo",
    slug: "recruteur-gtm",
    role: "Recruteur GTM",
    eyebrow: "Sales · Marketing",
    metiers: ["GTM", "Sales"],
    longName: "recruteur GTM freelance (RPO)",
    h1: "Un Recruteur GTM freelance, intégré à vos équipes",
    highlight: "Recruteur GTM",
    lead: "Un recruteur spécialisé sur les fonctions Sales & Marketing, pour construire vos équipes commerciales et marketing. Facturé au jour, sans honoraires au placement.",
    seoTitle: "Recruteur GTM freelance (RPO) : Sales & Marketing",
    seoDescription: "Recruteur GTM freelance (RPO) intégré à vos équipes pour recruter en CDI vos fonctions Sales & Marketing. Facturé au jour, sans honoraires au placement.",
    rate: INDICATIVE_BUDGET.rpo,
    when: [
      { title: "Une équipe commerciale à monter", desc: "Vos premiers commerciaux, ou une équipe à doubler pour tenir vos objectifs." },
      { title: "Un nouveau marché", desc: "Une nouvelle offre ou un nouveau pays : il faut des profils qui connaissent ce terrain." },
      { title: "Un marketing à structurer", desc: "Acquisition, contenu, produit : des postes différents, que votre équipe ne sait pas tous évaluer." },
      { title: "Des recrues qui ne tiennent pas", desc: "Un bon discours en entretien ne fait pas un bon commercial : il faut évaluer les résultats passés." },
      { title: "Des dirigeants trop sollicités", desc: "Le fondateur ou le directeur commercial passe ses journées à recruter plutôt qu'à vendre." },
    ],
    definition: [
      "Le RPO (Recruitment Process Outsourcing) consiste à confier tout ou partie de vos recrutements à un recruteur externe qui travaille comme un membre de votre équipe : il utilise vos outils, parle au nom de votre entreprise et rend compte à vos managers.",
      "Un Recruteur GTM (go-to-market) freelance est spécialisé sur les fonctions Sales & Marketing. Il connaît les métiers, les viviers et les niveaux de rémunération de ces fonctions, et sait évaluer un candidat sur ses résultats. Vous payez du temps de recrutement au jour plutôt qu'un pourcentage par embauche.",
    ],
    missions: [
      "Cadrer chaque poste avec le manager : cible, cycle de vente, rémunération fixe et variable",
      "Chasser sur LinkedIn et les communautés sales et marketing",
      "Évaluer les candidats sur leurs résultats et leur méthode",
      "Présenter une shortlist argumentée",
      "Coordonner le process jusqu'à l'offre et à la prise de poste",
      "Suivre les indicateurs : délais, taux de conversion, sources",
    ],
    skills: [
      "Connaissance des fonctions Sales & Marketing",
      "Chasse et approche directe",
      "Maîtrise des ATS et de LinkedIn Recruiter",
      "Évaluation des résultats commerciaux",
      "Négociation et closing des offres, variable compris",
      "Pilotage par les données du recrutement",
    ],
    profile: "Un recruteur avec au moins 5 ans d'expérience sur des profils commerciaux et marketing, en cabinet ou en équipe Talent Acquisition.",
    faq: [
      { q: "Quels postes recrute un Recruteur GTM ?", a: "Les fonctions Sales & Marketing : commerciaux, responsables de comptes, managers commerciaux, marketing et acquisition." },
      { q: "Combien coûte un Recruteur GTM freelance ?", a: "Il est facturé au jour, en général entre 500 et 600 € HT selon l'expérience, sans honoraires au placement." },
      { q: "Quelle différence avec un cabinet de recrutement ?", a: "Le cabinet est payé au succès, poste par poste. Le Recruteur GTM freelance travaille au sein de votre équipe, sur l'ensemble de vos postes, et vous gardez le vivier et le process construits." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Marc", job: "Recruteur Sales · SaaS B2B", xp: 12, specialties: ["Sales", "GTM"], days: 3, available: true },
      { name: "Emma", job: "Recruteuse Sales", xp: 8, specialties: ["Sales"], days: null, available: true },
      { name: "Yanis", job: "Recruteur Marketing", xp: 7, specialties: ["GTM"], days: 4, available: false },
    ],
  },
  {
    vertical: "rpo",
    slug: "recruteur-generaliste",
    role: "Recruteur généraliste",
    eyebrow: "Toutes fonctions · Méthodes de recrutement",
    longName: "recruteur généraliste freelance (RPO)",
    h1: "Un Recruteur généraliste freelance, intégré à vos équipes",
    highlight: "Recruteur généraliste",
    lead: "Un recruteur capable d'intervenir sur n'importe quelle fonction, avec une méthode solide : tri de CV, entretiens structurés, scorecards. Facturé au jour, sans honoraires au placement.",
    seoTitle: "Recruteur généraliste freelance (RPO) : toutes fonctions",
    seoDescription: "Recruteur généraliste freelance (RPO) pour recruter sur toutes vos fonctions, avec une méthode structurée : tri de CV, entretiens structurés, scorecards. Facturé au jour.",
    rate: INDICATIVE_BUDGET.rpo,
    when: [
      { title: "Des postes très variés", desc: "Finance, industrie, RH, opérations : vos recrutements couvrent plusieurs fonctions à la fois." },
      { title: "Pas encore d'équipe Talent", desc: "Vous n'avez pas de recruteur interne et vos managers recrutent sans méthode commune." },
      { title: "Un process à structurer", desc: "Chaque manager évalue à sa façon : il faut des critères partagés et des entretiens comparables." },
      { title: "Un volume de candidatures à traiter", desc: "Beaucoup de CV reçus, peu de temps pour les trier et répondre à chacun." },
      { title: "Des erreurs de recrutement", desc: "Des embauches qui ne tiennent pas : il faut objectiver les décisions avant de signer." },
    ],
    definition: [
      "Le RPO (Recruitment Process Outsourcing) consiste à confier tout ou partie de vos recrutements à un recruteur externe qui travaille comme un membre de votre équipe : il utilise vos outils, parle au nom de votre entreprise et rend compte à vos managers.",
      "Un Recruteur généraliste freelance intervient sur n'importe quelle fonction et met l'accent sur la méthode : tri de CV, entretiens structurés et scorecards. Ce cadre rend les candidats comparables, évite les décisions à l'intuition et reste dans votre entreprise après la mission.",
    ],
    missions: [
      "Cadrer chaque poste avec le manager et définir les critères d'évaluation",
      "Trier les CV et répondre aux candidatures",
      "Conduire des entretiens structurés, avec les mêmes questions pour chaque candidat",
      "Construire des scorecards et former les managers à leur utilisation",
      "Présenter une shortlist argumentée",
      "Coordonner le process jusqu'à l'offre et à la prise de poste",
    ],
    skills: [
      "Recrutement toutes fonctions",
      "Tri de CV et sélection",
      "Entretiens structurés",
      "Scorecards et critères d'évaluation",
      "Maîtrise des ATS et de LinkedIn Recruiter",
      "Accompagnement des managers",
    ],
    profile: "Un recruteur avec au moins 5 ans d'expérience sur des fonctions variées, attaché à la rigueur du process et à la qualité de l'évaluation.",
    faq: [
      { q: "Qu'est-ce qu'une scorecard de recrutement ?", a: "Une grille qui liste les critères attendus pour un poste et note chaque candidat sur ces mêmes critères. Elle rend les candidats comparables et limite les décisions à l'intuition." },
      { q: "Qu'est-ce qu'un entretien structuré ?", a: "Un entretien où chaque candidat répond aux mêmes questions, évaluées selon les mêmes critères, plutôt qu'une conversation différente à chaque fois." },
      { q: "Sur quelles fonctions intervient-il ?", a: "Sur n'importe quelle fonction : finance, industrie, RH, opérations et plus largement tous les postes qui n'appellent pas un recruteur spécialisé." },
      { q: "Combien coûte un Recruteur généraliste freelance ?", a: "Il est facturé au jour, en général entre 500 et 600 € HT selon l'expérience, sans honoraires au placement." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Nadia", job: "Recruteuse généraliste", xp: 11, specialties: ["Finance", "Autres"], days: 3, available: true },
      { name: "Adam", job: "Recruteur généraliste · Industrie", xp: 10, specialties: ["Industrie"], days: null, available: true },
      { name: "Claire", job: "Recruteuse généraliste", xp: 8, specialties: ["Autres"], days: 4, available: false },
    ],
  },
  {
    vertical: "rpo",
    slug: "head-of-ta",
    role: "Head of TA",
    eyebrow: "Process · Structuration de la fonction recrutement",
    // Pas de vrais profils repérés comme Head of TA pour l'instant : exemples seuls
    metiers: [],
    longName: "Head of Talent Acquisition freelance",
    h1: "Un Head of TA freelance, pour structurer votre recrutement",
    highlight: "Head of TA",
    lead: "Un Head of Talent Acquisition à temps plein ou quelques jours par semaine, pour mettre en place vos process et structurer la fonction recrutement. Facturé au jour, sans honoraires au placement.",
    seoTitle: "Head of TA freelance : structurer votre fonction recrutement",
    seoDescription: "Head of Talent Acquisition freelance pour mettre en place vos process de recrutement et structurer la fonction, à temps plein ou quelques jours par semaine. Facturé au jour.",
    rate: HEAD_OF_TA_BUDGET,
    when: [
      { title: "Une fonction recrutement à créer", desc: "L'entreprise grandit et le recrutement repose encore sur les managers et les fondateurs." },
      { title: "Des process à mettre en place", desc: "Chaque équipe recrute à sa façon : il faut un parcours commun, des critères et des rôles clairs." },
      { title: "Une équipe Talent à piloter", desc: "Vos recruteurs ont besoin d'un cap, d'un manager et d'objectifs partagés." },
      { title: "Un plan de recrutement à préparer", desc: "Une levée de fonds ou un budget à venir : il faut prioriser les postes et dimensionner l'équipe." },
      { title: "Un poste à tenir en attendant", desc: "Votre Head of TA est parti ou le poste n'est pas encore ouvert : la fonction continue d'avancer." },
    ],
    definition: [
      "Un Head of TA (Head of Talent Acquisition) dirige la fonction recrutement d'une entreprise : il définit les process, choisit les outils, pilote l'équipe et rend compte à la direction.",
      "En freelance, il intervient à temps plein ou quelques jours par semaine pour structurer la fonction, sans que vous ayez à créer le poste tout de suite. Vous payez du temps au jour, et les process, les outils et les méthodes mis en place restent chez vous.",
    ],
    missions: [
      "Faire l'état des lieux du recrutement : process, outils, délais, équipe",
      "Mettre en place le process de recrutement, de la demande de poste à l'intégration",
      "Structurer la fonction : rôles, organisation, recrutements de l'équipe Talent",
      "Choisir et paramétrer les outils, dont l'ATS",
      "Former les managers à l'évaluation des candidats",
      "Construire le plan de recrutement et suivre les indicateurs avec la direction",
    ],
    skills: [
      "Structuration d'une fonction Talent Acquisition",
      "Conception de process de recrutement",
      "Choix et déploiement d'un ATS",
      "Management d'équipes de recruteurs",
      "Pilotage par les données du recrutement",
      "Dialogue avec la direction et les managers",
    ],
    profile: "Un responsable du recrutement expérimenté, qui a déjà construit ou dirigé une équipe Talent Acquisition en startup, en scale-up ou en grand groupe.",
    faq: [
      { q: "Qu'est-ce qu'un Head of TA ?", a: "Le Head of Talent Acquisition dirige la fonction recrutement : il définit les process, choisit les outils, pilote l'équipe et rend compte à la direction." },
      { q: "Quelle différence avec un recruteur RPO ?", a: "Le recruteur RPO remplit vos postes. Le Head of TA construit le cadre dans lequel ils sont pourvus : process, outils, organisation. Les deux peuvent travailler ensemble." },
      { q: "Peut-il intervenir à temps partiel ?", a: "Oui. Il intervient à temps plein ou quelques jours par semaine, selon l'avancement de votre structuration." },
      { q: "Combien coûte un Head of TA freelance ?", a: "Il est facturé au jour, en général entre 800 et 1 000 € HT selon l'expérience et le périmètre." },
      { q: "En combien de temps démarre-t-il ?", a: "Kistone vous présente un premier profil sous 48 h ; le démarrage a lieu en général dans la semaine qui suit." },
    ],
    samples: [
      { name: "Paul", job: "Head of TA", xp: 14, specialties: ["Process", "Organisation"], days: 2, available: true },
      { name: "Nadia", job: "Head of TA · Scale-up", xp: 11, specialties: ["ATS", "Management"], days: 3, available: true },
      { name: "Marc", job: "Head of TA · Grand groupe", xp: 12, specialties: ["Process", "Management"], days: null, available: false },
    ],
  },
];

/** Les fiches RPO : Recruteur Tech, Recruteur GTM, Recruteur généraliste, Head of TA. */
export const RPO_ROLE_PAGES = ROLE_PAGES.filter((r) => r.vertical === "rpo");

/** Anciennes pages (fonctions C-Level, avant le pivot IA) : redirigées vers la page la plus proche. */
export const LEGACY_ROLE_SLUGS: Record<string, string | null> = {
  "fractional-rpo": "tech-recruiter",
  "fractional-cto": "ai-leader",
  "fractional-cdo": "ai-leader",
  "fractional-cpo": "ai-product-manager",
  "fractional-drh": null,
  "fractional-cfo": null,
  "fractional-coo": null,
  "fractional-cro": null,
};

export const rolePath = (r: Pick<RolePage, "slug">) => `/recruter/${r.slug}`;
export const roleBySlug = (slug: string | undefined) => ROLE_PAGES.find((r) => r.slug === slug);
