import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import Highlight from "@/components/site/Highlight";
import SmartLink from "@/components/site/SmartLink";
import PageSection from "@/components/site/PageSection";
import { Mail, Phone } from "lucide-react";
import { BoltWatermark } from "@/components/brand/Bolt";
import { PinkGlow } from "@/components/site/PinkGlow";
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

      {/* Contact : photo, coordonnées cliquables, prise de rendez-vous */}
      <section className="mx-auto mt-24 max-w-ks px-5 md:mt-32 md:px-8 xl:px-0">
        <div className="relative isolate grid items-center gap-10 overflow-hidden rounded-[36px] bg-ks-dark p-7 text-ks-dark-fg shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)] md:p-12 lg:grid-cols-[320px_1fr] lg:gap-14 lg:p-14">
          <PinkGlow className="-right-24 -top-24 h-[420px] w-[420px]" strength={0.4} />
          <BoltWatermark tone="light" className="-bottom-24 -right-10 h-[420px] w-auto rotate-[14deg]" />

          <figure className="relative mx-auto w-full max-w-[300px] lg:mx-0">
            {/* Cadre en dégradé de la charte autour de la photo */}
            <div className="rounded-[30px] p-[3px] ks-grad-bg">
              <img
                src="/team/alexandre-guego.jpg"
                alt="Alexandre Guégo, fondateur de Kistone"
                width={733}
                height={1100}
                loading="lazy"
                className="aspect-[4/5] w-full rounded-[27px] object-cover object-top"
              />
            </div>
            <figcaption className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ks-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)]">
              <span className="h-2 w-2 rounded-full ks-grad-bg" aria-hidden="true" />
              Fondateur de Kistone
            </figcaption>
          </figure>

          <div className="relative">
            <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] ks-grad-text">Votre contact</p>
            <h2 className="mt-3 font-ks-display text-[36px] font-bold leading-[1.02] tracking-[-0.045em] md:text-[52px]">Alexandre Guégo</h2>
            <p className="mt-6 max-w-[520px] font-ks-display text-[20px] font-semibold leading-[1.35] tracking-[-0.02em] md:text-[22px]">
              « Vous ouvrez la porte. Je qualifie le besoin et présente les profils. »
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              <li>
                <a href={`mailto:${EMAIL}?subject=${encodeURIComponent("Apport d'affaires")}`} className="group flex items-center gap-3.5 rounded-2xl border border-[rgba(245,241,234,0.12)] bg-[rgba(245,241,234,0.05)] px-4 py-3.5 transition-colors hover:bg-[rgba(245,241,234,0.1)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(245,241,234,0.1)]"><Mail className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block font-ks-mono text-[10px] uppercase tracking-[0.14em] text-ks-dark-muted">Email</span>
                    <span className="block truncate font-semibold">{EMAIL}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="group flex items-center gap-3.5 rounded-2xl border border-[rgba(245,241,234,0.12)] bg-[rgba(245,241,234,0.05)] px-4 py-3.5 transition-colors hover:bg-[rgba(245,241,234,0.1)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(245,241,234,0.1)]"><Phone className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block font-ks-mono text-[10px] uppercase tracking-[0.14em] text-ks-dark-muted">Téléphone</span>
                    <span className="block truncate font-semibold">{PHONE}</span>
                  </span>
                </a>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Cta href={BOOKING_URL} variant="studio-fill" size="lg" arrow>Réserver 30 minutes</Cta>
              <span className="text-[14px] text-ks-dark-muted">Un échange rapide pour présenter votre contact.</span>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
