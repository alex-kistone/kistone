/**
 * Gabarit d'email à la charte Kistone (fond crème, carte blanche arrondie, rose en aplat pour le
 * seul bouton, signature d'Alexandre). HTML d'email : styles en ligne, mise en page en tableaux,
 * polices du site avec repli système. Partagé par les invitations et les relances d'inscription,
 * et importé côté admin pour les aperçus.
 */

export const SITE = "https://kistone.fr";
const DISPLAY = "Outfit, 'Helvetica Neue', Arial, sans-serif";
const TEXT = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const MONO = "'Geist Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type BrandEmail = {
  subject: string;
  label: string;
  title: string;
  /** Paragraphe d'introduction (HTML déjà échappé, <strong> autorisé). */
  intro: string;
  /** Mot personnel facultatif, affiché dans un encadré (texte brut). */
  message?: string | null;
  /** Liste à coches (texte brut). */
  points: string[];
  cta: { label: string; href: string };
  /** Ligne sous le bouton, avec un lien secondaire facultatif. */
  note: string;
  secondary?: { label: string; href: string };
  /** Mention en pied d'email (texte brut). */
  footer: string;
};

export function brandEmail(e: BrandEmail): string {
  const personal = e.message?.trim()
    ? `<tr><td style="padding:0 0 20px"><div style="background:#F5F1EA;border-radius:16px;padding:16px 18px;font-family:${TEXT};font-size:15px;line-height:1.6;color:#3D3A36">${esc(e.message.trim()).replace(/\n/g, "<br>")}</div></td></tr>`
    : "";
  const points = e.points.map((b) => `<tr>
      <td width="26" valign="top" style="padding:3px 0 10px"><div style="width:18px;height:18px;border-radius:9px;background:#FFE3EC;color:#FF2E6E;font-size:11px;line-height:18px;text-align:center;font-weight:700">✓</div></td>
      <td style="padding:0 0 10px;font-family:${TEXT};font-size:15px;line-height:1.5;color:#3D3A36">${esc(b)}</td>
    </tr>`).join("");
  const secondary = e.secondary ? ` <a href="${e.secondary.href}" style="color:#141312;text-decoration:underline">${esc(e.secondary.label)}</a>` : "";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(e.subject)}</title></head>
<body style="margin:0;padding:0;background:#F5F1EA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EA">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
      <tr><td style="padding:0 8px 20px"><img src="${SITE}/logos/logo-full-black.png" alt="kistone" width="120" style="display:block;height:auto;border:0"></td></tr>
      <tr><td style="background:#FFFFFF;border-radius:28px;padding:36px 32px;border:1px solid rgba(20,19,18,0.07)">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 14px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8F1747">${esc(e.label)}</td></tr>
          <tr><td style="padding:0 0 20px;font-family:${DISPLAY};font-size:30px;line-height:1.08;font-weight:700;letter-spacing:-0.8px;color:#141312">${esc(e.title)}</td></tr>
          <tr><td style="padding:0 0 14px;font-family:${TEXT};font-size:15px;line-height:1.6;color:#3D3A36">Bonjour,</td></tr>
          <tr><td style="padding:0 0 20px;font-family:${TEXT};font-size:15px;line-height:1.6;color:#3D3A36">${e.intro}</td></tr>
          ${personal}
          <tr><td style="padding:0 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${points}</table></td></tr>
          <tr><td style="padding:6px 0 16px">
            <a href="${e.cta.href}" style="display:inline-block;background:#FF2E6E;color:#FFFFFF;font-family:${TEXT};font-size:15px;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:999px">${esc(e.cta.label)} &rarr;</a>
          </td></tr>
          <tr><td style="padding:0 0 26px;font-family:${TEXT};font-size:14px;line-height:1.5;color:#5E5A54">${esc(e.note)}${secondary}</td></tr>
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
        ${esc(e.footer)}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
