/**
 * Emails transactionnels (Resend). Sans secret RESEND_API_KEY, rien ne part : l'appel est
 * seulement journalisé et `sent` vaut false.
 */
export const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Kistone <notifications@kistone.fr>";
export const APP_URL = (Deno.env.get("APP_URL") ?? "https://kistone.fr").replace(/\/$/, "");

export const emailConfigured = () => !!Deno.env.get("RESEND_API_KEY");

export interface EmailAttachment { filename: string; content: Uint8Array }

export async function sendEmail(
  { to, subject, html, attachments }: { to: string[]; subject: string; html: string; attachments?: EmailAttachment[] },
): Promise<{ sent: boolean; error?: string }> {
  const key = Deno.env.get("RESEND_API_KEY");
  const recipients = to.filter((e) => e && !e.endsWith(".invalid"));
  if (!key || recipients.length === 0) {
    console.log(`[email non envoyé] ${subject} → ${to.length} destinataire(s)`);
    return { sent: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: recipients,
      subject,
      html,
      attachments: attachments?.map((a) => ({ filename: a.filename, content: toBase64(a.content) })),
    }),
  });
  if (!res.ok) return { sent: false, error: `Resend ${res.status} ${await res.text()}` };
  return { sent: true };
}

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Gabarit sobre aux couleurs Kistone : titre, paragraphes (HTML déjà échappé), bouton optionnel. */
export function layout({ title, paragraphs, cta }: { title: string; paragraphs: string[]; cta?: { label: string; href: string } }) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0B0B0F">
  <p style="font-weight:700;font-size:18px;margin:0 0 24px">kistone</p>
  <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
  ${paragraphs.map((p) => `<p style="line-height:1.6;color:#3A3A45;margin:0 0 12px">${p}</p>`).join("")}
  ${cta ? `<p style="margin:24px 0"><a href="${cta.href}" style="background:#FF2E6E;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${esc(cta.label)}</a></p>` : ""}
  <p style="color:#8A8A95;font-size:12px;margin-top:32px">Email envoyé automatiquement par Kistone.</p>
</div>`;
}

export { esc };
