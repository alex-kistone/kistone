import { palettes, type PaletteName } from "@/lib/palettes";

// Contenus de l'accueil. Les [placeholders] restent tels quels en attendant le vrai contenu.

export const HERO = {
  title: "Plateforme Freelance RPO",
  // Mot surligné au marqueur rose, comme sur la plateforme C-Level
  titleHighlight: "Freelance",
  // Un soulignement rose passe d'un métier à l'autre sous le titre
  functions: ["Tech", "GTM", "Finance", "Ops"],
  subtitle: [
    "En 48H, nous connectons les entreprises avec les meilleurs recruteurs freelances parmi une communauté de 700+ experts qualifiés.",
  ],
  primary: "Accéder à la plateforme",
  secondary: "Découvrir le studio",
  reassurance: "Bien recruter, bien équiper",
};

export const FILTERS = ["Tous", "Tech", "GTM", "Finance", "Ops"] as const;
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
  { initials: "KB", name: "Karim B.", role: "Recruteur GTM & Revenue", domain: "GTM", dispo: "Dispo", xp: "12 ans", city: "Paris", tags: ["SaaS B2B", "Account Exec", "SDR"], palette: "apricot" },
  { initials: "AL", name: "Anne L.", role: "Recruteuse Finance", domain: "Finance", dispo: "Dispo", xp: "7 ans", city: "Lyon · hybride", tags: ["PME", "Contrôle de gestion", "Ops"], palette: "sage" },
  { initials: "TR", name: "Thomas R.", role: "Recruteur Tech", domain: "Tech", dispo: "Dispo", xp: "6 ans", city: "Rennes · remote", tags: ["Start-ups", "DevOps", "Mobile"], palette: "blue" },
  { initials: "SD", name: "Sofia D.", role: "Recruteuse GTM", domain: "GTM", dispo: "Dispo", xp: "8 ans", city: "Télétravail", tags: ["Marketplace", "Customer Success"], palette: "sand" },
  { initials: "LP", name: "Léo P.", role: "Recruteur Ops", domain: "Ops", dispo: "Dispo", xp: "10 ans", city: "Bordeaux", tags: ["Supply", "Logistique", "Opérations"], palette: "teal" },
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
  { icon: "pulse", title: "Spécialisés par métier", desc: "Tech, GTM, Finance, Ops : un recruteur qui connaît vos profils." },
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

// ── Refonte 2027 ────────────────────────────────────────────────────────────

/** Rangée de réassurance sous le hero (promesses validées uniquement). */
export const HERO_TRUST = {
  avatars: ["JM", "KB", "AL", "TR"] as const,
  lead: "700+ recruteurs vérifiés",
  points: ["Réponse sous 48 h", "Sans engagement"],
};

/**
 * Démo « brief → matching » : un besoin se tape tout seul, l'IA en extrait les critères,
 * puis les profils correspondants apparaissent. Un exemple par métier (onglets).
 * Profils fictifs en attendant les vrais : la démo illustre le produit.
 */
export type Brief = { domain: Exclude<Filter, "Tous">; text: string; criteria: string[]; matches: { name: string; score: number }[] };
export const BRIEFS: Brief[] = [
  {
    domain: "Tech",
    text: "Je cherche un recruteur pour 3 développeurs backend, à Paris en hybride, dès que possible.",
    criteria: ["RPO Tech", "Paris · hybride", "Dès que possible", "3 postes"],
    matches: [{ name: "Julie M.", score: 94 }, { name: "Thomas R.", score: 88 }, { name: "Léo P.", score: 71 }],
  },
  {
    domain: "GTM",
    text: "Besoin d'un recruteur pour monter une équipe de 4 Account Executives en SaaS B2B, à partir de janvier.",
    criteria: ["RPO GTM", "SaaS B2B", "Janvier", "4 postes"],
    matches: [{ name: "Karim B.", score: 96 }, { name: "Sofia D.", score: 89 }, { name: "Julie M.", score: 68 }],
  },
  {
    domain: "Finance",
    text: "On recrute un contrôleur de gestion et un comptable senior à Lyon, 3 jours par semaine.",
    criteria: ["RPO Finance", "Lyon", "3 j/semaine", "2 postes"],
    matches: [{ name: "Anne L.", score: 93 }, { name: "Léo P.", score: 74 }, { name: "Karim B.", score: 66 }],
  },
  {
    domain: "Ops",
    text: "Recrutement de 5 responsables logistique pour nos entrepôts, démarrage en novembre.",
    criteria: ["RPO Ops", "Multi-sites", "Novembre", "5 postes"],
    matches: [{ name: "Léo P.", score: 95 }, { name: "Anne L.", score: 77 }, { name: "Sofia D.", score: 70 }],
  },
];

/** Chiffres clés (promesses validées : 48 h, 15 min ; communauté annoncée dans le hero). */
export const PROOF = [
  { value: "48", unit: "h", label: "pour recevoir vos premiers profils" },
  { value: "700", unit: "+", label: "recruteurs freelances qualifiés" },
  { value: "15", unit: "min", label: "pour cadrer votre besoin avec nous" },
];

/** Cadre administratif : la liste se coche toute seule dans la carte sombre. */
export const ADMIN_CHECKLIST = ["Contrat de mission signé", "KYC vérifié", "CRA validé chaque mois", "Facture unique émise"];

export const FINAL_CTA = {
  title: "Votre prochain recrutement",
  titleEnd: "commence ici.",
  text: "Décrivez votre besoin en quelques lignes : vous recevez des profils sous 48 h.",
  primary: "Je recrute",
  secondary: "Je suis freelance",
};
