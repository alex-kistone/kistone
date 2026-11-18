import SEO from "@/components/SEO";
import { FOUNDER_REF, ORG_REF, withIdentity } from "@/lib/structuredData";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import Highlight from "@/components/site/Highlight";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { BOOKING_URL, ROUTES } from "@/content/site";

/** Engagements tirés de la conviction d'Alex (texte de la page). */
const COMMITMENTS = [
  { title: "Un besoin bien cadré", desc: "Chaque besoin est cadré avec vous : les postes, le rythme, le budget." },
  { title: "Des réalisations, pas un CV", desc: "Chaque recruteur est évalué sur les recrutements qu'il a réellement menés." },
  { title: "Un profil en 48 h", desc: "Un premier profil qualifié vous est présenté sous 48 h." },
  { title: "L'administratif géré", desc: "Contrat, conformité, CRA et facturation sont pris en charge par Kistone." },
];

/** Ce que le modèle freelance change pour vos recrutements. */
const FREELANCE_MODEL = [
  { title: "Facturé au jour", desc: "Sans honoraires au placement : vous payez les jours réalisés." },
  { title: "À votre rythme", desc: "À temps plein ou quelques jours par semaine, selon vos postes ouverts." },
  { title: "Intégré à votre équipe", desc: "Vos outils, vos managers, votre marque employeur." },
];

/** /pourquoi-kistone : qui est Alex et la conviction qui fonde Kistone. */
export default function WhyKistone() {
  const jsonLd = withIdentity({
    "@type": "AboutPage",
    name: "Pourquoi Kistone",
    url: "https://kistone.fr/pourquoi-kistone",
    inLanguage: "fr-FR",
    mainEntity: ORG_REF,
    author: FOUNDER_REF,
  });

  return (
    <SiteLayout>
      <SEO
        title="Pourquoi Kistone : notre conviction"
        description="L'IA transforme la fonction recrutement : le RPO complète votre équipe de manière ponctuelle, et de nombreux recruteurs ont choisi le Freelance. La conviction de Kistone."
        path="/pourquoi-kistone"
        image="/og/pourquoi-kistone.png"
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
              L'IA est en train de transformer la <Highlight>fonction recrutement</Highlight>.
            </p>
            <p>
              Il n'est plus nécessaire d'avoir une armée de recruteurs en interne pour construire ses équipes. Le RPO permet de venir compléter l'équipe recrutement de manière ponctuelle et de nombreux recruteurs ont fait le choix du Freelance pour exercer leur métier.
            </p>
            <p>
              C'est la raison d'être de Kistone, le réseau de Freelance RPO : une communauté de 700+ recruteurs sélectionnés et qualifiés, spécialisés par métier, qui rejoignent vos équipes à temps plein ou quelques jours par semaine pour recruter en CDI. Chaque besoin est cadré avec vous, et un premier profil qualifié vous est présenté sous 48 h.
            </p>
            <p>Vous avez des recrutements à lancer ? Échangeons 30 minutes.</p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Cta href={BOOKING_URL} variant="studio" size="lg" arrow>Échangeons 30 minutes</Cta>
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
              Au fil des missions, un constat s'est imposé : un recruteur intégré à l'équipe, qui connaît le métier et travaille
              avec les managers, va plus loin qu'un prestataire extérieur, et laisse à l'entreprise le vivier et le process construits.
            </p>
            <p>
              Kistone est né de ce constat : réunir les meilleurs recruteurs freelance, les qualifier avec exigence et prendre en
              charge le contrat, la conformité et la facturation. Le RPO est notre métier, et nous nous y consacrons entièrement.
            </p>
          </div>
          <blockquote className="rounded-[28px] bg-ks-dark p-8 text-ks-dark-fg">
            <p className="font-ks-display text-[24px] font-semibold leading-[1.3] tracking-[-0.02em]">
              « Bien comprendre un besoin, évaluer un parcours au-delà du CV, et ne présenter que le bon profil, au bon moment. »
            </p>
            <footer className="mt-5 text-[14px] text-ks-dark-muted">Alexandre Guégo, fondateur de Kistone</footer>
          </blockquote>
        </div>
      </PageSection>

      {/* Le modèle freelance, mis en avant */}
      <PageSection title="Le freelance, le bon modèle pour recruter">
        <p className="mt-6 max-w-[760px] text-[18px] leading-[1.65] text-ks-ink-2">
          Vos besoins de recrutement varient avec votre croissance. Les recruteurs qui ont choisi le freelance enchaînent les
          missions, connaissent leur marché et s'adaptent vite à une nouvelle équipe. Vous accédez à cette expertise en quelques
          jours, au rythme dont vous avez besoin.
        </p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {FREELANCE_MODEL.map((m) => (
            <li key={m.title} className="flex h-full flex-col rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">{m.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{m.desc}</p>
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
