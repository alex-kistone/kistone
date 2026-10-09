// Navigation et liens communs à toutes les pages du site vitrine.

export const ROUTES = {
  // « Je recrute » / « Partager un besoin » : on qualifie le besoin avant de créer le compte
  recruit: "/besoin",
  clientLogin: "/client",
  freelance: "/register", // parcours « Je suis freelance » de la plateforme
  login: "/login",
  studio: "/studio",
};

/** Dégradé du studio, pour les fonds posés en style inline (barres, jauges). */
export const STUDIO_GRADIENT = "linear-gradient(100deg, #FF2E6E 0%, #B14DF5 55%, #4C7DFF 100%)";

export type MenuItem = { title: string; desc: string; href: string; dot: string };
export type Menu = { id: string; label: string; items: MenuItem[] };

export const MENUS: Menu[] = [
  {
    id: "mkt",
    label: "Fractional Leaders",
    items: [
      { title: "Trouver un expert", desc: "RPO, DRH, CFO, COO, CRO, CTO : freelances vérifiés.", href: "/#marketplace", dot: "#FF2E6E" },
      { title: "Les six fonctions", desc: "À temps plein ou quelques jours par semaine.", href: "/#fonctions", dot: "#7357D6" },
      { title: "Comment ça marche", desc: "Un profil en 48 h, un démarrage en une semaine.", href: "/#comment", dot: "#E07A3A" },
      { title: "Devenir freelance", desc: "Missions qualifiées, administratif géré.", href: "/#freelances", dot: "#C99A12" },
    ],
  },
  {
    id: "studio",
    label: "Le studio",
    items: [
      { title: "Outils RH sur mesure", desc: "Onboarding, assistant RH, tri de candidatures.", href: "/studio", dot: "#7357D6" },
      { title: "Réalisations", desc: "Des produits utilisés, pas des démos.", href: "/studio#realisations", dot: "#3D7BD0" },
      { title: "Tarifs", desc: "Sprint ou Partenaire, sans engagement.", href: "/studio#tarifs", dot: "#2F9A63" },
    ],
  },
  {
    id: "res",
    label: "Ressources",
    items: [
      { title: "Blog & articles", desc: "Recrutement, RPO, outils RH.", href: "/#ressources", dot: "#1F8F87" },
      { title: "Podcast", desc: "[Nom du podcast]", href: "/#ressources", dot: "#FF2E6E" },
      { title: "Guides & études de cas", desc: "Méthodes et retours d’expérience.", href: "/#ressources", dot: "#E07A3A" },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Fractional Leaders",
    links: [
      { label: "Trouver un expert", href: "/#marketplace" },
      { label: "Les six fonctions", href: "/#fonctions" },
      { label: "Comment ça marche", href: "/#comment" },
      { label: "Devenir freelance", href: "/#freelances" },
    ],
  },
  {
    title: "Le studio",
    links: [
      { label: "Méthode", href: "/studio#methode" },
      { label: "Réalisations", href: "/studio#realisations" },
      { label: "Tarifs", href: "/studio#tarifs" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Blog", href: "/#ressources" },
      { label: "Podcast", href: "/#ressources" },
      { label: "Guides", href: "/#ressources" },
    ],
  },
];
