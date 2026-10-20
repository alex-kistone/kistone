import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { ARTICLE_AUTHOR, ARTICLE_PUBLISHER } from "@/lib/structuredData";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { COMPARISON, FAMILIES, PLAYERS, type Family } from "@/content/comparison";
import { BLOG_PATH, formatDate } from "@/lib/blog";
import { ROUTES } from "@/content/site";
import { cn } from "@/lib/utils";

const BASE_URL = "https://kistone.fr";
export const COMPARISON_PATH = `${BLOG_PATH}/${COMPARISON.slug}`;

const FAMILY_TONE: Record<Family, string> = {
  specialist: "bg-[#E8E2F6] text-[#4B35A0]",
  selective: "bg-[#D5EDEA] text-[#16615C]",
  global: "bg-[#FBE6D4] text-[#94471A]",
  function: "bg-[#F5ECCB] text-[#6E5208]",
  open: "bg-[#DDE8F5] text-[#1E4F8F]",
};

/** Pastille de couleur de chaque famille (cartes « Cinq familles d'acteurs »). */
const FAMILY_DOT: Record<Family, string> = {
  specialist: "bg-[#7357D6]",
  selective: "bg-[#1F8F87]",
  global: "bg-[#E07A3A]",
  function: "bg-[#C99A12]",
  open: "bg-[#3D7BD0]",
};

const anchor = (name: string) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

/** Comparatif des plateformes pour trouver un expert IA freelance (Ressources), pré-rendu. */
export default function ComparisonPage() {
  const url = `${BASE_URL}${COMPARISON_PATH}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: COMPARISON.title,
      description: COMPARISON.seoDescription,
      datePublished: COMPARISON.date,
      dateModified: COMPARISON.date,
      inLanguage: "fr-FR",
      mainEntityOfPage: url,
      author: ARTICLE_AUTHOR,
      publisher: ARTICLE_PUBLISHER,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Plateformes pour trouver un expert IA freelance en France",
      itemListElement: PLAYERS.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: p.url })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: COMPARISON.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <SiteLayout>
      <SEO title={COMPARISON.seoTitle} description={COMPARISON.seoDescription} path={COMPARISON_PATH} type="article" image="/og/comparatif.png" jsonLd={jsonLd} />

      <article>
        {/* En-tête */}
        <header className="relative isolate mx-auto max-w-ks px-5 pt-10 md:px-8 md:pt-16 xl:px-0">
          <BoltWatermark strokeWidth={14} className="-right-24 -top-20 h-[620px] w-auto rotate-[14deg]" />
          <nav aria-label="Fil d'Ariane" className="text-sm text-ks-subtle">
            <Link to={BLOG_PATH} className="hover:text-ks-ink">Ressources</Link> · Comparatif
          </nav>
          <h1 className="mt-5 max-w-[960px] font-ks-display text-[38px] font-bold leading-[1.05] tracking-[-0.045em] md:text-[58px]">{COMPARISON.title}</h1>
          <p className="mt-5 max-w-[780px] text-lg leading-[1.55] text-ks-soft md:text-xl">{COMPARISON.lead}</p>
          <p className="mt-4 text-sm text-ks-subtle">
            Mis à jour le <time dateTime={COMPARISON.date}>{formatDate(COMPARISON.date)}</time> · {PLAYERS.length} acteurs comparés
          </p>
          <div className="mt-8 max-w-[860px] rounded-[24px] border border-[rgba(20,19,18,0.08)] bg-white p-6 shadow-ks-card">
            <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">En bref</p>
            <p className="mt-2 text-[17px] leading-[1.6] text-ks-ink-2">{COMPARISON.answer}</p>
          </div>
        </header>

        {/* Les quatre familles */}
        <PageSection title="Cinq familles d'acteurs">
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {(Object.keys(FAMILIES) as Family[]).map((f) => (
              <li key={f} className="flex flex-col rounded-[24px] bg-white p-6 shadow-ks-card sm:last:col-span-2 xl:last:col-span-1">
                <span className={cn("h-2.5 w-2.5 rounded-full", FAMILY_DOT[f])} aria-hidden="true" />
                <h3 className="mt-4 font-ks-display text-[19px] font-semibold leading-[1.25] tracking-[-0.02em] text-balance">{FAMILIES[f].label}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{FAMILIES[f].desc}</p>
                <p className="mt-auto pt-4 text-[13px] text-ks-subtle">{PLAYERS.filter((p) => p.family === f).map((p) => p.name).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </PageSection>

        {/* Tableau comparatif */}
        <PageSection title="Le tableau comparatif">
          <div className="mt-10 overflow-x-auto rounded-[24px] bg-white shadow-ks-card">
            <table className="w-full min-w-[920px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-[rgba(20,19,18,0.08)] text-ks-soft">
                  <th className="px-5 py-4 font-medium">Acteur</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Fonctions couvertes</th>
                  <th className="px-5 py-4 font-medium">Modèles</th>
                  <th className="px-5 py-4 font-medium">Idéal pour</th>
                </tr>
              </thead>
              <tbody>
                {PLAYERS.map((p) => (
                  <tr key={p.name} className={cn("border-b border-[rgba(20,19,18,0.06)] align-top last:border-0", p.name === "Kistone" && "bg-[#FFF5F8]")}>
                    <td className="px-5 py-4 font-ks-display text-[16px] font-semibold"><a href={`#${anchor(p.name)}`} className="hover:underline">{p.name}</a></td>
                    <td className="px-5 py-4"><span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium", FAMILY_TONE[p.family])}>{FAMILIES[p.family].label}</span></td>
                    <td className="px-5 py-4 text-ks-ink-2">{p.scope}</td>
                    <td className="px-5 py-4 text-ks-ink-2">{p.models}</td>
                    <td className="px-5 py-4 text-ks-soft">{p.idealFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageSection>

        {/* Fiches */}
        <PageSection title="Les acteurs en détail" bolt="-left-24 top-40 h-[360px] w-auto rotate-[-14deg]">
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {PLAYERS.map((p, i) => (
              <section key={p.name} id={anchor(p.name)} className={cn("scroll-mt-28 rounded-[28px] bg-white p-7 shadow-ks-card", p.name === "Kistone" && "ring-2 ring-ks-pink lg:col-span-2")}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-ks-mono text-[12px] text-ks-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="font-ks-display text-[26px] font-bold tracking-[-0.03em]">{p.name}</h2>
                  <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium", FAMILY_TONE[p.family])}>{FAMILIES[p.family].label}</span>
                </div>
                <p className="mt-4 text-[15px] leading-[1.6] text-ks-ink-2">{p.summary}</p>
                <h3 className="mt-5 font-ks-display text-[17px] font-semibold">Points forts</h3>
                <ul className="mt-2 space-y-1.5 text-[15px] leading-[1.55] text-ks-ink-2">
                  {p.strengths.map((s) => (
                    <li key={s} className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ks-pink" aria-hidden="true" />{s}</li>
                  ))}
                </ul>
                <p className="mt-5 text-[14px] text-ks-soft"><strong className="font-semibold text-ks-ink">Idéal pour :</strong> {p.idealFor}</p>
                <p className="mt-2 text-[14px] text-ks-soft"><strong className="font-semibold text-ks-ink">Modèles :</strong> {p.models}</p>
                {p.name === "Kistone" ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Cta href={ROUTES.recruit} variant="studio" arrow>Accéder aux profils</Cta>
                    <Cta href={ROUTES.freelance} variant="secondary">Rejoindre en tant que freelance</Cta>
                  </div>
                ) : (
                  <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-5 inline-block text-[14px] font-medium text-ks-pink hover:underline">
                    Voir le site de {p.name} ↗
                  </a>
                )}
              </section>
            ))}
          </div>
        </PageSection>

        {/* Comment choisir */}
        <PageSection title="Cinq questions pour choisir le bon acteur">
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {COMPARISON.questions.map((q, i) => (
              <li key={q.title} className="rounded-[24px] bg-white p-6 shadow-ks-card">
                <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">0{i + 1}</span>
                <h3 className="mt-3 font-ks-display text-[19px] font-semibold tracking-[-0.02em]">{q.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-ks-soft">{q.desc}</p>
              </li>
            ))}
          </ol>
        </PageSection>

        {/* FAQ */}
        <PageSection title="Vos questions">
          <div className="mt-8 max-w-[860px] divide-y divide-[rgba(20,19,18,0.08)] rounded-[24px] bg-white px-6 shadow-ks-card md:px-8">
            {COMPARISON.faq.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-ks-display text-[18px] font-semibold tracking-[-0.01em]">
                  {f.q}
                  <span className="text-ks-pink transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-[1.6] text-ks-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </PageSection>

        {/* Méthodologie et transparence */}
        <PageSection title="Comment ce comparatif a été réalisé">
          <div className="mt-6 max-w-[860px] space-y-3 text-[15px] leading-[1.65] text-ks-soft">
            <p>
              Ce comparatif est rédigé par Kistone, qui figure parmi les acteurs présentés : nous l'indiquons en toute transparence.
              Les informations proviennent des sites publics de chaque acteur, consultés le {formatDate(COMPARISON.date)} ; les chiffres
              mentionnés sont ceux que les acteurs annoncent eux-mêmes.
            </p>
            <p>
              Les acteurs sont présentés selon quatre critères : la ou les fonctions couvertes, les modèles d'intervention, le niveau
              de sélection des profils et le type de clients accompagnés. Vous représentez l'un de ces acteurs et une information a
              changé ? Écrivez-nous, nous la mettrons à jour.
            </p>
          </div>
        </PageSection>
      </article>
    </SiteLayout>
  );
}
