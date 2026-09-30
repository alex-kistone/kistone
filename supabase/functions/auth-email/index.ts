/**
 * auth-email — hook « Send Email » de Supabase Auth : remplace les emails anglais de Supabase
 * (confirmation d'inscription, mot de passe oublié, invitation, lien magique, changement
 * d'email, code de réauthentification) par des emails Kistone en français, envoyés par Resend
 * depuis le domaine kistone.fr.
 *
 * Activation : Dashboard > Authentication > Hooks > Send Email > HTTPS, URL de cette fonction.
 * Le secret généré par Supabase (v1,whsec_…) est posé en secret SEND_EMAIL_HOOK_SECRET.
 * Tant que le hook n'est pas activé, Supabase continue d'envoyer ses propres emails.
 */
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { esc, layout, sendEmail } from "../_shared/email.ts";

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new?: string;
  token_hash_new?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const verifyUrl = (tokenHash: string, type: string, redirectTo: string) =>
  `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?${new URLSearchParams({ token: tokenHash, type, redirect_to: redirectTo })}`;

/** Espace concerné, déduit de l'adresse de retour (/client = espace client). */
const space = (redirectTo: string) => (/\/client(\b|\/|$)/.test(redirectTo) ? "client" : "freelance");

function render(type: string, d: EmailData, link: string, code: string) {
  const codeLine = `Vous pouvez aussi saisir ce code : <strong>${esc(code)}</strong>`;
  switch (type) {
    case "signup":
      return {
        subject: "Confirmez votre adresse email",
        html: layout({
          title: "Bienvenue chez Kistone",
          paragraphs: [
            space(d.redirect_to) === "client"
              ? "Merci pour votre inscription. Confirmez votre adresse pour accéder à votre espace client et déposer votre premier besoin."
              : "Merci pour votre inscription. Confirmez votre adresse pour accéder à votre espace freelance et compléter votre profil.",
            "Ce lien est valable 24 heures.",
          ],
          cta: { label: "Confirmer mon adresse", href: link },
        }) + footer(),
      };
    case "recovery":
      return {
        subject: "Réinitialisez votre mot de passe",
        html: layout({
          title: "Mot de passe oublié",
          paragraphs: ["Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau."],
          cta: { label: "Choisir un nouveau mot de passe", href: link },
        }) + footer(),
      };
    case "invite":
      return {
        subject: "Vous êtes invité sur Kistone",
        html: layout({
          title: "Votre accès Kistone",
          paragraphs: ["Un compte a été créé pour vous sur la plateforme Kistone. Acceptez l'invitation pour choisir votre mot de passe."],
          cta: { label: "Accepter l'invitation", href: link },
        }) + footer(),
      };
    case "magiclink":
      return {
        subject: "Votre lien de connexion",
        html: layout({
          title: "Connexion à Kistone",
          paragraphs: ["Cliquez sur le bouton ci-dessous pour vous connecter.", codeLine],
          cta: { label: "Me connecter", href: link },
        }) + footer(),
      };
    case "email_change":
      return {
        subject: "Confirmez votre nouvelle adresse email",
        html: layout({
          title: "Changement d'adresse email",
          paragraphs: ["Confirmez ce changement d'adresse pour votre compte Kistone."],
          cta: { label: "Confirmer le changement", href: link },
        }) + footer(),
      };
    case "reauthentication":
      return {
        subject: "Votre code de confirmation",
        html: layout({ title: "Code de confirmation", paragraphs: [`Votre code : <strong style="font-size:20px;letter-spacing:4px">${esc(code)}</strong>`] }) + footer(),
      };
    default:
      return null;
  }
}

const footer = () =>
  `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:0 24px 24px;color:#8A8A95;font-size:12px">Vous n'êtes pas à l'origine de cette demande ? Ignorez simplement cet email.</p>`;

Deno.serve(async (req) => {
  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!secret) return json({ error: { http_code: 500, message: "SEND_EMAIL_HOOK_SECRET absent" } }, 500);

  const payload = await req.text();
  let user: { email: string; new_email?: string };
  let d: EmailData;
  try {
    ({ user, email_data: d } = new Webhook(secret.replace("v1,whsec_", "")).verify(
      payload,
      Object.fromEntries(req.headers),
    ) as { user: typeof user; email_data: EmailData });
  } catch {
    return json({ error: { http_code: 401, message: "Signature invalide" } }, 401);
  }

  // Changement d'email sécurisé : noms de champs inversés côté Supabase —
  // adresse actuelle ← token + token_hash_new ; nouvelle adresse ← token_new + token_hash.
  const sends: { to: string; hash: string; code: string }[] =
    d.email_action_type === "email_change"
      ? [
          ...(d.token_hash_new ? [{ to: user.email, hash: d.token_hash_new, code: d.token }] : []),
          { to: user.new_email ?? user.email, hash: d.token_hash, code: d.token_new || d.token },
        ]
      : [{ to: user.email, hash: d.token_hash, code: d.token }];

  for (const s of sends) {
    const mail = render(d.email_action_type, d, verifyUrl(s.hash, d.email_action_type, d.redirect_to || d.site_url), s.code);
    if (!mail) {
      console.error("auth-email : type non géré", d.email_action_type);
      return json({ error: { http_code: 400, message: `Type d'email non géré : ${d.email_action_type}` } }, 400);
    }
    const r = await sendEmail({ to: [s.to], subject: mail.subject, html: mail.html });
    // Échec d'envoi : on le remonte à Supabase pour que l'utilisateur voie une erreur plutôt qu'attendre un email.
    if (!r.sent) {
      console.error("auth-email", r.error ?? "RESEND_API_KEY absente");
      return json({ error: { http_code: 500, message: "Envoi de l'email impossible" } }, 500);
    }
  }
  return json({});
});
