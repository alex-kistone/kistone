import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import Highlight from "@/components/site/Highlight";
import SmartLink from "@/components/site/SmartLink";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { BOOKING_URL } from "@/content/site";
import { RPO_ROLE_PAGES, rolePath } from "@/content/roles";

/** Commission par mission pourvue (programme d'apport d'affaires d'Alex). */
const COMMISSION = "1 500 €";
const EMAIL = "aguego@kistone.fr";
const PHONE = "+33 7 78 31 11 62";

const STEPS = [
  "Vous nous mettez en relation avec le bon interlocuteur.",
  "Je qualifie le besoin et présente les profils.",
  `La mission démarre : vous touchez ${COMMISSION}.`,
];

const WAYS = [
  { title: "Un email avec moi en copie", desc: "Vous présentez Kistone à votre contact et me mettez en copie. Je prends le relais." },
  { title: "Mes coordonnées partagées", desc: "Vous transmettez mon numéro ou mon email à la personne qui a un besoin." },
  { title: "Un appel « de votre part »", desc: "Votre contact m'appelle en citant votre nom." },
];

/**
 * /apport-affaires : le programme d'apport d'affaires (PDF « Kistone-Programme-Apporteur-Affaires »),
 * repris pour le RPO. Lien dans le pied de page seulement.
 */
export default function ReferralPage() {
  return (
    <SiteLayout>
      <SEO
        title="Programme d'apport d'affaires"
        description={`Vous connaissez une entreprise qui cherche un recruteur freelance ? Présentez-nous : si la mission est pourvue, vous touchez ${COMMISSION}.`}
        path="/apport-affaires"
      />

      {/* Promesse et commission */}
      <section className="relative isolate mx-auto grid max-w-ks items-center gap-10 px-5 pt-12 md:px-8 md:pt-[72px] lg:grid-cols-[1.2fr_1fr] lg:gap-14 xl:px-0">
        <BoltWatermark strokeWidth={14} className="-right-24 -top-24 h-[640px] w-auto rotate-[14deg] md:h-[760px]" />
        <div>
          <h1 className="font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[60px] lg:text-[68px]">
            Programme <Highlight>d'apport d'affaires</Highlight>
          </h1>
          <p className="mt-6 max-w-[620px] text-lg leading-[1.5] text-ks-soft md:text-xl">
            Vous connaissez une entreprise qui cherche un recruteur freelance ? Présentez-nous. Si la mission est pourvue, vous touchez {COMMISSION}.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Cta href={`mailto:${EMAIL}?subject=${encodeURIComponent("Apport d'affaires")}`} variant="studio" size="lg" arrow>Recommander une entreprise</Cta>
            <Cta href={BOOKING_URL} size="lg" variant="secondary">Échanger 30 minutes</Cta>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[28px] bg-ks-dark p-8 text-ks-dark-fg shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)] md:p-10">
          <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">Votre commission</p>
          <p className="mt-4 font-ks-display text-[64px] font-bold leading-none tracking-[-0.05em] md:text-[80px]">{COMMISSION}</p>
          <p className="mt-3 text-[17px] text-ks-dark-fg">Pour chaque mission que nous remplissons grâce à vous.</p>
          <p className="mt-6 border-t border-[rgba(245,241,234,0.12)] pt-5 text-[15px] text-ks-dark-muted">Une recommandation, une mission pourvue : c'est tout ce qu'il faut.</p>
        </div>
      </section>

      {/* Le principe */}
      <PageSection title="Vous ouvrez la porte. On s'occupe du reste.">
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">Étape 0{i + 1}</span>
              <p className="mt-3 text-[17px] leading-[1.5] text-ks-ink-2">{s}</p>
            </li>
          ))}
        </ol>
      </PageSection>

      {/* Les façons de recommander */}
      <PageSection title="Trois façons de me recommander" bolt="-left-20 top-0 h-[320px] w-auto rotate-[-14deg]">
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {WAYS.map((w, i) => (
            <li key={w.title} className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">0{i + 1}</span>
              <h3 className="mt-3 font-ks-display text-[21px] font-semibold tracking-[-0.02em]">{w.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{w.desc}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* Les missions concernées : les fiches RPO */}
      <PageSection title="Les missions qui comptent">
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RPO_ROLE_PAGES.map((r) => (
            <li key={r.slug}>
              <SmartLink href={rolePath(r)} className="ks-lift flex h-full flex-col gap-1.5 rounded-[22px] border border-[rgba(20,19,18,0.06)] bg-white p-5 shadow-ks-card">
                <span className="font-ks-display text-[19px] font-semibold tracking-[-0.02em]">{r.role}</span>
                <span className="text-[14px] leading-[1.45] text-ks-soft">{r.eyebrow}</span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* Contact */}
      <section className="mx-auto mt-24 max-w-ks px-5 md:mt-32 md:px-8 xl:px-0">
        <div className="relative isolate overflow-hidden rounded-[32px] bg-ks-dark px-7 py-12 text-ks-dark-fg md:px-14 md:py-16">
          <BoltWatermark tone="light" className="-bottom-24 -right-10 h-[420px] w-auto rotate-[14deg]" />
          <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Votre contact</p>
          <h2 className="mt-3 font-ks-display text-[32px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[44px]">Alexandre Guégo</h2>
          <p className="mt-1 text-ks-dark-muted">Fondateur de Kistone</p>
          <dl className="mt-8 grid gap-5 text-[16px] sm:grid-cols-2">
            <div>
              <dt className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Email</dt>
              <dd className="mt-1"><a href={`mailto:${EMAIL}`} className="font-semibold hover:underline">{EMAIL}</a></dd>
            </div>
            <div>
              <dt className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Téléphone</dt>
              <dd className="mt-1"><a href={`tel:${PHONE.replace(/\s/g, "")}`} className="font-semibold hover:underline">{PHONE}</a></dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={BOOKING_URL} size="lg" arrow>Réserver 30 minutes</Cta>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
