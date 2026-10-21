/**
 * Relance d'un freelance qui a commencé son inscription (étape LinkedIn) sans remplir sa fiche.
 * Deux envois au plus : le lendemain, puis trois jours plus tard (fonction remind-signup).
 */
import { brandEmail, SITE } from "./brandEmail.ts";

export const SIGNUP_REMINDER_SUBJECTS = [
  "Plus qu'une étape pour recevoir vos missions Kistone",
  "Votre fiche Kistone vous attend",
];

export function signupReminderEmail({ attempt = 1, appUrl = SITE }: { attempt?: 1 | 2; appUrl?: string }) {
  const subject = SIGNUP_REMINDER_SUBJECTS[attempt - 1];
  return {
    subject,
    html: brandEmail({
      subject,
      label: "Votre inscription",
      title: attempt === 1 ? "Plus qu'une étape pour recevoir vos missions." : "Votre fiche Kistone vous attend.",
      intro: "Vous avez commencé votre inscription sur <strong style=\"color:#141312\">Kistone</strong>, mais votre fiche n'est pas encore complète. Sans elle, nous ne pouvons pas vous proposer les missions qui vous correspondent.",
      points: [
        "Votre TJM et votre disponibilité",
        "Vos métiers ou spécialités, votre mobilité et vos secteurs",
        "Vos langues : votre CV ou votre profil LinkedIn en PDF peut pré-remplir le reste",
      ],
      cta: { label: "Compléter ma fiche", href: `${appUrl}/profile?utm_source=relance` },
      note: "Une dizaine de minutes suffit. Une question ? Répondez simplement à cet email.",
      footer: "Vous recevez cet email parce que vous avez commencé votre inscription sur Kistone. Vous ne recevrez pas plus de deux rappels.",
    }),
  };
}
