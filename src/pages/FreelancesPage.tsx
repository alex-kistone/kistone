import type { ReactNode } from "react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import SmartLink from "@/components/site/SmartLink";
import Highlight from "@/components/site/Highlight";
import PageSection from "@/components/site/PageSection";
import { BoltWatermark } from "@/components/brand/Bolt";
import { FREELANCE_SPACE } from "@/content/home";
import { MODEL_PAGES, modelPath } from "@/content/models";
import { ROLE_PAGES, rolePath } from "@/content/roles";
import { palettes, type PaletteName } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

const JOIN = "/register?mode=signup";
const LOGIN = "/register";

/** Contenu de l'espace freelance : ce que fait réellement la plateforme, sans promesse chiffrée inventée. */
const BENEFITS: { tag: string; title: string; text: string; palette: PaletteName; visual: () => ReactNode }[] = [
  {
    tag: "Opportunités",
    title: "Des missions qui vous ressemblent",
    text: "Fini les sollicitations au hasard. Vous recevez des besoins qualifiés dans votre fonction et vos spécialités, avec le contexte, le rythme, le lieu et le budget dès le départ. Vous vous positionnez en un clic sur ceux qui vous intéressent.",
    palette: "sage",
    visual: () => (
      <ul className="flex w-full flex-col gap-2">
        {[
          { t: "Fractional CFO · Scale-up SaaS", m: "2 j / sem · Paris hybride" },
          { t: "Fractional DRH · PME industrielle", m: "3 j / sem · Lyon" },
          { t: "RPO Tech · 5 développeurs", m: "Temps plein · Remote" },
        ].map((o) => (
          <li key={o.t} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-[0_8px_20px_-14px_rgba(60,40,20,0.35)]">
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">{o.t}</span>
              <span className="block truncate text-[12px] text-ks-subtle">{o.m}</span>
            </span>
            <span className="shrink-0 rounded-full bg-ks-pink px-3 py-1 text-[12px] font-semibold text-white">Me positionner</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    tag: "Rémunération",
    title: "Votre TJM, intégralement",
    text: "Vous fixez votre tarif journalier. La rémunération de Kistone est facturée en plus au client : votre TJM n'est jamais réduit, et l'inscription est gratuite.",
    palette: "lilac",
    visual: () => (
      <div className="w-full rounded-2xl bg-white p-5 shadow-[0_8px_20px_-14px_rgba(60,40,20,0.35)]">
        <p className="text-[13px] text-ks-subtle">Votre TJM</p>
        <p className="mt-1 font-ks-display text-[40px] font-bold tracking-[-0.04em]">1 000 €<span className="text-[16px] font-medium text-ks-subtle"> HT / jour</span></p>
        <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#17663F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2F9A63]" aria-hidden="true" />
          Versé en totalité, sans commission prélevée
        </p>
      </div>
    ),
  },
  {
    tag: "Rythme",
    title: "Le rythme que vous choisissez",
    text: "Quelques jours par semaine auprès de plusieurs entreprises, une mission à temps plein le temps d'une période clé, ou une mission qui peut déboucher sur un recrutement : vous indiquez votre capacité, on vous propose ce qui s'y accorde.",
    palette: "apricot",
    visual: () => (
      <div className="flex w-full flex-col gap-2">
        {MODEL_PAGES.map((m) => (
          <SmartLink key={m.slug} href={modelPath(m)} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-[0_8px_20px_-14px_rgba(60,40,20,0.35)] hover:bg-ks-bg">
            <span className="text-[14px] font-semibold">{m.name}</span>
            <span className="truncate text-[12px] text-ks-subtle">{m.facts[0]?.value}</span>
          </SmartLink>
        ))}
      </div>
    ),
  },
  {
    tag: "Administratif",
    title: "Zéro paperasse, une seule facture",
    text: "Contrat de mission, conformité, compte rendu d'activité mensuel, facturation : tout se passe dans votre espace. Le client valide votre CRA, vous déposez votre facture, Kistone s'occupe du reste.",
    palette: "blue",
    visual: () => (
      <div className="w-full rounded-2xl bg-white p-4 text-[13px] shadow-[0_8px_20px_-14px_rgba(60,40,20,0.35)]">
        <div className="flex justify-between border-b border-[rgba(20,19,18,0.06)] pb-2.5">
          <span className="font-semibold">Mon espace freelance</span>
          <span className="text-ks-subtle">Octobre</span>
        </div>
        {FREELANCE_SPACE.map((row) => (
          <div key={row.label} className="flex min-h-[44px] items-center justify-between gap-3 border-b border-[rgba(20,19,18,0.05)] py-1.5 last:border-0">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: row.bg, color: row.fg }}>{row.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Accompagnement",
    title: "Une équipe, pas seulement une plateforme",
    text: "Un entretien de qualification à l'arrivée, une mise en relation préparée avec le client, un interlocuteur joignable pendant toute la mission. Vous vous concentrez sur votre expertise.",
    palette: "sand",
    visual: () => (
      <div className="w-full rounded-2xl bg-white p-5 shadow-[0_8px_20px_-14px_rgba(60,40,20,0.35)]">
        <p className="text-[13px] text-ks-subtle">Prochaine étape</p>
        <p className="mt-1 font-ks-display text-[20px] font-semibold tracking-[-0.02em]">Appel de présentation avec le client</p>
        <p className="mt-2 text-[13px] text-ks-soft">Jeudi · 10 h 00 · préparé avec l'équipe Kistone</p>
      </div>
    ),
  },
];

const STEPS = [
  { title: "Créez votre profil", desc: "Connexion LinkedIn, puis votre fonction, vos spécialités, votre rythme et votre TJM. Une dizaine de minutes." },
  { title: "Entretien de qualification", desc: "Un échange avec l'équipe Kistone pour comprendre votre parcours, vos réussites et le type de missions que vous cherchez." },
  { title: "Recevez des missions", desc: "Les besoins qui correspondent à votre profil arrivent dans « Mes opportunités ». Vous vous positionnez, on prépare la rencontre." },
  { title: "Démarrez sereinement", desc: "Contrat, dossier administratif, CRA et facturation dans votre espace : vous vous concentrez sur la mission." },
];

const CRITERIA = [
  "Au moins 10 ans d'expérience pour les fonctions de direction (5 ans pour le recrutement RPO)",
  "Des réussites concrètes en startup, scale-up ou PME en croissance",
  "Une structure juridique pour facturer (société ou micro-entreprise)",
  "L'envie de travailler en proximité avec les dirigeants, au sein de leurs équipes",
];

const FAQ = [
  { q: "L'inscription est-elle payante ?", a: "Non. L'inscription et l'utilisation de l'espace freelance sont gratuites. Kistone se rémunère par une marge facturée au client, en plus de votre TJM." },
  { q: "Qui fixe le TJM ?", a: "Vous. Vous indiquez votre tarif journalier dans votre profil ; il peut être ajusté d'un commun accord selon la mission." },
  { q: "Quelles fonctions recherchez-vous ?", a: "RPO, DRH, CFO, COO, CRO, CTO, CPO et CDO, à temps partagé, à temps plein ou en contract-to-hire." },
  { q: "Quels documents faut-il fournir ?", a: "Avant la première mission : vos informations de société (SIRET), une attestation URSSAF, une assurance responsabilité civile professionnelle et un RIB. Tout se dépose dans votre espace." },
  { q: "Comment suis-je payé ?", a: "Chaque mois, le client valide votre compte rendu d'activité ; vous déposez votre facture dans votre espace et Kistone la règle, sans relance de votre part." },
];

export default function FreelancesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <SiteLayout>
      <SEO
        title="Espace freelance : rejoignez la communauté Kistone"
        description="Dirigeants et recruteurs freelance (RPO, DRH, CFO, COO, CRO, CTO, CPO, CDO) : missions qualifiées, TJM intégral, rythme au choix, administratif et facturation gérés. Inscription gratuite."
        path="/freelances"
        jsonLd={jsonLd}
      />

      {/* Promesse */}
      <section className="relative isolate mx-auto grid max-w-ks items-center gap-12 px-5 pt-12 md:px-8 md:pt-[72px] lg:grid-cols-[1.1fr_1fr] xl:px-0">
        <BoltWatermark strokeWidth={14} className="-right-24 -top-24 h-[640px] w-auto rotate-[14deg] md:h-[760px]" />
        <div>
          <span className="rounded-full bg-ks-dark px-3 py-1 font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-fg">Espace freelance</span>
          <h1 className="mt-6 font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[60px] lg:text-[68px]">
            Rejoignez la communauté des <Highlight>Fractional Leaders</Highlight>
          </h1>
          <p className="mt-6 max-w-[620px] text-lg leading-[1.5] text-ks-soft md:text-xl">
            Des missions de direction et de recrutement qualifiées, au rythme que vous choisissez. Votre TJM, intégralement. L'administratif, on s'en occupe.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Cta href={JOIN} size="lg" arrow className="shadow-ks-pink">Rejoindre Kistone</Cta>
            <Cta href={LOGIN} size="lg" variant="secondary">Se connecter</Cta>
          </div>
          <p className="mt-4 text-sm text-ks-subtle">Inscription gratuite · Aucune commission sur votre TJM</p>
        </div>
        <div className="rounded-[28px] p-5" style={{ background: palettes.blue.tint }} aria-hidden="true">
          {BENEFITS[3].visual()}
        </div>
      </section>

      {/* Bénéfices */}
      <div className="mx-auto mt-24 flex max-w-ks flex-col gap-6 px-5 md:mt-32 md:px-8 xl:px-0">
        {BENEFITS.map((b, i) => {
          const p = palettes[b.palette];
          return (
            <section key={b.tag} className="grid items-center gap-8 rounded-[32px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card md:p-10 lg:grid-cols-2 lg:gap-14">
              <div className={i % 2 ? "lg:order-2" : ""}>
                <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: p.accent }}>{b.tag}</span>
                <h2 className="mt-3 font-ks-display text-[30px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[40px]">{b.title}</h2>
                <p className="mt-4 text-[17px] leading-[1.6] text-ks-soft">{b.text}</p>
                <div className="mt-6"><Cta href={JOIN} arrow>Je rejoins Kistone</Cta></div>
              </div>
              <div className="flex min-h-[240px] items-center rounded-[24px] p-5 md:p-8" style={{ background: p.tint }} aria-hidden="true">
                {b.visual()}
              </div>
            </section>
          );
        })}
      </div>

      {/* Fonctions */}
      <PageSection tag="Fonctions" title="Les fonctions que nous recherchons" bolt="-left-20 top-0 h-[320px] w-auto rotate-[-14deg]">
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_PAGES.map((r) => {
            const v = verticalOf(r.vertical);
            const p = palettes[v.palette];
            return (
              <li key={r.slug}>
                <SmartLink href={rolePath(r)} className="ks-lift flex h-full flex-col gap-1.5 rounded-[22px] p-5" style={{ background: p.tint }}>
                  <span className="font-ks-display text-[20px] font-semibold tracking-[-0.02em]" style={{ color: p.ink }}>{r.role}</span>
                  <span className="text-[14px] leading-[1.45] text-ks-ink-2">{v.description}</span>
                </SmartLink>
              </li>
            );
          })}
        </ul>
      </PageSection>

      {/* Comment rejoindre */}
      <PageSection tag="Comment ça marche" title="Rejoindre Kistone en quatre étapes">
        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">Étape 0{i + 1}</span>
              <h3 className="mt-3 font-ks-display text-[20px] font-semibold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{s.desc}</p>
            </li>
          ))}
        </ol>
      </PageSection>

      {/* Profil recherché */}
      <PageSection tag="Profil" title="Les profils que nous accompagnons" bolt="-right-16 top-0 h-[380px] w-auto rotate-[12deg]">
        <ul className="mt-8 grid max-w-[900px] gap-3 md:grid-cols-2">
          {CRITERIA.map((c) => (
            <li key={c} className="flex gap-3 rounded-[20px] bg-white p-5 text-[15px] leading-[1.55] text-ks-ink-2 shadow-ks-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF2E6E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              {c}
            </li>
          ))}
        </ul>
      </PageSection>

      {/* FAQ */}
      <PageSection tag="Questions fréquentes" title="Vos questions de freelance">
        <div className="mt-8 max-w-[860px] divide-y divide-[rgba(20,19,18,0.08)] rounded-[24px] bg-white px-6 shadow-ks-card md:px-8">
          {FAQ.map((f) => (
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
        <div className="relative isolate overflow-hidden rounded-[32px] bg-ks-dark px-7 py-12 text-ks-dark-fg md:px-14 md:py-16">
          <BoltWatermark tone="light" className="-bottom-24 -right-10 h-[420px] w-auto rotate-[14deg]" />
          <h2 className="max-w-[720px] font-ks-display text-[32px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[48px]">
            Votre prochaine mission commence ici.
          </h2>
          <p className="mt-4 max-w-[560px] text-ks-dark-muted">Créez votre profil en quelques minutes : l'équipe Kistone revient vers vous pour un entretien de qualification.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={JOIN} size="lg" arrow>Rejoindre Kistone</Cta>
            <Cta href={LOGIN} size="lg" variant="ghost-dark">Se connecter</Cta>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
