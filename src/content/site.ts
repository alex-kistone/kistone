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

import { ROLE_PAGES, rolePath } from "./roles";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Les pages métier (/recruter/…), dans le menu et le pied de page. */
const ROLE_ITEMS = ROLE_PAGES.map((r) => ({
  title: r.role,
  desc: verticalOf(r.vertical).description,
  href: rolePath(r),
  dot: palettes[verticalOf(r.vertical).palette].accent,
}));

export type MenuItem = { title: string; desc: string; href: string; dot: string };
export type Menu = { id: string; label: string; items: MenuItem[] };

export const MENUS: Menu[] = [
  {
    id: "mkt",
    label: "Fractional Leaders",
    items: ROLE_ITEMS,
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
    links: ROLE_ITEMS.map((r) => ({ label: r.title, href: r.href })),
  },
  {
    title: "La plateforme",
    links: [
      { label: "Trouver un expert", href: "/#marketplace" },
      { label: "Comment ça marche", href: "/#comment" },
      { label: "Partager un besoin", href: "/besoin" },
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
