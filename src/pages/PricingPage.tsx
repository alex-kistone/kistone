import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import SEO, { BASE_URL } from "@/components/SEO";
import { ARTICLE_AUTHOR, ARTICLE_PUBLISHER } from "@/lib/structuredData";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { BLOG_PATH, formatDate } from "@/lib/blog";
import { BOOKING_URL, ROUTES } from "@/content/site";
import { COMPARISON_PATH } from "@/pages/ComparisonPage";
import {
  EXAMPLE, GRID, LEVELS, PRICING, PRICING_PATH, PRICING_READY, SPLIT, cellLabel, exampleTotals, gridRange, money,
} from "@/content/pricing";
import { cn } from "@/lib/utils";

/** Questions fréquentes sur le coût d'un recruteur freelance (affichées et en FAQPage). */
function faq() {
  const range = gridRange();
  const rangeText = range ? `entre ${money(range[0])} et ${money(range[1])} HT par jour` : "[fourchette à compléter]";
  return [
    {
      q: "Combien coûte un recruteur freelance ?",
      a: `Un recruteur freelance (RPO) est facturé au jour. Dans le réseau Kistone, le TJM se situe ${rangeText}, selon la fonction recrutée, l'expérience du recruteur et le périmètre de la mission. Il n'y a pas d'honoraires au placement : vous payez les jours réalisés.`,
    },
    {
      q: "Qu'est-ce qui fait varier le TJM d'un recruteur freelance ?",
      a: `Trois critères : la fonction recrutée, l'expérience du recruteur et le périmètre de la mission. Un Head of Talent Acquisition, qui structure toute la fonction recrutement, est facturé plus cher qu'un recruteur qui exécute des recrutements.`,
    },
    {
      q: "Comment se répartit le TJM entre le recruteur et Kistone ?",
      a: `Sur le TJM payé par le client, ${SPLIT.freelance} % reviennent au recruteur freelance et ${SPLIT.kistone} % à Kistone. La part Kistone couvre la sélection des recruteurs, le contrat, la conformité, le suivi des jours, la facturation et le paiement du recruteur chaque fin de mois.`,
    },
    {
      q: "Y a-t-il des honoraires au placement ?",
      a: "Non. Contrairement à un cabinet de recrutement, qui facture souvent 20 à 25 % du salaire annuel à chaque embauche, le recruteur freelance est facturé au temps passé, quel que soit le nombre de recrutements réalisés.",
    },
    {
      q: "Comment est établie la facture ?",
      a: "Le recruteur déclare ses jours dans un compte rendu d'activité (CRA) que vous validez chaque mois. Kistone émet ensuite une facture unique sur les jours validés.",
    },
    {
      q: "Peut-on prendre un recruteur freelance à temps partiel ?",
      a: "Oui. Le recruteur intervient à temps plein ou quelques jours par semaine : vous ajustez le rythme, donc le budget, à votre volume de postes.",
    },
    {
      q: "Recruteur freelance ou cabinet : lequel revient le moins cher ?",
      a: "Tout dépend du nombre de recrutements. Le cabinet facture chaque embauche ; le recruteur freelance facture son temps. Plus le volume de postes est élevé, plus le coût par recrutement d'un recruteur freelance se dilue. Pour un poste isolé et très spécifique, un cabinet peut rester pertinent.",
    },
  ];
}

/** Tarifs du recruteur freelance : grille par fonction et séniorité, répartition, exemple, comparaison cabinet. */
export default function PricingPage() {
  const url = `${BASE_URL}${PRICING_PATH}`;
  const questions = faq();
  const t = exampleTotals();
  const offers = GRID.flatMap((r) =>
    r.cells.flatMap((c, i) =>
      Array.isArray(c)
        ? [{
            "@type": "Offer",
            name: `Recruteur freelance ${r.fonction} · ${LEVELS[i]}`,
            priceSpecification: { "@type": "UnitPriceSpecification", priceCurrency: "EUR", minPrice: c[0], maxPrice: c[1], unitCode: "DAY", valueAddedTaxIncluded: false },
          }]
        : [],
    ),
  );
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: PRICING.title,
      description: PRICING.seoDescription,
      datePublished: PRICING.date,
      dateModified: PRICING.date,
      inLanguage: "fr-FR",
      mainEntityOfPage: url,
      author: ARTICLE_AUTHOR,
      publisher: ARTICLE_PUBLISHER,
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Recruteur freelance (RPO)",
      serviceType: "Recruitment Process Outsourcing",
      provider: { "@id": `${BASE_URL}/#organization` },
      areaServed: { "@type": "Country", name: "France" },
      url,
      ...(offers.length ? { offers } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ressources", item: `${BASE_URL}${BLOG_PATH}` },
        { "@type": "ListItem", position: 2, name: "Tarifs du recruteur freelance", item: url },
      ],
    },
  ];

  return (
    <SiteLayout>
      <SEO title={PRICING.seoTitle} description={PRICING.seoDescription} path={PRICING_PATH} type="article" jsonLd={jsonLd} />
      {/* Grille incomplète : jamais indexée (la page n'est de toute façon pas publiée tant qu'elle n'est pas remplie) */}
      {!PRICING_READY && (
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
      )}

      <article>
        {/* En-tête */}
        <header className="relative isolate mx-auto max-w-ks px-5 pt-10 md:px-8 md:pt-16 xl:px-0">
          <BoltWatermark strokeWidth={14} className="-right-24 -top-20 h-[620px] w-auto rotate-[14deg]" />
          <nav aria-label="Fil d'Ariane" className="text-sm text-ks-subtle">
            <Link to={BLOG_PATH} className="hover:text-ks-ink">Ressources</Link> · Tarifs
          </nav>
          <h1 className="mt-5 max-w-[960px] font-ks-display text-[38px] font-bold leading-[1.05] tracking-[-0.045em] md:text-[58px]">{PRICING.title}</h1>
          <p className="mt-5 max-w-[780px] text-lg leading-[1.55] text-ks-soft md:text-xl">{PRICING.lead}</p>
          <p className="mt-4 text-sm text-ks-subtle">
            Mis à jour le <time dateTime={PRICING.date}>{formatDate(PRICING.date)}</time> · Tarifs en € HT par jour
          </p>
          <div className="mt-8 max-w-[860px] rounded-[24px] border border-[rgba(20,19,18,0.08)] bg-white p-6 shadow-ks-card">
            <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">En bref</p>
            <p className="mt-2 text-[17px] leading-[1.6] text-ks-ink-2">{questions[0].a}</p>
          </div>
        </header>

        {/* Principes */}
        <PageSection title="Ce que vous payez">
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING.principles.map((p, i) => (
              <li key={p.title} className="rounded-[24px] bg-white p-6 shadow-ks-card">
                <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">0{i + 1}</span>
                <h3 className="mt-3 font-ks-display text-[19px] font-semibold tracking-[-0.02em]">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{p.desc}</p>
              </li>
            ))}
          </ul>
        </PageSection>

        {/* Grille */}
        <PageSection id="grille" title="Les tarifs par fonction et séniorité">
          <p className="mt-5 max-w-[780px] text-[16px] leading-[1.6] text-ks-soft">
            TJM facturé au client, en € HT par jour, selon la fonction recrutée et l'expérience du recruteur.
            Le tarif exact est fixé avec vous selon le profil retenu et le périmètre de la mission.
          </p>
          <div className="mt-8 overflow-x-auto rounded-[24px] bg-white shadow-ks-card">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <caption className="sr-only">TJM d'un recruteur freelance par fonction et séniorité, en € HT par jour</caption>
              <thead>
                <tr className="border-b border-[rgba(20,19,18,0.08)] text-ks-soft">
                  <th scope="col" className="px-5 py-4 font-medium">Fonction recrutée</th>
                  {LEVELS.map((l) => (
                    <th key={l} scope="col" className="px-5 py-4 font-medium">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRID.map((r) => (
                  <tr key={r.fonction} className="border-b border-[rgba(20,19,18,0.06)] align-top last:border-0">
                    <th scope="row" className="px-5 py-4 text-left font-normal">
                      <span className="block font-ks-display text-[16px] font-semibold text-ks-ink">{r.fonction}</span>
                      <span className="text-[13px] text-ks-subtle">{r.scope}</span>
                    </th>
                    {r.cells.map((c, i) => (
                      <td key={i} className={cn("whitespace-nowrap px-5 py-4 font-medium", c === null ? "text-ks-pink" : "text-ks-ink")}>{cellLabel(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageSection>

        {/* Ce qui fait varier */}
        <PageSection title="Ce qui fait varier le tarif">
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {PRICING.variables.map((v) => (
              <li key={v.title} className="rounded-[24px] bg-white p-6 shadow-ks-card">
                <h3 className="font-ks-display text-[19px] font-semibold tracking-[-0.02em]">{v.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{v.desc}</p>
              </li>
            ))}
          </ul>
        </PageSection>

        {/* Répartition */}
        <PageSection id="repartition" title="Comment se répartit le TJM">
          <p className="mt-5 max-w-[780px] text-[16px] leading-[1.6] text-ks-soft">
            Sur le TJM payé par le client, {SPLIT.freelance} % reviennent au recruteur freelance et {SPLIT.kistone} % à Kistone.
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[28px] bg-white p-7 shadow-ks-card">
              <div className="flex h-14 overflow-hidden rounded-[14px] text-[15px] font-semibold" role="img" aria-label={`${SPLIT.freelance} % pour le recruteur, ${SPLIT.kistone} % pour Kistone`}>
                <div className="flex items-center bg-[#DCEEDF] px-4 text-[#1B6541]" style={{ width: `${SPLIT.freelance}%` }}>{SPLIT.freelance} %</div>
                <div className="ks-grad-bg flex items-center justify-center text-white" style={{ width: `${SPLIT.kistone}%` }}>{SPLIT.kistone} %</div>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-[#1B6541]">{SPLIT.freelance} % · Le recruteur freelance</p>
                  <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">Sa rémunération pour chaque jour travaillé, payée chaque fin de mois.</p>
                </div>
                <div>
                  <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em]"><span className="ks-grad-text">{SPLIT.kistone} % · Kistone</span></p>
                  <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">Tout ce qui entoure la mission, détaillé ci-contre.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] bg-white p-7 shadow-ks-card">
              <h3 className="font-ks-display text-[19px] font-semibold tracking-[-0.02em]">Ce que couvre la part Kistone</h3>
              <ul className="mt-4 space-y-2.5 text-[15px] leading-[1.55] text-ks-ink-2">
                {PRICING.kistoneCovers.map((s) => (
                  <li key={s} className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ks-pink" aria-hidden="true" />{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </PageSection>

        {/* Exemple chiffré et comparaison cabinet */}
        <PageSection id="exemple" title="Exemple chiffré : recruteur freelance ou cabinet">
          <p className="mt-5 max-w-[780px] text-[16px] leading-[1.6] text-ks-soft">
            Une mission de {EXAMPLE.weeks ?? "[à compléter]"} semaines, à {EXAMPLE.daysPerWeek ?? "[à compléter]"} jours par semaine,
            pour {EXAMPLE.hires ?? "[à compléter]"} recrutements de postes à {money(EXAMPLE.salary)} bruts annuels en moyenne.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-[28px] bg-white p-7 shadow-ks-card ring-2 ring-ks-pink">
              <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">Recruteur freelance (RPO)</p>
              <dl className="mt-5 space-y-3 text-[15px]">
                <div className="flex justify-between gap-4"><dt className="text-ks-soft">TJM</dt><dd className="font-medium">{money(EXAMPLE.tjm)} HT</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ks-soft">Jours réalisés</dt><dd className="font-medium">{t.days ?? "[à compléter]"}</dd></div>
                <div className="flex justify-between gap-4 border-t border-[rgba(20,19,18,0.08)] pt-3"><dt className="font-semibold">Coût total</dt><dd className="font-ks-display text-[22px] font-bold">{money(t.rpo)} HT</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ks-soft">Par recrutement</dt><dd className="font-medium">{money(t.rpoPerHire)} HT</dd></div>
              </dl>
              <p className="mt-5 text-[14px] leading-[1.55] text-ks-soft">Au-delà des recrutements, le vivier, le process et les outils construits pendant la mission vous restent.</p>
            </div>
            <div className="rounded-[28px] bg-white p-7 shadow-ks-card">
              <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">Cabinet de recrutement</p>
              <dl className="mt-5 space-y-3 text-[15px]">
                <div className="flex justify-between gap-4"><dt className="text-ks-soft">Honoraires</dt><dd className="font-medium">{EXAMPLE.cabinetFeePct ?? "[à compléter]"} % du salaire annuel</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ks-soft">Recrutements</dt><dd className="font-medium">{EXAMPLE.hires ?? "[à compléter]"}</dd></div>
                <div className="flex justify-between gap-4 border-t border-[rgba(20,19,18,0.08)] pt-3"><dt className="font-semibold">Coût total</dt><dd className="font-ks-display text-[22px] font-bold">{money(t.cabinet)} HT</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ks-soft">Par recrutement</dt><dd className="font-medium">{money(t.cabinetPerHire)} HT</dd></div>
              </dl>
              <p className="mt-5 text-[14px] leading-[1.55] text-ks-soft">Honoraires dus à chaque embauche, poste par poste.</p>
            </div>
          </div>
          <p className="mt-6 max-w-[780px] text-[14px] leading-[1.6] text-ks-subtle">
            Exemple indicatif. Le bon choix dépend de votre volume de postes : voir aussi notre{" "}
            <Link to={COMPARISON_PATH} className="underline underline-offset-2 hover:text-ks-ink">comparatif des acteurs du RPO en France</Link>.
          </p>
        </PageSection>

        {/* FAQ */}
        <PageSection title="Vos questions sur les tarifs">
          <div className="mt-8 max-w-[860px] divide-y divide-[rgba(20,19,18,0.08)] rounded-[24px] bg-white px-6 shadow-ks-card md:px-8">
            {questions.map((f) => (
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

        {/* Appel à l'action */}
        <PageSection title="Un budget précis pour votre besoin">
          <p className="mt-5 max-w-[780px] text-[16px] leading-[1.6] text-ks-soft">
            Décrivez vos postes, votre rythme et votre budget : un premier recruteur qualifié vous est présenté sous 48 h, avec son tarif.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Cta href={ROUTES.recruit} variant="studio" arrow>Partager un besoin</Cta>
            <Cta href={BOOKING_URL} variant="secondary">Réserver 30 minutes</Cta>
          </div>
        </PageSection>
      </article>
    </SiteLayout>
  );
}
