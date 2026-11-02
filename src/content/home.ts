import { palettes, type PaletteName } from "@/lib/palettes";

// Contenus de l'accueil. Les [placeholders] restent tels quels en attendant le vrai contenu.

/** Métiers sur lesquels les recruteurs sont spécialisés, tels que présentés sur l'accueil. */
export const METIERS_RPO = ["Tech", "Data", "Product", "Sales & Marketing", "Finance", "Industrie"] as const;
export type MetierRpo = (typeof METIERS_RPO)[number];

export const HERO = {
  // Réseau de recruteurs freelance (jamais « management de transition »)
  titleLead: "Renforcez votre équipe",
  titleBefore: "avec un ",
  titleHighlight: "RPO Freelance",
  // Un soulignement rose passe d'un métier à l'autre sous le titre
  functions: ["Tech", "Sales", "Corporate", "Finance", "Industrie"],
  subtitle: "Pas un cabinet, pas un collectif : une communauté de 700+ recruteurs indépendants, spécialisés, qualifiés.",
  primary: "Déposer un besoin",
  secondary: "Je suis freelance",
  note: "Recruteurs qualifiés · Premier profil sous 48 h · Contrat, KYC et facturation inclus",
};

export type Recruiter = {
  initials: string;
  name: string;
  role: string;
  /** Métier de spécialité. */
  domain: MetierRpo;
  rhythm: string;
  xp: string;
  palette: PaletteName;
  /** Portrait d'illustration (public/people/) ; sans fichier, la carte affiche les initiales. */
  photo?: string;
};

// Profils fictifs, pour illustrer le réseau en attendant les vrais.
export const RECRUITERS: Recruiter[] = [
  { initials: "JM", name: "Julie", role: "Recruteuse Tech", domain: "Tech", rhythm: "Temps plein", xp: "9 ans", palette: "blue", photo: "/people/sarah.jpg" },
  { initials: "HP", name: "Hugo", role: "Recruteur Data", domain: "Data", rhythm: "3 j / sem", xp: "6 ans", palette: "lilac", photo: "/people/hugo.jpg" },
  { initials: "CD", name: "Claire", role: "Recruteuse Product", domain: "Product", rhythm: "Temps plein", xp: "8 ans", palette: "teal", photo: "/people/camille.jpg" },
  { initials: "MG", name: "Marc", role: "Recruteur Sales · SaaS B2B", domain: "Sales & Marketing", rhythm: "3 j / sem", xp: "12 ans", palette: "apricot", photo: "/people/marc.jpg" },
  { initials: "SK", name: "Sami", role: "Recruteur Tech · DevOps", domain: "Tech", rhythm: "4 j / sem", xp: "9 ans", palette: "blue", photo: "/people/sami.jpg" },
  { initials: "LN", name: "Lina", role: "Recruteuse Data", domain: "Data", rhythm: "Temps plein", xp: "7 ans", palette: "lilac", photo: "/people/lina.jpg" },
  { initials: "YB", name: "Yanis", role: "Recruteur Marketing", domain: "Sales & Marketing", rhythm: "4 j / sem", xp: "7 ans", palette: "apricot", photo: "/people/yanis.jpg" },
  { initials: "NR", name: "Nadia", role: "Recruteuse Finance", domain: "Finance", rhythm: "3 j / sem", xp: "11 ans", palette: "sage", photo: "/people/nadia.jpg" },
  { initials: "EL", name: "Emma", role: "Recruteuse Sales", domain: "Sales & Marketing", rhythm: "Temps plein", xp: "8 ans", palette: "apricot", photo: "/people/emma.jpg" },
  { initials: "AT", name: "Adam", role: "Recruteur Industrie", domain: "Industrie", rhythm: "Temps plein", xp: "10 ans", palette: "sand", photo: "/people/adam.jpg" },
  { initials: "PV", name: "Paul", role: "Recruteur Finance", domain: "Finance", rhythm: "2 j / sem", xp: "14 ans", palette: "sage", photo: "/people/thomas.jpg" },
  { initials: "TR", name: "Thomas", role: "Recruteur Tech", domain: "Tech", rhythm: "3 j / sem", xp: "6 ans", palette: "blue", photo: "/people/thomas-r.jpg" },
];

export const LOGOS = ["Maison Vérane", "Groupe Altor", "Solvée", "[Logo client]", "[Logo client]", "[Logo client]", "[Logo client]"];

export const STEPS: { num: string; title: string; desc: string; link?: { label: string; href: string } }[] = [
  { num: "Étape 01", title: "Partagez votre besoin", desc: "Quelques lignes suffisent : l'IA en extrait les critères (métiers, nombre de postes, rythme, budget)." },
  {
    num: "Étape 02",
    title: "On le cadre avec vous",
    desc: "30 minutes au téléphone pour préciser les postes, le rythme et le budget. Puis un recruteur qualifié sous 48 h.",
    link: { label: "Réserver 30 minutes", href: "https://calendly.com/alexandre-kistone/30mins-meetup" },
  },
  { num: "Étape 03", title: "Démarrage en 1 semaine", desc: "Contrat, KYC et onboarding gérés : le recruteur rejoint vos équipes, on suit la mission avec vous." },
];

/** Les situations qui amènent un client vers le RPO. Chaque carte mène au dépôt de besoin. */
export type PainCard = { tag: string; title: string; desc: string; palette: PaletteName };

export const PAIN: { titleA: string; titleB: string; subtitle: string; cta: string; cards: PainCard[] } = {
  titleA: "Dans quelles situations",
  titleB: "faire appel à un RPO ?",
  subtitle: "Les bons profils sont rares, et vos postes n'attendent pas.",
  cta: "Trouver un recruteur",
  cards: [
    { tag: "Urgence", title: "Un poste clé qui ne peut pas attendre", desc: "Un premier profil qualifié sous 48 h, un démarrage en une semaine, le contrat et l'administratif gérés.", palette: "sage" },
    { tag: "Pic d'embauches", title: "Un plan de recrutement à tenir", desc: "Une levée de fonds ou un nouveau produit : vous devez recruter 5, 10 ou 20 personnes en quelques mois.", palette: "teal" },
    { tag: "Profils pénuriques", title: "Vos annonces ne suffisent plus", desc: "Sur les profils rares, il faut chasser : un recruteur spécialisé de votre métier connaît le marché et va chercher les candidats.", palette: "blue" },
    { tag: "Équipe Talent débordée", title: "Vos recruteurs sont à saturation", desc: "Un renfort rejoint votre équipe le temps qu'il faut, pour tenir vos délais sans perdre en qualité.", palette: "lilac" },
    { tag: "Remplacement", title: "Un recruteur absent ou sur le départ", desc: "Congé, départ ou poste en cours d'embauche : vos recrutements continuent sans interruption.", palette: "sand" },
    { tag: "Nouvelle activité", title: "Un site, une équipe, un marché à lancer", desc: "Un recruteur dédié construit l'équipe de départ, sans vous obliger à créer un poste en interne.", palette: "apricot" },
  ],
};

/** Ce que fait le recruteur, du brief à la signature. */
export const RPO_SCOPE = {
  titleA: "Du brief à la signature.",
  titleB: "Tout le recrutement, ou une partie.",
  subtitle: "Vous lui confiez l'ensemble du processus ou seulement les étapes qui vous manquent.",
  steps: [
    { title: "Cadrage du poste", desc: "Avec le manager : missions, compétences clés, fourchette de salaire." },
    { title: "Annonces et candidatures", desc: "Diffusion des offres, tri des candidatures entrantes, réponse aux candidats." },
    { title: "Chasse", desc: "Approche directe sur LinkedIn et les communautés de votre métier, pour atteindre ceux qui ne postulent pas." },
    { title: "Qualification", desc: "Entretiens de présélection, évaluation avec vos équipes et shortlist argumentée." },
    { title: "Pilotage du process", desc: "Coordination des entretiens et suivi des indicateurs : délais, taux de conversion, sources." },
    { title: "Offre et prise de poste", desc: "Négociation, closing et suivi du candidat jusqu'à son arrivée." },
  ],
};

/** RPO freelance ou cabinet : ce qui change au quotidien. */
export const RPO_VS_CABINET = {
  titleA: "RPO freelance ou cabinet ?",
  titleB: "Deux façons de recruter.",
  subtitle: "Le cabinet vend un recrutement. Le RPO vous apporte du temps de recruteur, dans votre équipe.",
  rows: [
    { label: "Où il travaille", cabinet: "À l'extérieur de votre entreprise", rpo: "Dans votre équipe, avec vos outils et vos managers" },
    { label: "Facturation", cabinet: "Des honoraires à chaque embauche, souvent 20 à 25 % du salaire annuel", rpo: "Au jour, sur les jours réalisés validés chaque mois, sans honoraires au placement" },
    { label: "Périmètre", cabinet: "Un mandat, poste par poste", rpo: "L'ensemble de vos postes, ou seulement une partie" },
    { label: "Rythme", cabinet: "Fixé par le mandat", rpo: "Temps plein ou quelques jours par semaine" },
    { label: "Votre marque", cabinet: "Il approche les candidats pour le compte d'un client", rpo: "Il recrute en votre nom" },
    { label: "Ce qui vous reste", cabinet: "Les recrues embauchées", rpo: "Les recrues, le vivier et le process construits" },
  ],
};

/**
 * Les besoins les plus fréquents : un recruteur par métier, qui pré-remplit le dépôt de besoin.
 * Le budget affiché et repris est celui du RPO (src/lib/indicativeBudget.ts).
 */
export const ROLE_CATALOG: string[] = [
  "Recruteur Tech",
  "Recruteur Data",
  "Recruteur Product",
  "Recruteur Sales & Marketing",
  "Recruteur Finance",
  "Recruteur Industrie",
];

export const ASSETS = [
  { icon: "shield", title: "Recruteurs sélectionnés et qualifiés", desc: "Parcours, recrutements réalisés et références évalués en entretien avant la première mission.", featured: true },
  { icon: "pulse", title: "Spécialisés par métier", desc: "Tech, Data, Product, Sales & Marketing, Finance, Industrie : un recruteur qui connaît vos profils." },
  { icon: "clock", title: "Réactivité", desc: "Un premier profil en 48 h et un démarrage en une semaine, pas en trois mois." },
  { icon: "team", title: "Intégré à votre équipe", desc: "Votre ATS, votre Slack, vos rituels. Il recrute en votre nom, à temps plein ou quelques jours par semaine." },
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
  { label: "Mission RPO · Scale-up SaaS · 3 j/sem.", status: "En cours", bg: "#E8F5EE", fg: "#17663F" },
  { label: "CRA d'octobre · 12 jours", status: "Validé par le client", bg: palettes.sand.soft, fg: palettes.sand.ink },
  { label: "Facture d'octobre", status: "Envoyée", bg: palettes.blue.soft, fg: palettes.blue.ink },
  { label: "Nouvelle mission RPO · 4 recrutements Sales", status: "À consulter", bg: "#FFE3EC", fg: "#8F1747" },
];

/**
 * Démo « brief → matching » : un besoin se tape tout seul, l'IA en extrait les critères,
 * puis les profils correspondants apparaissent. Un exemple par métier (onglets).
 * Exemples fictifs en attendant les vrais : la démo illustre le produit.
 */
export type Brief = { domain: MetierRpo; text: string; criteria: string[] };
export const BRIEFS: Brief[] = [
  { domain: "Tech", text: "Je cherche un recruteur pour 3 développeurs backend, à Paris en hybride, dès que possible.", criteria: ["RPO Tech", "Paris · hybride", "Dès que possible", "3 postes"] },
  { domain: "Sales & Marketing", text: "Besoin d'un recruteur pour monter une équipe de 4 Account Executives en SaaS B2B, à partir de janvier.", criteria: ["RPO Sales", "SaaS B2B", "Janvier", "4 postes"] },
  { domain: "Finance", text: "Un contrôleur de gestion et un comptable à recruter en PME, 2 jours par semaine nous suffiraient.", criteria: ["RPO Finance", "PME", "2 j / sem", "2 postes"] },
  { domain: "Industrie", text: "Trois responsables de production à recruter sur nos sites de l'Ouest, avec un démarrage sous un mois.", criteria: ["RPO Industrie", "Grand Ouest", "Sous un mois", "3 postes"] },
];

/** Cadre administratif : la liste se coche toute seule dans la carte sombre. */
export const ADMIN_CHECKLIST = ["Contrat de mission signé", "KYC vérifié", "CRA validé chaque mois", "Facture unique émise"];

export const FINAL_CTA = {
  title: "Votre prochain",
  titleHighlight: "recruteur RPO",
  titleEnd: "est déjà disponible.",
  text: "Décrivez votre besoin en quelques lignes : vous recevez un premier profil qualifié sous 48 h.",
  primary: "Déposer un besoin",
  secondary: "Je suis freelance",
};

/**
 * Questions fréquentes de l'accueil : réponses courtes et factuelles (reprises par les moteurs
 * IA), uniquement des engagements déjà validés. Budgets : src/lib/indicativeBudget.ts.
 */
export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: "Qu'est-ce que Kistone ?",
    a: "Kistone est un réseau de freelances RPO. Il met en relation les entreprises avec une communauté de 700+ recruteurs freelance sélectionnés et qualifiés, spécialisés par métier, et intégrés à leurs équipes pour recruter en CDI.",
  },
  {
    q: "Qu'est-ce que le RPO freelance ?",
    a: "Le RPO (Recruitment Process Outsourcing) consiste à confier tout ou partie de vos recrutements à un recruteur externe qui travaille comme un membre de votre équipe : il utilise vos outils, parle au nom de votre entreprise et rend compte à vos managers.",
  },
  {
    q: "Sur quels métiers vos recruteurs sont-ils spécialisés ?",
    a: "Tech, Data, Product, Sales & Marketing, Finance, Industrie… Chaque recruteur est choisi pour sa connaissance de vos profils et de votre marché.",
  },
  {
    q: "En combien de temps recevez-vous un premier profil ?",
    a: "Un premier profil qualifié vous est présenté sous 48 h après le partage de votre besoin ; le démarrage a lieu en général dans la semaine qui suit.",
  },
  {
    q: "Combien coûte un recruteur freelance ?",
    a: "Il est facturé au jour, sans honoraires au placement : en général entre 500 et 600 € HT par jour, selon la spécialité et l'expérience. Vous ne payez que les jours réalisés, déclarés dans un CRA que vous validez chaque mois.",
  },
  {
    q: "Peut-on confier seulement une partie de nos recrutements ?",
    a: "Oui. Vous choisissez le périmètre (un métier, une équipe, certains postes ou certaines étapes du processus) et le rythme : à temps plein ou quelques jours par semaine.",
  },
  {
    q: "Le recruteur utilise-t-il nos outils ?",
    a: "Oui. Il travaille avec votre ATS, votre messagerie et vos rituels, et recrute au nom de votre entreprise. Le vivier construit pendant la mission reste chez vous.",
  },
  {
    q: "Quelle différence avec un cabinet de recrutement ?",
    a: "Le cabinet est payé au succès, poste par poste. Le recruteur freelance travaille au sein de votre équipe, sur l'ensemble de vos postes, et vous gardez le vivier et le process construits.",
  },
  {
    q: "Comment les recruteurs sont-ils sélectionnés ?",
    a: "Chaque freelance est qualifié en entretien par l'équipe Kistone (parcours, recrutements réalisés, références) puis noté. Seuls les profils qui correspondent à votre besoin vous sont présentés.",
  },
  {
    q: "Qui gère le contrat et la facturation ?",
    a: "Kistone gère le contrat, la conformité, le suivi des jours (CRA) et la facturation. Le freelance est payé chaque fin de mois.",
  },
];
