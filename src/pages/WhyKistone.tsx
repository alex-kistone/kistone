import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import Highlight from "@/components/site/Highlight";
import SmartLink from "@/components/site/SmartLink";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { CALENDLY_URL, ROUTES } from "@/content/site";
import { MODEL_PAGES, modelPath } from "@/content/models";

/** Engagements tirés de la conviction d'Alex (texte de la page). */
const COMMITMENTS = [
  { title: "Un référent métier", desc: "Chaque besoin est qualifié par un référent qui connaît la fonction." },
  { title: "Un parcours réel", desc: "Chaque profil est évalué sur son parcours réel, pas sur un CV." },
  { title: "Un profil en 48 h", desc: "Nous nous engageons à proposer un profil en 48 h." },
  { title: "Le bon format", desc: "Fractional, mission, intérim ou contract-to-hire, selon votre besoin." },
];

/** /pourquoi-kistone : qui est Alex et la conviction qui fonde Kistone. */
export default function WhyKistone() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Pourquoi Kistone",
    url: "https://kistone.fr/pourquoi-kistone",
    mainEntity: {
      "@type": "Organization",
      name: "Kistone",
      url: "https://kistone.fr",
      founder: { "@type": "Person", name: "Alexandre Guégo", image: "https://kistone.fr/team/alexandre-guego.jpg" },
    },
  };

  return (
    <SiteLayout>
      <SEO
        title="Pourquoi Kistone : notre conviction"
        description="Les dix dernières années ont installé le freelancing ; les prochaines installeront le fractional leadership. La conviction d'Alexandre Guégo, fondateur de Kistone."
        path="/pourquoi-kistone"
        jsonLd={jsonLd}
      />

      <section className="relative isolate mx-auto grid max-w-ks items-center gap-12 px-5 pt-12 md:px-8 md:pt-[72px] lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:px-0">
        <BoltWatermark strokeWidth={14} className="-right-28 -top-24 h-[680px] w-auto rotate-[14deg] md:h-[820px]" />
        <div>
          <span className="rounded-full bg-ks-dark px-3 py-1 font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-fg">Pourquoi Kistone</span>
          <h1 className="mt-6 font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[60px] lg:text-[68px]">
            Notre conviction chez <Highlight>Kistone</Highlight>
          </h1>
          <div className="mt-8 space-y-5 text-[19px] leading-[1.6] text-ks-ink-2 md:text-[21px]">
            <p className="font-ks-display text-[24px] font-semibold leading-[1.3] tracking-[-0.02em] text-ks-ink md:text-[28px]">
              Les dix dernières années ont installé le freelancing ; les prochaines installeront le fractional leadership comme un mode normal de construction des équipes de direction.
            </p>
            <p>
              C'est la raison d'être de Kistone, la plateforme freelance des Fractional leaders Tech &amp; Digital : des dirigeants RH, Finance, Sales &amp; Marketing, Tech, Data &amp; IA et Product pour les startups, scaleups et ETI. Chaque besoin est qualifié par un référent métier, chaque profil est évalué sur son parcours réel, et nous nous engageons à proposer un profil en 48h, en format fractional, mission, intérim ou contract-to-hire.
            </p>
            <p>Vous réfléchissez à renforcer votre comité de direction sans recruter à temps plein ? Échangeons 30 minutes.</p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Cta href={CALENDLY_URL} size="lg" arrow className="shadow-ks-pink">Échangeons 30 minutes</Cta>
            <Cta href={ROUTES.recruit} size="lg" variant="secondary">Partager un besoin</Cta>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-[460px]">
          <div className="overflow-hidden rounded-[32px] bg-white p-3 shadow-ks-card">
            <img src="/team/alexandre-guego.jpg" alt="Alexandre Guégo, fondateur de Kistone" width={733} height={1100} className="aspect-[4/5] w-full rounded-[24px] object-cover object-top" />
          </div>
          <figcaption className="absolute -bottom-6 left-6 right-6 rounded-[20px] bg-white px-5 py-4 shadow-[0_18px_40px_-20px_rgba(60,40,20,0.35)]">
            <p className="font-ks-display text-[20px] font-semibold tracking-[-0.02em]">Alexandre Guégo</p>
            <p className="text-[14px] text-ks-soft">Fondateur de Kistone</p>
          </figcaption>
        </figure>
      </section>

      <PageSection tag="Nos engagements" title="Ce qui fait la différence" bolt="-left-20 top-0 h-[320px] w-auto rotate-[-14deg]" className="md:mt-36">
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COMMITMENTS.map((c, i) => (
            <li key={c.title} className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">0{i + 1}</span>
              <h3 className="mt-3 font-ks-display text-[20px] font-semibold tracking-[-0.02em]">{c.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{c.desc}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[15px] text-ks-soft">
          Découvrir les modèles :{" "}
          {MODEL_PAGES.map((m, i) => (
            <span key={m.slug}>
              {i > 0 && " · "}
              <SmartLink href={modelPath(m)} className="font-medium text-ks-ink underline-offset-4 hover:underline">{m.name}</SmartLink>
            </span>
          ))}
        </p>
      </PageSection>

      <section className="mx-auto mt-24 max-w-ks px-5 md:mt-32 md:px-8 xl:px-0">
        <div className="relative isolate overflow-hidden rounded-[32px] bg-ks-dark px-7 py-12 text-ks-dark-fg md:px-14 md:py-16">
          <BoltWatermark tone="light" className="-bottom-24 -right-10 h-[420px] w-auto rotate-[14deg]" />
          <h2 className="max-w-[760px] font-ks-display text-[32px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[48px]">
            Renforcer votre comité de direction, sans recruter à temps plein.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={CALENDLY_URL} size="lg" arrow>Échangeons 30 minutes</Cta>
            <Cta href={ROUTES.freelance} size="lg" variant="ghost-dark">Je suis freelance</Cta>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
