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

import { RPO_ROLE_PAGES, rolePath } from "./roles";

/** Les fiches de poste (/recruter/…), dans le menu et le pied de page. */
const ROLE_ITEMS = RPO_ROLE_PAGES.map((r, i) => ({
  title: r.role,
  desc: r.eyebrow ?? "",
  href: rolePath(r),
  dot: ["#3D7BD0", "#E07A3A", "#2F9A63", "#7357D6"][i],
}));

export type MenuItem = { title: string; desc: string; href: string; dot: string };
export type Menu = { id: string; label: string; items: MenuItem[] };

export const MENUS: Menu[] = [
  {
    id: "mkt",
    label: "Recruteurs",
    items: ROLE_ITEMS,
  },
  {
    id: "res",
    label: "Ressources",
    items: [
      { title: "Blog & articles", desc: "RPO freelance, recrutement, marché des talents.", href: "/ressources", dot: "#1F8F87" },
      { title: "Comparatif du RPO", desc: "Recruteurs freelance ou cabinet : qui fait quoi en France.", href: "/ressources/comparatif-rpo-freelance", dot: "#1F2A44" },
      { title: "Guides", desc: "Méthodes pour structurer et piloter vos recrutements.", href: "/#ressources", dot: "#E07A3A" },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Recruteurs",
    links: ROLE_ITEMS.map((r) => ({ label: r.title, href: r.href })),
  },
  {
    title: "Le réseau",
    links: [
      { label: "Trouver un recruteur", href: "/#trouver-un-recruteur" },
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
