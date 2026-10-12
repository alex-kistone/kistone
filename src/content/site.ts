// Navigation et liens communs à toutes les pages du site vitrine.

/** Prise de rendez-vous avec Alex (bandeau du haut). */
export const CALENDLY_URL = "https://calendly.com/alexandre-kistone/30mins-meetup";

/** Liens simples de l'en-tête, après les menus déroulants. */
export const NAV_LINKS = [{ label: "Pourquoi Kistone", href: "/pourquoi-kistone" }];

export const ROUTES = {
  // « Je recrute » / « Partager un besoin » : on qualifie le besoin avant de créer le compte
  recruit: "/besoin",
  clientLogin: "/client",
  freelance: "/freelances", // « Je suis freelance » : page de découverte, l'inscription se fait depuis la page
  login: "/login",
  studio: "/studio",
};

/** Dégradé du studio, pour les fonds posés en style inline (barres, jauges). */
export const STUDIO_GRADIENT = "linear-gradient(100deg, #FF2E6E 0%, #B14DF5 55%, #4C7DFF 100%)";

import { ROLE_PAGES, rolePath } from "./roles";
import { MODEL_PAGES, modelPath } from "./models";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Les pages métier (/recruter/…), dans le menu et le pied de page. */
const ROLE_ITEMS = ROLE_PAGES.map((r) => ({
  title: r.role,
  desc: verticalOf(r.vertical).description,
  href: rolePath(r),
  dot: palettes[verticalOf(r.vertical).palette].accent,
}));

/** Les modèles d'intervention (/modeles/…). */
const MODEL_ITEMS = MODEL_PAGES.map((m) => ({ title: m.name, desc: m.short, href: modelPath(m), dot: palettes[m.palette].accent }));

export type MenuItem = { title: string; desc: string; href: string; dot: string };
export type Menu = { id: string; label: string; items: MenuItem[] };

export const MENUS: Menu[] = [
  {
    id: "mkt",
    label: "Fractional Leaders",
    items: ROLE_ITEMS,
  },
  {
    id: "modeles",
    label: "Modèles",
    items: MODEL_ITEMS,
  },
  {
    id: "res",
    label: "Ressources",
    items: [
      { title: "Blog & articles", desc: "Freelance, stratégie, structuration, leadership.", href: "/ressources", dot: "#1F8F87" },
      { title: "Podcast", desc: "[Nom du podcast]", href: "/#ressources", dot: "#FF2E6E" },
      { title: "Comparatif des acteurs", desc: "Dirigeants fractional et intérim : qui fait quoi en France.", href: "/ressources/comparatif-acteurs-fractional", dot: "#1F2A44" },
      { title: "Guides & études de cas", desc: "Méthodes et retours d’expérience.", href: "/#ressources", dot: "#E07A3A" },
      { title: "Le studio IA", desc: "Outils RH sur mesure : onboarding, assistant RH, tri de candidatures.", href: "/studio", dot: "#7357D6" },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Fractional Leaders",
    links: ROLE_ITEMS.map((r) => ({ label: r.title, href: r.href })),
  },
  {
    title: "Modèles",
    links: MODEL_ITEMS.map((m) => ({ label: m.title, href: m.href })),
  },
  {
    title: "La plateforme",
    links: [
      { label: "Trouver un expert", href: "/#marketplace" },
      { label: "Pourquoi Kistone", href: "/pourquoi-kistone" },
      { label: "Comment ça marche", href: "/#comment" },
      { label: "Partager un besoin", href: "/besoin" },
      { label: "Devenir freelance", href: "/freelances" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Blog", href: "/ressources" },
      { label: "Podcast", href: "/#ressources" },
      { label: "Guides", href: "/#ressources" },
      { label: "Le studio IA", href: "/studio" },
    ],
  },
];
