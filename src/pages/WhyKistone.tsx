import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import Highlight from "@/components/site/Highlight";
import SmartLink from "@/components/site/SmartLink";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { CALENDLY_URL, ROUTES } from "@/content/site";
import { MODEL_PAGES, modelPath } from "@/content/models";
import { palettes } from "@/lib/palettes";

/** Engagements tirés de la conviction d'Alex (texte de la page). */
const COMMITMENTS = [
  { title: "Un référent IA", desc: "Chaque besoin est cadré par un référent qui connaît les métiers de l'IA." },
  { title: "Des réalisations, pas un CV", desc: "Chaque profil est évalué sur ce qu'il a construit et mis en production." },
  { title: "Un profil en 48 h", desc: "Un premier profil qualifié vous est présenté sous 48 h." },
  { title: "Le bon format", desc: "Mission freelance, fractional ou contract-to-hire, selon votre projet." },
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
        description="L'IA a totalement transformé la façon de travailler, et le freelance est le modèle pour accéder aux experts qui la maîtrisent. La conviction d'Alexandre Guégo, fondateur de Kistone, la plateforme freelance des experts IA."
        path="/pourquoi-kistone"
        jsonLd={jsonLd}
      />

      <section className="relative isolate mx-auto grid max-w-ks items-center gap-12 px-5 pt-12 md:px-8 md:pt-[72px] lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:px-0">
        <BoltWatermark strokeWidth={14} className="-right-28 -top-24 h-[680px] w-auto rotate-[14deg] md:h-[820px]" />
        <div>
          <h1 className="font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[60px] lg:text-[68px]">
            Notre conviction chez <Highlight>Kistone</Highlight>
          </h1>
          <div className="mt-8 space-y-5 text-[19px] leading-[1.6] text-ks-ink-2 md:text-[21px]">
            <p className="font-ks-display text-[24px] font-semibold leading-[1.3] tracking-[-0.02em] text-ks-ink md:text-[28px]">
              L'<Highlight>IA</Highlight> a totalement transformé la façon de travailler. Pour en tirer parti, il faut des experts qui la maîtrisent, maintenant : le freelance est le modèle qui vous y donne accès.
            </p>
            <p>
              C'est la raison d'être de Kistone, la plateforme freelance spécialiste des métiers de l'IA : des AI Engineers pour construire, des AI Product Managers pour faire adopter, des AI Leaders pour fixer le cap. Ils interviennent en mission freelance, en fractional ou en contract-to-hire ; et quand vient le moment d'internaliser, nos Tech recruiters vous aident à recruter vos talents IA en CDI. Chaque besoin est cadré par un référent IA, chaque profil est évalué sur ce qu'il a réellement construit, et nous nous engageons à vous présenter un premier profil qualifié en 48 h.
            </p>
            <p>Vous avez un projet IA à lancer ou à passer en production ? Échangeons 30 minutes.</p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Cta href={CALENDLY_URL} variant="studio" size="lg" arrow>Échangeons 30 minutes</Cta>
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

      {/* L'origine : le RPO */}
      <PageSection title="Tout a commencé par le recrutement" className="md:mt-36">
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-5 text-[18px] leading-[1.65] text-ks-ink-2">
            <p>
              Mon premier métier a été de mettre en relation des Freelance RPO avec les équipes RH de startups, scale-ups et ETI,
              un dispositif efficace qui allait porter leur croissance. Une expertise qui m'a appris l'essentiel : bien comprendre un besoin,
              évaluer un parcours au-delà du CV, et ne présenter que le bon profil, au bon moment.
            </p>
            <p>
              Au fil des missions, une même demande revenait. Après les recruteurs, il fallait un AI Engineer pour passer un
              prototype en production, un AI Product Manager pour lancer un copilote, un AI Leader pour bâtir une feuille de route :
              des compétences rares, que les équipes n'avaient pas encore en interne.
            </p>
            <p>
              Kistone est né de ce constat : appliquer aux métiers de l'IA l'exigence de qualification forgée dans le recrutement.
              Le RPO reste notre socle : nos Tech recruiters vous aident à internaliser vos talents IA en CDI, et le contract-to-hire
              permet à une mission de devenir un recrutement.
            </p>
          </div>
          <blockquote className="rounded-[28px] bg-ks-dark p-8 text-ks-dark-fg">
            <p className="font-ks-display text-[24px] font-semibold leading-[1.3] tracking-[-0.02em]">
              « Qualifier chaque besoin, connaître chaque profil, tenir chaque promesse : c'est tout ce qui compte. »
            </p>
            <footer className="mt-5 text-[14px] text-ks-dark-muted">Alexandre Guégo, fondateur de Kistone</footer>
          </blockquote>
        </div>
      </PageSection>

      {/* Le modèle freelance, mis en avant */}
      <PageSection title="Le freelance, le bon modèle pour l'IA">
        <p className="mt-6 max-w-[760px] text-[18px] leading-[1.65] text-ks-ink-2">
          Les modèles, les outils et les usages de l'IA évoluent en permanence. Les experts qui ont choisi le freelance enchaînent
          les projets, restent à la pointe et transmettent ce qu'ils savent à vos équipes. Vous accédez à cette expertise en
          quelques jours, au rythme dont votre projet a besoin.
        </p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {MODEL_PAGES.map((m) => (
            <li key={m.slug}>
              <SmartLink href={modelPath(m)} className="ks-lift flex h-full flex-col rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: palettes[m.palette].accent }} aria-hidden="true" />
                <h3 className="mt-4 font-ks-display text-[22px] font-semibold tracking-[-0.02em]">{m.name}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-[1.55] text-ks-soft">{m.short}</p>
                <span className="mt-5 text-[15px] font-medium text-ks-ink">Découvrir le modèle →</span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="Ce qui fait la différence" bolt="-left-20 top-0 h-[320px] w-auto rotate-[-14deg]">
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COMMITMENTS.map((c, i) => (
            <li key={c.title} className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">0{i + 1}</span>
              <h3 className="mt-3 font-ks-display text-[20px] font-semibold tracking-[-0.02em]">{c.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{c.desc}</p>
            </li>
          ))}
        </ul>
      </PageSection>

    </SiteLayout>
  );
}
