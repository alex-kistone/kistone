import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import SectionTag from "@/components/site/SectionTag";
import Cta from "@/components/site/Cta";
import SmartLink from "@/components/site/SmartLink";
import Highlight from "@/components/site/Highlight";
import { ROLE_PAGES, roleBySlug, rolePath, type RolePage as Role } from "@/content/roles";
import { ROUTES } from "@/content/site";
import { supabase } from "@/integrations/supabase/client";
import { palettes } from "@/lib/palettes";
import { rhythmLabel, verticalOf } from "@/lib/verticals";
import { cn } from "@/lib/utils";

const BASE_URL = "https://kistone.fr";
const MIN_SHOWN = 3;

type Shown = { name: string; job: string; xp: number | null; specialties: string[]; days: number | null; available: boolean; rating: number | null };

type Featured = {
  display_name: string; job_title: string | null; years_experience: number | null; specialties: string[] | null;
  weekly_capacity: number | null; available: boolean | null; availability_date: string | null; rating: number;
};

/** Derniers profils 4-5 étoiles de la fonction (anonymisés), complétés par des exemples. */
function useProfiles(role: Role): Shown[] {
  const samples: Shown[] = role.samples.map((s) => ({ ...s, rating: null }));
  const [real, setReal] = useState<Shown[]>([]);
  useEffect(() => {
    let alive = true;
    supabase.rpc("list_featured_freelances" as never, { _vertical: role.vertical, _limit: 4 } as never).then(({ data }) => {
      if (!alive || !Array.isArray(data)) return;
      setReal((data as Featured[]).map((f) => ({
        name: f.display_name,
        job: f.job_title || role.role,
        xp: f.years_experience,
        specialties: (f.specialties ?? []).slice(0, 3),
        days: f.weekly_capacity,
        available: f.available !== false,
        rating: f.rating,
      })));
    });
    return () => { alive = false; };
  }, [role.vertical, role.role]);
  return real.length >= MIN_SHOWN ? real : [...real, ...samples].slice(0, Math.max(MIN_SHOWN, real.length));
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5 text-[#E0A21B]" aria-label={`${n} étoiles sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
        </svg>
      ))}
    </span>
  );
}

function ProfileCard({ p, palette }: { p: Shown; palette: string }) {
  const tint = palettes[palette as keyof typeof palettes];
  const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <li className="flex flex-col gap-4 rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-5 shadow-ks-card">
      <div className="flex items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-ks-display text-[16px] font-semibold" style={{ background: tint.tint, color: tint.ink }} aria-hidden="true">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-ks-display text-[19px] font-semibold tracking-[-0.02em]">{p.name}</p>
          <p className="truncate text-[13px] text-ks-soft">{p.job}{p.xp ? ` · ${p.xp} ans` : ""}</p>
        </div>
        {p.rating ? <Stars n={p.rating} /> : <span className="rounded-full bg-ks-secondary px-2 py-0.5 text-[11px] text-ks-soft">Exemple</span>}
      </div>
      {p.specialties.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {p.specialties.map((s) => (
            <li key={s} className="rounded-full bg-[#F1ECE5] px-2.5 py-1 text-[12px] text-ks-ink-2">{s}</li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-[rgba(20,19,18,0.08)] pt-3 text-[13px]">
        <span className="font-semibold">{rhythmLabel(p.days)}</span>
        <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", p.available ? "bg-[#E8F5EE] text-[#17663F]" : "bg-ks-secondary text-ks-soft")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", p.available ? "bg-[#2F9A63]" : "bg-[#B8B0A4]")} aria-hidden="true" />
          {p.available ? "Disponible" : "Bientôt disponible"}
        </span>
      </div>
    </li>
  );
}

const Section = ({ id, tag, title, children, className }: { id?: string; tag: string; title: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={cn("mx-auto mt-24 max-w-ks scroll-mt-24 px-5 md:mt-32 md:px-8 xl:px-0", className)}>
    <SectionTag>{tag}</SectionTag>
    <h2 className="mt-5 max-w-[820px] font-ks-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[48px]">{title}</h2>
    {children}
  </section>
);

export default function RolePage() {
  const { slug } = useParams();
  const role = roleBySlug(slug);
  if (!role) return <Navigate to="/" replace />;
  return <RoleContent key={role.slug} role={role} />;
}

function RoleContent({ role }: { role: Role }) {
  const v = verticalOf(role.vertical);
  const profiles = useProfiles(role);
  const needHref = `${ROUTES.recruit}?fonction=${role.vertical}`;
  const url = `${BASE_URL}${rolePath(role)}`;

  const figures = [
    { value: "48 h", label: "pour un premier profil présélectionné" },
    { value: "1 sem.", label: "pour démarrer la mission" },
    { value: "1 à 5 j", label: "par semaine, ajustables" },
    { value: `${role.rate[0]}–${role.rate[1]} €`, label: "TJM indicatif HT" },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: role.seoTitle,
      serviceType: role.role,
      description: role.seoDescription,
      url,
      areaServed: "FR",
      provider: { "@type": "Organization", name: "Kistone", url: BASE_URL },
      offers: { "@type": "Offer", priceCurrency: "EUR", priceSpecification: { "@type": "UnitPriceSpecification", minPrice: role.rate[0], maxPrice: role.rate[1], priceCurrency: "EUR", unitText: "jour" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: role.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Kistone", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: role.role, item: url },
      ],
    },
  ];

  return (
    <SiteLayout>
      <SEO title={role.seoTitle} description={role.seoDescription} path={rolePath(role)} jsonLd={jsonLd} />

      {/* Promesse */}
      <section className="mx-auto max-w-ks px-5 pt-12 md:px-8 md:pt-[72px] xl:px-0">
        <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: palettes[v.palette].tint, color: palettes[v.palette].ink }}>
          {v.roles}
        </span>
        <h1 className="mt-6 max-w-[900px] font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[64px] lg:text-[76px]">
          {role.h1.split(v.short).flatMap((part, i) => (i === 0 ? [part] : [<Highlight key={i}>{v.short}</Highlight>, part]))}
        </h1>
        <p className="mt-6 max-w-[760px] text-lg leading-[1.5] text-ks-soft md:text-xl">{role.lead}</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Cta href={needHref} size="lg" arrow className="shadow-ks-pink">Partager mon besoin {v.short}</Cta>
          <Cta href="#profils" size="lg" variant="secondary">Voir les profils</Cta>
        </div>
      </section>

      {/* Profils récents */}
      <Section id="profils" tag="Profils récents" title={`Des ${role.role.replace(/ (fractional|freelance)$/, "")} vérifiés, prêts à démarrer`}>
        <p className="mt-4 max-w-[680px] text-[17px] leading-[1.55] text-ks-soft">
          Derniers profils inscrits sur Kistone, notés 4 ou 5 étoiles après entretien. Identités complètes communiquées lors de la mise en relation.
        </p>
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => <ProfileCard key={p.name} p={p} palette={v.palette} />)}
        </ul>
        <div className="mt-8">
          <Cta href={needHref} arrow>Recevoir des profils {v.short}</Cta>
        </div>
      </Section>

      {/* Chiffres clés */}
      <Section tag="Chiffres clés" title="Un dirigeant senior, avec la flexibilité du freelance">
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="rounded-[24px] bg-white p-6 shadow-ks-card">
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-ks-display text-[34px] font-bold tracking-[-0.04em] md:text-[40px]">{f.value}</dd>
              <dd className="mt-1 text-[15px] text-ks-soft">{f.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Quand recruter */}
      <Section tag="Quand recruter" title={`Quand faire appel à un ${role.role} ?`}>
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {role.when.map((w, i) => (
            <li key={w.title} className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
              <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">0{i + 1}</span>
              <h3 className="mt-3 font-ks-display text-[21px] font-semibold tracking-[-0.02em]">{w.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ks-soft">{w.desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Définition et fiche de poste */}
      <Section tag="Fiche de poste" title={`${role.role} : définition et fiche de poste`}>
        <div className="mt-8 max-w-[820px] space-y-4 text-[17px] leading-[1.65] text-ks-ink-2">
          {role.definition.map((p) => <p key={p}>{p}</p>)}
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[24px] bg-white p-7 shadow-ks-card">
            <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">Missions</h3>
            <ul className="mt-4 space-y-2.5 text-[15px] leading-[1.55] text-ks-ink-2">
              {role.missions.map((m) => (
                <li key={m} className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ks-pink" aria-hidden="true" />{m}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] bg-white p-7 shadow-ks-card">
            <h3 className="font-ks-display text-[22px] font-semibold tracking-[-0.02em]">Compétences clés</h3>
            <ul className="mt-4 space-y-2.5 text-[15px] leading-[1.55] text-ks-ink-2">
              {role.skills.map((m) => (
                <li key={m} className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ks-pink" aria-hidden="true" />{m}</li>
              ))}
            </ul>
            <h3 className="mt-7 font-ks-display text-[22px] font-semibold tracking-[-0.02em]">Profil type</h3>
            <p className="mt-3 text-[15px] leading-[1.55] text-ks-ink-2">{role.profile}</p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section tag="Questions fréquentes" title={`Tout savoir sur le ${role.role}`}>
        <div className="mt-8 max-w-[860px] divide-y divide-[rgba(20,19,18,0.08)] rounded-[24px] bg-white px-6 shadow-ks-card md:px-8">
          {role.faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-ks-display text-[18px] font-semibold tracking-[-0.01em]">
                {f.q}
                <span className="text-ks-pink transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-[1.6] text-ks-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Appel final et autres fonctions */}
      <section className="mx-auto mt-24 max-w-ks px-5 md:mt-32 md:px-8 xl:px-0">
        <div className="rounded-[32px] bg-ks-dark px-7 py-12 text-ks-dark-fg md:px-14 md:py-16">
          <h2 className="max-w-[720px] font-ks-display text-[32px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[48px]">
            Votre {role.role} en quelques jours, pas en quelques mois.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={needHref} size="lg" arrow>Partager mon besoin {v.short}</Cta>
            <Cta href={ROUTES.freelance} size="lg" variant="ghost-dark">Je suis {role.role.split(" ")[0]} freelance</Cta>
          </div>
          <nav aria-label="Autres fonctions" className="mt-12 border-t border-[rgba(245,241,234,0.12)] pt-6">
            <p className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-dark-muted">Autres fonctions</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {ROLE_PAGES.filter((r) => r.slug !== role.slug).map((r) => (
                <li key={r.slug}>
                  <SmartLink href={rolePath(r)} className="inline-flex h-9 items-center rounded-full border border-[rgba(245,241,234,0.22)] px-4 text-sm hover:bg-[rgba(245,241,234,0.08)]">
                    {r.role}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </SiteLayout>
  );
}
