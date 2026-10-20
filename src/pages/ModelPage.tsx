import { Navigate, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import SmartLink from "@/components/site/SmartLink";
import Highlight from "@/components/site/Highlight";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { LEGACY_MODEL_SLUGS, MODEL_PAGES, modelBySlug, modelPath, type ModelPage as Model } from "@/content/models";
import { ROLE_PAGES, rolePath } from "@/content/roles";
import { CALENDLY_URL, ROUTES } from "@/content/site";
import { palettes } from "@/lib/palettes";

const BASE_URL = "https://kistone.fr";

export default function ModelPage() {
  const { slug } = useParams();
  const model = modelBySlug(slug);
  if (!model) {
    const legacy = slug ? LEGACY_MODEL_SLUGS[slug] : undefined;
    return <Navigate to={legacy ? modelPath({ slug: legacy }) : "/"} replace />;
  }
  return <ModelContent key={model.slug} model={model} />;
}

const Dot = () => <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ks-pink" aria-hidden="true" />;

function ModelContent({ model }: { model: Model }) {
  const p = palettes[model.palette];
  const url = `${BASE_URL}${modelPath(model)}`;
  const others = MODEL_PAGES.filter((m) => m.slug !== model.slug);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: model.seoTitle,
      description: model.seoDescription,
      url,
      areaServed: "FR",
      provider: { "@type": "Organization", name: "Kistone", url: BASE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: model.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <SiteLayout>
      <SEO title={model.seoTitle} description={model.seoDescription} path={modelPath(model)} image="/og/modeles.png" jsonLd={jsonLd} />

      {/* Promesse */}
      <section className="relative isolate mx-auto max-w-ks px-5 pt-12 md:px-8 md:pt-[72px] xl:px-0">
        <BoltWatermark strokeWidth={14} className="-right-24 -top-24 h-[620px] w-auto rotate-[14deg] md:h-[760px]" />
        <p className="text-[15px] font-semibold" style={{ color: p.ink }}>Modèle d'intervention</p>
        <h1 className="mt-3 max-w-[900px] font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[64px] lg:text-[76px]">
          {model.h1.split(model.highlight).flatMap((part, i) => (i === 0 ? [part] : [<Highlight key={i}>{model.highlight}</Highlight>, part]))}
        </h1>
        <p className="mt-6 max-w-[760px] text-lg leading-[1.5] text-ks-soft md:text-xl">{model.lead}</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Cta href={ROUTES.recruit} variant="studio" size="lg" arrow>Partager un besoin</Cta>
          <Cta href={CALENDLY_URL} size="lg" variant="secondary">En parler 30 min</Cta>
        </div>
        <dl className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {model.facts.map((f) => (
            <div key={f.label} className="rounded-[24px] bg-white p-6 shadow-ks-card">
              <dt className="text-[14px] text-ks-soft">{f.label}</dt>
              <dd className="mt-1 font-ks-display text-[28px] font-bold tracking-[-0.03em]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Définition */}
      <PageSection title={`${model.name} : de quoi parle-t-on ?`} bolt="-left-24 top-10 h-[300px] w-auto rotate-[-16deg]">
        <div className="mt-8 max-w-[820px] space-y-4 text-[17px] leading-[1.65] text-ks-ink-2">
          {model.definition.map((d) => <p key={d}>{d}</p>)}
        </div>
      </PageSection>

      {/* Fonctionnement */}
      <PageSection title="Comment ça se passe avec Kistone">
        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {model.steps.map((s, i) => (
            <li key={s.title} className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">Étape 0{i + 1}</span>
              <h3 className="mt-3 font-ks-display text-[20px] font-semibold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{s.desc}</p>
            </li>
          ))}
        </ol>
      </PageSection>

      {/* Situations */}
      <PageSection title="Dans quelles situations ?" bolt="-right-16 top-0 h-[460px] w-auto rotate-[12deg]">
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {model.situations.map((s) => (
            <li key={s.title} className="rounded-[24px] p-6" style={{ background: p.soft }}>
              <h3 className="font-ks-display text-[20px] font-semibold tracking-[-0.02em]" style={{ color: p.ink }}>{s.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-ink-2">{s.desc}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* Ce que ça change */}
      <PageSection title="Ce que ça change pour vous">
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[24px] bg-white p-7 shadow-ks-card">
            <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">Les bénéfices</h3>
            <ul className="mt-4 space-y-2.5 text-[15px] leading-[1.55] text-ks-ink-2">
              {model.benefits.map((b) => <li key={b} className="flex gap-2.5"><Dot />{b}</li>)}
            </ul>
          </div>
          <div className="rounded-[24px] bg-white p-7 shadow-ks-card">
            <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">Nos conseils pour réussir</h3>
            <ul className="mt-4 space-y-2.5 text-[15px] leading-[1.55] text-ks-ink-2">
              {model.watchouts.map((b) => <li key={b} className="flex gap-2.5"><Dot />{b}</li>)}
            </ul>
          </div>
        </div>
      </PageSection>

      {/* Comparaison */}
      <PageSection title="Les trois modèles en un coup d'œil">
        <div className="mt-10 overflow-x-auto rounded-[24px] bg-white shadow-ks-card">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-[rgba(20,19,18,0.08)]">
                <th className="px-6 py-4 font-medium text-ks-soft" />
                {MODEL_PAGES.map((m) => (
                  <th key={m.slug} className={m.slug === model.slug ? "px-6 py-4 font-ks-display text-[17px] font-semibold text-ks-ink" : "px-6 py-4 font-ks-display text-[17px] font-semibold text-ks-soft"}>
                    {m.slug === model.slug ? m.name : <SmartLink href={modelPath(m)} className="hover:text-ks-ink hover:underline">{m.name}</SmartLink>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.facts.map((f, i) => (
                <tr key={f.label} className="border-b border-[rgba(20,19,18,0.06)] last:border-0">
                  <td className="px-6 py-4 text-ks-soft">{f.label}</td>
                  {MODEL_PAGES.map((m) => (
                    <td key={m.slug} className={m.slug === model.slug ? "px-6 py-4 font-semibold" : "px-6 py-4"}>{m.facts[i]?.value ?? "—"}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-6 py-4 text-ks-soft">Pour</td>
                {MODEL_PAGES.map((m) => <td key={m.slug} className={m.slug === model.slug ? "px-6 py-4 font-semibold" : "px-6 py-4"}>{m.short}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </PageSection>

      {/* FAQ */}
      <PageSection title={`Tout savoir sur le modèle ${model.name}`} bolt="-left-10 bottom-0 h-[220px] w-auto rotate-[20deg]">
        <div className="mt-8 max-w-[860px] divide-y divide-[rgba(20,19,18,0.08)] rounded-[24px] bg-white px-6 shadow-ks-card md:px-8">
          {model.faq.map((f) => (
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

      {/* Appel final */}
      <section className="mx-auto mt-24 max-w-ks px-5 md:mt-32 md:px-8 xl:px-0">
        <div className="rounded-[32px] bg-ks-dark px-7 py-12 text-ks-dark-fg md:px-14 md:py-16">
          <h2 className="max-w-[720px] font-ks-display text-[32px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[48px]">
            Le bon expert IA, au bon rythme.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={ROUTES.recruit} size="lg" arrow>Partager un besoin</Cta>
            {others.map((m) => <Cta key={m.slug} href={modelPath(m)} size="lg" variant="ghost-dark">Modèle {m.name}</Cta>)}
          </div>
          <nav aria-label="Métiers" className="mt-12 border-t border-[rgba(245,241,234,0.12)] pt-6">
            <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Les métiers</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {ROLE_PAGES.map((r) => (
                <li key={r.slug}>
                  <SmartLink href={rolePath(r)} className="inline-flex h-9 items-center rounded-full border border-[rgba(245,241,234,0.22)] px-4 text-sm hover:bg-[rgba(245,241,234,0.08)]">{r.role}</SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </SiteLayout>
  );
}
