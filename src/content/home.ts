import { palettes, type PaletteName } from "@/lib/palettes";

// Contenus de l'accueil. Les [placeholders] restent tels quels en attendant le vrai contenu.

export const HERO = {
  badge: "Partenaire RH augmenté",
  badgeText: "All-in-one hiring solution",
  titleLine1: "Recrutez vite.",
  titleLine2: "Équipez bien.",
  subtitle:
    "Des recruteurs RPO freelance vérifiés pour recruter vite, et un studio IA qui construit vos outils RH sur mesure.",
  primary: "Partner with a Freelance RPO",
  secondary: "Get a bespoke HR product",
  reassurance: "Sans engagement · Sans CDI · Réponse sous 48 h",
};

export const FILTERS = ["Tous", "Tech", "Sales", "Finance & Ops"] as const;
export type Filter = (typeof FILTERS)[number];

export type Recruiter = {
  initials: string;
  name: string;
  role: string;
  domain: Exclude<Filter, "Tous">;
  dispo: string;
  xp: string;
  city: string;
  tags: string[];
  palette: PaletteName;
};

// Fiches fictives en attendant les vrais profils de la marketplace.
export const RECRUITERS: Recruiter[] = [
  { initials: "JM", name: "Julie M.", role: "Recruteuse Tech & Produit", domain: "Tech", dispo: "Dispo", xp: "9 ans", city: "Nantes · remote", tags: ["Scale-ups", "Dev & Data", "Produit"], palette: "lilac" },
  { initials: "KB", name: "Karim B.", role: "Recruteur Sales & Revenue", domain: "Sales", dispo: "Dispo", xp: "12 ans", city: "Paris", tags: ["SaaS B2B", "Account Exec", "SDR"], palette: "apricot" },
  { initials: "AL", name: "Anne L.", role: "Recruteuse Finance & Ops", domain: "Finance & Ops", dispo: "Dispo", xp: "7 ans", city: "Lyon · hybride", tags: ["PME", "Contrôle de gestion", "Ops"], palette: "sage" },
  { initials: "TR", name: "Thomas R.", role: "Recruteur Tech", domain: "Tech", dispo: "Dispo", xp: "6 ans", city: "Rennes · remote", tags: ["Start-ups", "DevOps", "Mobile"], palette: "blue" },
  { initials: "SD", name: "Sofia D.", role: "Recruteuse Sales", domain: "Sales", dispo: "Dispo", xp: "8 ans", city: "Télétravail", tags: ["Marketplace", "Customer Success"], palette: "sand" },
  { initials: "LP", name: "Léo P.", role: "Recruteur Finance & Ops", domain: "Finance & Ops", dispo: "Dispo", xp: "10 ans", city: "Bordeaux", tags: ["Fintech", "RAF", "Supply"], palette: "teal" },
];

export const LOGOS = ["Maison Vérane", "Groupe Altor", "Solvée", "[Logo client]", "[Logo client]", "[Logo client]", "[Logo client]"];

export const STEPS = [
  { num: "Étape 01", title: "Décrivez votre besoin", desc: "15 minutes pour cadrer les postes, le rythme et le budget." },
  { num: "Étape 02", title: "Choisissez votre recruteur", desc: "Des profils RPO sélectionnés selon votre secteur et vos métiers." },
  { num: "Étape 03", title: "Il recrute avec vous", desc: "Intégré à vos outils et à vos rituels, avec un suivi clair chaque mois." },
];

export const ADMIN_PILLS = ["Contrat de mission", "KYC", "CRA mensuel", "Facture unique"];

export const ASSETS = [
  { icon: "shield", title: "Recruteurs vérifiés", desc: "Identité, statut et références contrôlés avant la première mission.", featured: true },
  { icon: "clock", title: "Flexible", desc: "Quelques jours par semaine ou à plein temps. Vous ajustez selon vos besoins." },
  { icon: "team", title: "Intégré à votre équipe", desc: "Votre ATS, votre Slack, vos rituels. Il recrute en votre nom." },
  { icon: "pulse", title: "Spécialisés par métier", desc: "Tech, Sales, Finance & Ops : un recruteur qui connaît vos profils." },
] as const;

export const FREELANCE_SPACE = [
  { label: "Mission · Scale-up SaaS · 3 j/sem.", status: "En cours", bg: "#E8F5EE", fg: "#17663F" },
  { label: "CRA de septembre", status: "Validé par le client", bg: palettes.sand.soft, fg: palettes.sand.ink },
  { label: "Facture de septembre", status: "Envoyée", bg: palettes.blue.soft, fg: palettes.blue.ink },
  { label: "Nouvelle mission proposée", status: "À consulter", bg: "#FFE3EC", fg: "#8F1747" },
];

export const STUDIO_TILES: { title: string; desc: string; palette: PaletteName; pct: string }[] = [
  { title: "Onboarding", desc: "Parcours des recrues", palette: "apricot", pct: "80%" },
  { title: "Assistant RH", desc: "Questions salariés", palette: "blue", pct: "64%" },
  { title: "Budget RH", desc: "Budget vs réel", palette: "lilac", pct: "68%" },
  { title: "Engagement", desc: "Pulses et plans d’action", palette: "teal", pct: "72%" },
];

export const RESOURCES: { kind: string; title: string; meta: string; palette: PaletteName }[] = [
  { kind: "Article", title: "[Titre d’article : RPO freelance vs cabinet]", meta: "Blog · [x] min de lecture", palette: "apricot" },
  { kind: "Podcast", title: "[Titre d’épisode]", meta: "Podcast · [durée]", palette: "lilac" },
  { kind: "Guide", title: "[Titre de guide : outiller ses RH avec l’IA]", meta: "Guide · PDF", palette: "teal" },
];
