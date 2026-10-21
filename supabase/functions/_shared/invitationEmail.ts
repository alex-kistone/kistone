/**
 * Email d'invitation d'un freelance à rejoindre Kistone, à la charte du site (fond crème, carte
 * blanche arrondie, rose en aplat pour le seul bouton). HTML d'email : styles en ligne, mise en
 * page en tableaux, polices du site avec repli système. Partagé avec l'admin pour l'aperçu.
 */

/** Deux modèles : experts IA (AI Engineer, AI Product, AI Leader) et Tech recruiters (RPO). */
export type InvitationAudience = "ai" | "rpo";

type Template = { subject: string; label: string; title: string; intro: string; benefits: string[]; cta: string; signup: string };

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
  },
};

/** Objet par défaut du modèle experts IA (rétrocompatibilité). */
export const INVITATION_SUBJECT = INVITATION_TEMPLATES.ai.subject;

const SITE = "https://kistone.fr";
const DISPLAY = "Outfit, 'Helvetica Neue', Arial, sans-serif";
const TEXT = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const MONO = "'Geist Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function invitationEmail({ audience = "ai", firstName, message, appUrl = SITE }: {
  audience?: InvitationAudience; firstName?: string | null; message?: string | null; appUrl?: string;
}) {
  const tpl = INVITATION_TEMPLATES[audience];
  const join = `${appUrl}${tpl.signup}`;
  const discover = `${appUrl}/freelances?utm_source=invitation`;
  const hello = firstName?.trim() ? `Bonjour ${esc(firstName.trim())},` : "Bonjour,";
  const personal = message?.trim()
    ? `<tr><td style="padding:0 0 20px"><div style="background:#F5F1EA;border-radius:16px;padding:16px 18px;font-family:${TEXT};font-size:15px;line-height:1.6;color:#3D3A36">${esc(message.trim()).replace(/\n/g, "<br>")}</div></td></tr>`
    : "";
  const benefits = tpl.benefits.map((b) => `<tr>
      <td width="26" valign="top" style="padding:3px 0 10px"><div style="width:18px;height:18px;border-radius:9px;background:#FFE3EC;color:#FF2E6E;font-size:11px;line-height:18px;text-align:center;font-weight:700">✓</div></td>
      <td style="padding:0 0 10px;font-family:${TEXT};font-size:15px;line-height:1.5;color:#3D3A36">${esc(b)}</td>
    </tr>`).join("");

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(tpl.subject)}</title></head>
<body style="margin:0;padding:0;background:#F5F1EA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EA">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
      <tr><td style="padding:0 8px 20px"><img src="${SITE}/logos/logo-full-black.png" alt="kistone" width="120" style="display:block;height:auto;border:0"></td></tr>
      <tr><td style="background:#FFFFFF;border-radius:28px;padding:36px 32px;border:1px solid rgba(20,19,18,0.07)">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 14px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8F1747">${esc(tpl.label)}</td></tr>
          <tr><td style="padding:0 0 20px;font-family:${DISPLAY};font-size:30px;line-height:1.08;font-weight:700;letter-spacing:-0.8px;color:#141312">${esc(tpl.title)}</td></tr>
          <tr><td style="padding:0 0 14px;font-family:${TEXT};font-size:15px;line-height:1.6;color:#3D3A36">${hello}</td></tr>
          <tr><td style="padding:0 0 20px;font-family:${TEXT};font-size:15px;line-height:1.6;color:#3D3A36">${tpl.intro}</td></tr>
          ${personal}
          <tr><td style="padding:0 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${benefits}</table></td></tr>
          <tr><td style="padding:6px 0 16px">
            <a href="${join}" style="display:inline-block;background:#FF2E6E;color:#FFFFFF;font-family:${TEXT};font-size:15px;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:999px">${esc(tpl.cta)} &rarr;</a>
          </td></tr>
          <tr><td style="padding:0 0 26px;font-family:${TEXT};font-size:14px;line-height:1.5;color:#5E5A54">Inscription gratuite, une dizaine de minutes. <a href="${discover}" style="color:#141312;text-decoration:underline">Découvrir l'espace freelance</a></td></tr>
          <tr><td style="border-top:1px solid rgba(20,19,18,0.08);padding:20px 0 0">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td width="52" valign="middle"><img src="${SITE}/team/alexandre-guego.jpg" alt="" width="42" height="42" style="display:block;border-radius:21px;object-fit:cover;border:0"></td>
              <td valign="middle" style="font-family:${TEXT};font-size:14px;line-height:1.4;color:#141312"><strong>Alexandre Guégo</strong><br><span style="color:#5E5A54">Fondateur de Kistone</span></td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:20px 12px 0;font-family:${TEXT};font-size:12px;line-height:1.5;color:#8A857D">
        Kistone · <a href="${SITE}" style="color:#8A857D">kistone.fr</a><br>
        Vous recevez cet email parce qu'Alexandre a souhaité vous inviter sur Kistone. Pas intéressé&nbsp;? Répondez simplement «&nbsp;stop&nbsp;» : nous ne vous recontacterons pas.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
