/**
 * need-request — enregistre une demande de besoin déposée sans compte (parcours public /besoin)
 * et prévient Alex par email.
 *
 * Deux formes :
 * - demande de rappel du site (kind « callback ») : { name, company, phone, fonction, message?, source?, page? } ;
 * - ancien questionnaire /besoin : { email, vertical, metier?, budget?, engagement, rhythm?, duration?, open_positions?, start_window, brief? }.
 * « website » est un champ piège invisible : rempli, la demande est ignorée (robot).
 * Limites : 3 demandes par heure pour un même email ou téléphone, 40 par heure en tout.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { APP_URL, esc, layout, sendEmail } from "../_shared/email.ts";
import { needRequestLines, parseNeedRequest } from "../_shared/needRequest.ts";
import { fonctionLabel, parseCallbackRequest } from "../_shared/fonctions.ts";

const NOTIFY_TO = "aguego@kistone.fr";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Requête invalide" }, 400);
  // Robot : on répond comme si tout allait bien, sans rien enregistrer
  if (String((body as Record<string, unknown>).website ?? "").trim()) return json({ ok: true });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const tooMany = json({ error: "Trop de demandes en peu de temps. Réessayez dans une heure." }, 429);

  if ((body as Record<string, unknown>).kind === "callback") {
    const cb = parseCallbackRequest(body as Record<string, unknown>);
    if (typeof cb === "string") return json({ error: cb }, 400);
    const [{ count: byPhone }, { count: total }] = await Promise.all([
      db.from("need_requests").select("id", { count: "exact", head: true }).eq("phone", cb.phone).gte("created_at", hourAgo),
      db.from("need_requests").select("id", { count: "exact", head: true }).gte("created_at", hourAgo),
    ]);
    if ((byPhone ?? 0) >= 3 || (total ?? 0) >= 40) return tooMany;
    const { error } = await db.from("need_requests").insert({ kind: "callback", ...cb });
    if (error) return json({ error: "Enregistrement impossible." }, 500);
    const fn = fonctionLabel(cb.fonction) ?? cb.fonction;
    await sendEmail({
      to: [NOTIFY_TO],
      subject: `Demande de rappel : ${fn} · ${cb.company}`,
      html: layout({
        title: "Demande de rappel",
        paragraphs: [
          [`<strong>Nom</strong> : ${esc(cb.contact_name)}`, `<strong>Entreprise</strong> : ${esc(cb.company)}`,
            `<strong>Téléphone</strong> : ${esc(cb.phone)}`, `<strong>Fonction recherchée</strong> : ${esc(fn)}`].join("<br>"),
          ...(cb.brief ? [`<strong>Situation</strong> :<br>${esc(cb.brief).replace(/\n/g, "<br>")}`] : []),
          ...(cb.source ? [`<em>${esc(cb.source)}</em>`] : []),
        ],
        cta: { label: "Voir les demandes", href: `${APP_URL}/dashboard?tab=needs` },
      }),
    }).catch(() => null);
    return json({ ok: true });
  }

  const parsed = parseNeedRequest(body as Record<string, unknown>);
  if (typeof parsed === "string") return json({ error: parsed }, 400);

  const [{ count: byEmail }, { count: total }] = await Promise.all([
    db.from("need_requests").select("id", { count: "exact", head: true }).eq("email", parsed.email).gte("created_at", hourAgo),
    db.from("need_requests").select("id", { count: "exact", head: true }).gte("created_at", hourAgo),
  ]);
  if ((byEmail ?? 0) >= 3 || (total ?? 0) >= 40) {
    return json({ error: "Trop de demandes en peu de temps. Réessayez dans une heure ou réservez directement un appel." }, 429);
  }

  const { error } = await db.from("need_requests").insert(parsed);
  if (error) return json({ error: "Enregistrement impossible. Réessayez dans un instant." }, 500);

  // Prévenir Alex ; un échec d'envoi ne fait pas échouer la demande, déjà enregistrée
  const lines = needRequestLines(parsed).map((l) => `<strong>${esc(l.label)}</strong> : ${esc(l.value)}`);
  await sendEmail({
    to: [NOTIFY_TO],
    subject: `Nouvelle demande : ${needRequestLines(parsed)[0].value} (${parsed.email})`,
    html: layout({
      title: "Nouvelle demande de besoin",
      paragraphs: [
        `<strong>Email</strong> : ${esc(parsed.email)}`,
        lines.join("<br>"),
        ...(parsed.brief ? [`<strong>Description</strong> :<br>${esc(parsed.brief).replace(/\n/g, "<br>")}`] : []),
        "Le client n'a pas de compte : il peut réserver un appel depuis la page de confirmation.",
      ],
      cta: { label: "Voir les demandes", href: `${APP_URL}/dashboard?tab=needs` },
    }),
  }).catch(() => null);

  return json({ ok: true });
});
