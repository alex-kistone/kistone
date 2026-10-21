import { brandEmail, SITE } from "./brandEmail.ts";

/**
 * Emails d'invitation à rejoindre Kistone (gabarit à la charte : brandEmail.ts). Partagé avec
 * l'admin pour l'aperçu.
 */

/**
 * Modèles : freelances experts IA (AI Engineer, AI Product, AI Leader), freelances Tech
 * recruiters (RPO), et entreprises clientes intéressées par des experts IA ou par du RPO.
 */
export type InvitationAudience = "ai" | "rpo" | "client_ai" | "client_rpo";

type Template = {
  subject: string; label: string; title: string; intro: string; benefits: string[]; cta: string; signup: string;
  /** Ligne sous le bouton : précision et lien secondaire. */
  note: string; secondary: { label: string; href: string };
};

const FREELANCE_NOTE = "Inscription gratuite, une dizaine de minutes.";
const FREELANCE_SECONDARY = { label: "Découvrir l'espace freelance", href: "/freelances?utm_source=invitation" };
const CALENDLY = "https://calendly.com/alexandre-kistone/30mins-meetup";

export const INVITATION_TEMPLATES: Record<InvitationAudience, Template> = {
  ai: {
    subject: "Invitation à rejoindre Kistone, la plateforme des freelances IA",
    label: "Invitation · Experts IA",
    title: "Rejoignez la plateforme des freelances IA.",
    intro: "Je vous invite à rejoindre <strong style=\"color:#141312\">Kistone</strong>, la plateforme freelance des experts IA. Les entreprises nous confient leurs projets IA, du prototype à la production : nous leur présentons des AI Engineers, AI Product et AI Leaders qualifiés, comme vous.",
    benefits: [
      "Des missions IA qualifiées : LLM, RAG, agents, MLOps, produit IA ou stratégie IA",
      "Le rythme que vous choisissez : temps plein, fractional ou contract-to-hire",
      "Payé chaque fin de mois, contrat, CRA et facturation gérés pour vous",
    ],
    cta: "Rejoindre Kistone",
    signup: "/register?mode=signup&utm_source=invitation",
    note: FREELANCE_NOTE,
    secondary: FREELANCE_SECONDARY,
  },
  rpo: {
    subject: "Invitation à rejoindre Kistone, la plateforme des freelances RPO",
    label: "Invitation · Tech recruiters",
    title: "Rejoignez la plateforme des freelances RPO.",
    intro: "Je vous invite à rejoindre <strong style=\"color:#141312\">Kistone</strong> en tant que Tech recruiter freelance. Les entreprises nous confient le recrutement de leurs talents tech et IA en CDI : nous leur présentons des recruteurs qualifiés, intégrés à leurs équipes, comme vous.",
    benefits: [
      "Des missions RPO Freelance Tech, Data/AI, Product, GTM et Sales au sein de startups/scaleups, ETI et grands groupes",
      "Payé chaque fin de mois : espace admin automatisé (contrat, CRA, facturation)",
      "Le rythme que vous choisissez, le budget que vous fixez",
    ],
    cta: "Rejoindre Kistone",
    signup: "/register?mode=signup&fonction=rpo&utm_source=invitation",
    note: FREELANCE_NOTE,
    secondary: FREELANCE_SECONDARY,
  },
  client_ai: {
    subject: "Invitation à découvrir Kistone, la plateforme des experts IA freelance",
    label: "Invitation · Experts IA",
    title: "Votre prochain expert IA est déjà disponible.",
    intro: "Je vous invite à découvrir <strong style=\"color:#141312\">Kistone</strong>, la plateforme freelance des experts IA. Vous décrivez votre besoin en quelques lignes : nous vous présentons un premier profil qualifié sous 48 h.",
    benefits: [
      "Des AI Engineers, AI Product et AI Leaders qualifiés, pour passer vos projets IA du prototype à la production",
      "En mission, en fractional ou en contract-to-hire : le format qui correspond à votre besoin",
      "Facturé au jour, sans frais de recrutement : contrat, CRA et facturation gérés pour vous",
    ],
    cta: "Décrire mon besoin",
    signup: "/besoin?utm_source=invitation",
    note: "Gratuit et sans engagement : vous ne payez que les jours réalisés.",
    secondary: { label: "Échanger 30 minutes avec moi", href: CALENDLY },
  },
  client_rpo: {
    subject: "Invitation à découvrir Kistone, la plateforme des freelances RPO",
    label: "Invitation · RPO",
    title: "Recrutez les talents que tout le monde cherche.",
    intro: "Je vous invite à découvrir <strong style=\"color:#141312\">Kistone</strong>, la plateforme des freelances RPO. Un Tech recruiter freelance rejoint vos équipes pour recruter vos talents en CDI : nous vous présentons un premier profil qualifié sous 48 h.",
    benefits: [
      "Des Tech recruiters freelance spécialisés Tech, Data/AI, Product, GTM et Sales",
      "Intégrés à vos équipes, avec vos outils et votre marque employeur",
      "Facturé au jour, sans honoraires au placement : contrat, CRA et facturation gérés pour vous",
    ],
    cta: "Décrire mon besoin",
    signup: "/besoin?fonction=rpo&utm_source=invitation",
    note: "Gratuit et sans engagement : vous ne payez que les jours réalisés.",
    secondary: { label: "Échanger 30 minutes avec moi", href: CALENDLY },
  },
};

/** Objet par défaut du modèle experts IA (rétrocompatibilité). */
export const INVITATION_SUBJECT = INVITATION_TEMPLATES.ai.subject;

export function invitationEmail({ audience = "ai", message, appUrl = SITE }: {
  audience?: InvitationAudience; message?: string | null; appUrl?: string;
}) {
  const tpl = INVITATION_TEMPLATES[audience];
  return brandEmail({
    subject: tpl.subject,
    label: tpl.label,
    title: tpl.title,
    intro: tpl.intro,
    message,
    points: tpl.benefits,
    cta: { label: tpl.cta, href: `${appUrl}${tpl.signup}` },
    note: tpl.note,
    secondary: { label: tpl.secondary.label, href: tpl.secondary.href.startsWith("http") ? tpl.secondary.href : `${appUrl}${tpl.secondary.href}` },
    footer: "Vous recevez cet email parce qu'Alexandre a souhaité vous inviter sur Kistone. Pas intéressé ? Répondez simplement « stop » : nous ne vous recontacterons pas.",
  });
}
