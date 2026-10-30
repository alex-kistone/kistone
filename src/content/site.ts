// Navigation et liens communs à toutes les pages du site vitrine.

/** Prise de rendez-vous avec Alex (bandeau du haut). */
export const BOOKING_URL = "https://calendar.app.google/BnK5vVcAjum7r3VW9";
/** La même page de réservation Google, dans sa version intégrable en iframe (le lien court refuse l'intégration). */
export const BOOKING_EMBED_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ22qIL0gXou0jQYDLUFduApFY1VcDrbE-8pT1pn6Ctn-VW8dg1PNrL9qkICvWRJel6fpc5IS1lZ?gv=true";

/** Liens simples de l'en-tête, après les menus déroulants. */
export const NAV_LINKS = [{ label: "Pourquoi Kistone", href: "/pourquoi-kistone" }];

export const ROUTES = {
  // « Je recrute » / « Partager un besoin » : on qualifie le besoin avant de créer le compte
  recruit: "/besoin",
  clientLogin: "/client",
  freelance: "/freelances", // « Je suis freelance » : page de découverte, l'inscription se fait depuis la page
  login: "/login",
};

import { ROLE_PAGES, rolePath } from "./roles";
import { MODEL_PAGES, modelPath } from "./models";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Les fiches de poste (/recruter/…), dans le menu et le pied de page. */
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
    label: "Experts IA",
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
      { title: "Blog & articles", desc: "Projets IA, formats d’intervention, recrutement des talents IA.", href: "/ressources", dot: "#1F8F87" },
      { title: "Comparatif des plateformes", desc: "Trouver un expert IA freelance : qui fait quoi en France.", href: "/ressources/comparatif-plateformes-freelance-ia", dot: "#1F2A44" },
      { title: "Guides", desc: "Méthodes pour lancer, piloter et staffer vos projets IA.", href: "/#ressources", dot: "#E07A3A" },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Experts IA",
    links: ROLE_ITEMS.map((r) => ({ label: r.title, href: r.href })),
  },
  {
    title: "Modèles",
    links: MODEL_ITEMS.map((m) => ({ label: m.title, href: m.href })),
  },
  {
    title: "Le réseau",
    links: [
      { label: "Trouver un expert", href: "/#trouver-un-expert" },
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
      { label: "Guides", href: "/#ressources" },
    ],
  },
];
