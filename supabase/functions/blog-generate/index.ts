/**
 * blog-generate — rédige un article de blog SEO/GEO à partir d'un brief (admin uniquement).
 *
 * Corps : { theme, tone, objective, audience?, keywords?, length?, vertical? }
 * Réponse : { title, slug, excerpt, seo_title, seo_description, content (Markdown), tags,
 *             faq: [{ q, a }], image_prompt, cover_alt }
 *
 * Secret : ANTHROPIC_API_KEY.
 */
import { requireAdmin } from "../_shared/adminAuth.ts";
import { verticalOf } from "../_shared/verticals.ts";

const MODEL = "claude-sonnet-5-5";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const LENGTHS: Record<string, string> = {
  court: "environ 700 mots",
  moyen: "environ 1 200 mots",
  long: "environ 1 800 mots",
};

/** Pages du site vers lesquelles l'article peut renvoyer (maillage interne). */
const INTERNAL_LINKS = [
  "- /recruter/tech-recruiter : fiche de poste Recruteur Tech (Engineering, Data/AI, Product, système d'information)",
  "- /recruter/recruteur-gtm : fiche de poste Recruteur GTM (Sales & Marketing)",
  "- /recruter/recruteur-generaliste : fiche de poste Recruteur généraliste (toutes fonctions, tri de CV, entretiens structurés, scorecards)",
  "- /recruter/head-of-ta : fiche de poste Head of TA (process, structuration de la fonction recrutement)",
  "- /besoin : formulaire pour partager un besoin et recevoir un recruteur sous 48 h",
  "- /register : inscription des freelances",
].join("\n");

const SYSTEM = `Tu es rédacteur en chef du blog de Kistone, réseau français de Freelance RPO (une communauté de 700+ recruteurs sélectionnés et qualifiés, jamais une place de marché ouverte) : Recruteurs Tech, Recruteurs GTM, Recruteurs généralistes et Head of TA, intégrés aux équipes de leurs clients, à temps plein ou quelques jours par semaine. Un premier profil est présenté sous 48 h, facturé au jour, sans honoraires au placement.

Tu écris en français, pour des dirigeants, des DRH et des équipes Talent de startups, scale-ups, PME et grands groupes, et pour des recruteurs freelance. Les thèmes du blog : le RPO, le recrutement par métier, la structuration de la fonction recrutement, les méthodes (tri de CV, entretiens structurés, scorecards), l'effet de l'IA sur le recrutement et le métier de recruteur freelance.

Règles de rédaction SEO et GEO (moteurs de recherche et moteurs IA) :
- Réponds à la question principale dès l'introduction, en 2 ou 3 phrases autonomes et citables.
- Structure en sections H2 (##) formulées comme les questions que se pose le lecteur, avec des H3 (###) si utile. Pas de H1 : le titre est affiché à part.
- Paragraphes courts, listes à puces, au moins un tableau Markdown quand une comparaison s'y prête.
- Définis clairement les termes clés (une phrase « X est… »).
- Intègre naturellement les mots-clés demandés, sans bourrage.
- N'invente aucun chiffre, aucune étude, aucune citation ni aucun client. Si tu donnes un ordre de grandeur (TJM, durée), présente-le comme indicatif.
- Ajoute 2 à 4 liens internes Markdown pertinents parmi les pages du site listées, et termine par un appel à l'action vers /besoin ou /register selon le public.
- N'emploie jamais l'expression « management de transition » : parle de mission, de temps plein ou de quelques jours par semaine.
- Ne présente pas l'offre en opposition au CDI (« sans le CDI », « coût d'un CDI ») : mets en avant la flexibilité du freelance.
- Dis « profils qualifiés » plutôt que « vérifiés ».
- Pas de formule creuse (« dans un monde en constante évolution »), pas d'emoji.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "Génération indisponible (ANTHROPIC_API_KEY absente)." }, 503);
  if (!(await requireAdmin(req))) return json({ error: "Réservé aux administrateurs." }, 403);

  const b = await req.json().catch(() => ({}));
  const theme = String(b.theme ?? "").trim();
  if (theme.length < 5) return json({ error: "Indiquez un thème d'au moins quelques mots." }, 400);
  const vertical = b.vertical ? verticalOf(b.vertical) : null;

  const prompt = `Rédige un article de blog à partir de ce brief.

- Thème : ${theme}
- Ton : ${b.tone || "expert et accessible"}
- Objectif : ${b.objective || "informer et générer des demandes de profils"}
- Public cible : ${b.audience || "dirigeants de startups, scale-ups et PME"}
- Mots-clés à cibler : ${b.keywords || "à choisir selon le thème"}
- Longueur : ${LENGTHS[b.length] ?? LENGTHS.moyen}
${vertical ? `- Fonction concernée : ${vertical.short} (${vertical.roles})` : ""}

Pages du site disponibles pour les liens internes :
${INTERNAL_LINKS}

Retourne l'article complet en appelant l'outil « article » (et rien d'autre).`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 12000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      tools: [{
        name: "article",
        description: "L'article de blog complet, prêt à relire.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre de l'article, 50 à 70 caractères, avec le mot-clé principal" },
            slug: { type: "string", description: "Adresse : minuscules sans accents, mots séparés par des tirets, 3 à 7 mots" },
            excerpt: { type: "string", description: "Chapô de 1 à 2 phrases affiché en liste et en tête d'article" },
            seo_title: { type: "string", description: "Balise title, 60 caractères maximum" },
            seo_description: { type: "string", description: "Meta description, 140 à 155 caractères, incitative" },
            content: { type: "string", description: "Corps de l'article en Markdown (## et ###, listes, tableaux, liens internes), sans titre H1 ni FAQ" },
            tags: { type: "array", items: { type: "string" }, description: "3 à 5 étiquettes courtes" },
            faq: {
              type: "array",
              description: "4 à 5 questions fréquentes avec réponses de 2 à 3 phrases, autonomes",
              items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] },
            },
            image_prompt: { type: "string", description: "Description en anglais d'une scène pour une photo éditoriale réaliste (lieu, personnes, action, ambiance), sans texte, sans logo, sans écran lisible" },
            cover_alt: { type: "string", description: "Texte alternatif de l'image de couverture, en français" },
          },
          required: ["title", "slug", "excerpt", "seo_title", "seo_description", "content", "tags", "faq", "image_prompt", "cover_alt"],
        },
      }],
    }),
  });
  if (!res.ok) return json({ error: `Claude ${res.status} : ${(await res.text()).slice(0, 300)}` }, 502);
  const data = await res.json();
  if (data.stop_reason === "max_tokens") return json({ error: "Article trop long : choisissez une longueur plus courte." }, 502);
  const out = data.content?.find((c: { type: string }) => c.type === "tool_use")?.input;
  if (!out?.content) return json({ error: "Réponse de l'IA incomplète, réessayez." }, 502);

  out.slug = String(out.slug).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return json(out);
});
