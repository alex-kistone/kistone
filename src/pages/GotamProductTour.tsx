import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, Users, ShieldCheck, Wallet,
  LineChart, Target, GitBranch, Eye, CheckCircle2,
} from 'lucide-react';
import KistoneHeader from '@/components/KistoneHeader';
import SEO from '@/components/SEO';
import StudioOnboardingDialog from '@/components/studio/StudioOnboardingDialog';
import equipeTaAsset from '@/assets/equipe-ta.png.asset.json';
import hiringPlanAsset from '@/assets/hiring-plan.png.asset.json';
import dashboardAsset from '@/assets/dashboard.png.asset.json';
import luccaLogo from '@/assets/lucca-logo.jpeg.asset.json';
import './studio.css';

const CONTACT_CALENDLY_URL = 'https://calendly.com/alexandre-kistone/30mins-meetup';


const PILLARS = [
  { n: '01', title: 'Plan', desc: 'Hiring plan collaboratif, validé par la finance et les métiers.', Icon: Target },
  { n: '02', title: 'Track', desc: 'Pipeline lisible, time to hire, charge par recruteur.', Icon: LineChart },
  { n: '03', title: 'Adjust', desc: 'Réajustez vos priorités sans casser le cadre budgétaire.', Icon: GitBranch },
  { n: '04', title: 'Align', desc: 'Une vue partagée entre TA, hiring managers et finance.', Icon: Eye },
];

const PROCESS = [
  {
    n: '01',
    role: 'Hiring Manager',
    Icon: Users,
    title: 'Exprime ses besoins',
    desc: "Le manager décrit ses besoins d'effectifs depuis son espace : poste, niveau, timing et justification business.",
    color: '#E59500',
  },
  {
    n: '02',
    role: 'Ressources Humaines',
    Icon: ShieldCheck,
    title: 'Valide le besoin',
    desc: "L'équipe RH challenge, priorise et valide chaque demande au regard de la stratégie talents et de l'organigramme.",
    color: '#7C3AED',
  },
  {
    n: '03',
    role: 'Finance',
    Icon: Wallet,
    title: 'Arbitre le budget',
    desc: "La finance contrôle l'impact masse salariale, valide les enveloppes et débloque les postes éligibles au recrutement.",
    color: '#059669',
  },
  {
    n: '04',
    role: 'Toute l\'entreprise',
    Icon: LineChart,
    title: 'Suivi continu du hiring plan',
    desc: "Le plan vit toute l'année : ouvertures, signatures, glissements et réajustements sont tracés en temps réel.",
    color: '#0A0A0A',
  },
];

const SECTIONS = [
  {
    step: '01 Plan',
    title: 'Anticipez vos besoins, alignez les métiers.',
    desc: "Construisez votre hiring plan avec les hiring managers, validez les besoins avec la finance. Un seul plan, partagé, vivant — fini les fichiers Excel qui circulent par mail.",
    bullets: [
      'Workflow de demande structuré pour les managers',
      'Double validation RH puis Finance',
      'Vue consolidée par BU, équipe et période',
    ],
    image: hiringPlanAsset.url,
    imageAlt: 'Vue Hiring Plan : liste des postes par statut, recruteur, fonction, contrat, salaire et time to hire',
  },
  {
    step: '02 Track',
    title: 'Pilotez votre équipe TA.',
    desc: "Visualisez la bande passante de votre équipe et anticipez les surcharges. Chaque poste avance d'une étape à la suivante sans tableur de suivi parallèle.",
    bullets: [
      'Pipeline par recruteur et par poste',
      'Time to hire, taux de couverture, ratios clés',
      'Alertes sur les postes en retard ou bloqués',
    ],
    image: equipeTaAsset.url,
    imageAlt: 'Tableau de suivi de l\'équipe TA : staffés, time to hire, conversion et heatmap de capacité mensuelle par recruteur',
  },
  {
    step: '03 Adjust',
    title: 'Ajustez en continu, sans perdre la vue d\'ensemble.',
    desc: "Un poste qui glisse, un remplacement urgent, une réorganisation : tout se met à jour dans l'organigramme, le budget et le plan. Vos arbitrages ont enfin un cadre.",
    bullets: [
      'Replanification en un clic, historisée',
      'Impact budgétaire instantané',
      'Organigramme cible vs. réel synchronisé',
    ],
    image: dashboardAsset.url,
    imageAlt: 'Dashboard Gotam : achievement du hiring plan, time to hire, offers accepted, plan stability, gap offer vs budget et parité',
  },
];

const GotamProductTour = () => {
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const openOnboarding = () => setOnboardingOpen(true);

  return (
    <div style={{ minHeight: '100vh', background: '#F2EFE9', fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}>
      <SEO
        title="Gotam — Headcount planning par Kistone"
        description="Gotam : la solution de headcount planning collaborative pour piloter votre plan de recrutement, aligner finance et métiers, suivre chaque poste en temps réel."
        path="/product-tour/gotam"
      />
      <KistoneHeader />

      <main className="lp-section-wrap lp-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <Link
          to="/realisations"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#0A0A0A', textDecoration: 'none', marginBottom: 32,
          }}
        >
          <ArrowLeft size={14} /> Retour aux réalisations
        </Link>

        {/* HERO */}
        <section style={{
          background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 20,
          boxShadow: '8px 8px 0 0 #0A0A0A', padding: '56px 40px', marginBottom: 40,
        }}>
          <div className="lp-section-tag" style={{ marginBottom: 14 }}>SOLUTION · PLANIFICATION DES EFFECTIFS</div>
          <h1 className="lp-section-title" style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.02, marginBottom: 20 }}>
            Planifiez, suivez, ajustez.
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.5, color: '#0A0A0A', maxWidth: 720, marginBottom: 28 }}>
            Gotam permet aux équipes RH et Finance d'anticiper, d'optimiser les ressources et d'aligner les besoins métier — sans jongler entre dix outils.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={openOnboarding}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                background: '#E59500', color: '#0A0A0A', padding: '14px 22px',
                border: '2px solid #0A0A0A', borderRadius: 10, cursor: 'pointer',
                boxShadow: '4px 4px 0 0 #0A0A0A',
              }}
            >
              CE PRODUIT M'INTÉRESSE⚡️ <ArrowUpRight size={16} />
            </button>
            <a
              href={CONTACT_CALENDLY_URL}
              target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                background: '#FFFFFF', color: '#0A0A0A', padding: '14px 22px',
                border: '2px solid #0A0A0A', borderRadius: 10, textDecoration: 'none',
                boxShadow: '4px 4px 0 0 #0A0A0A',
              }}
            >
              NOUS CONTACTER
            </a>
          </div>

        </section>

        {/* 4 PILIERS */}
        <section style={{ marginBottom: 56 }}>
          <div className="lp-section-tag" style={{ marginBottom: 8 }}>LES 4 PILIERS</div>
          <h2 className="lp-section-title" style={{ marginBottom: 24 }}>
            Une méthode, quatre mouvements.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {PILLARS.map((p) => {
              const Icon = p.Icon;
              return (
                <div key={p.title} style={{
                  background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 16,
                  boxShadow: '4px 4px 0 0 #0A0A0A', padding: 24,
                }}>
                  <div style={{
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 11, letterSpacing: '0.08em', color: 'rgba(10,10,10,0.5)', marginBottom: 12,
                  }}>{p.n} / 04</div>
                  <Icon size={26} style={{ color: '#E59500', marginBottom: 12 }} />
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#0A0A0A' }}>{p.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(10,10,10,0.7)' }}>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* INTÉGRATION LUCCA */}
        <section style={{ marginBottom: 56 }}>
          <div className="lp-section-tag" style={{ marginBottom: 16 }}>INTÉGRATIONS</div>
          <a
            href="https://www.lucca.fr/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 24,
              background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 16,
              boxShadow: '4px 4px 0 0 #0A0A0A', padding: 28,
              textDecoration: 'none', color: 'inherit',
            }}
          >
            <img
              src={luccaLogo.url}
              alt="Lucca"
              style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, display: 'block' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#0A0A0A' }}>
                Synchronisation native avec Lucca
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(10,10,10,0.65)', marginBottom: 8 }}>
                Vos collaborateurs, fiches de poste et budgets RH synchronisés directement avec votre SIRH Lucca.
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700,
                color: '#E59500',
              }}>
                Découvrir Lucca <ArrowUpRight size={14} />
              </span>
            </div>
          </a>
        </section>

        {/* PROCESSUS */}
        <section style={{ marginBottom: 56 }}>
          <div className="lp-section-tag" style={{ marginBottom: 8 }}>LE PROCESSUS</div>
          <h2 className="lp-section-title" style={{ marginBottom: 24 }}>
            Du besoin terrain à la décision budgétaire.
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {PROCESS.map((s, i) => {
              const Icon = s.Icon;
              return (
                <div key={s.n} style={{
                  background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 16,
                  boxShadow: '4px 4px 0 0 #0A0A0A', padding: 24,
                  display: 'grid', gridTemplateColumns: '64px 1fr', gap: 20, alignItems: 'start',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 12,
                    background: s.color, color: '#FFFFFF',
                    border: '2px solid #0A0A0A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: 11, letterSpacing: '0.08em', color: 'rgba(10,10,10,0.5)', marginBottom: 6,
                    }}>{s.n} · {s.role.toUpperCase()}</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#0A0A0A' }}>{s.title}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(10,10,10,0.75)' }}>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTIONS DÉTAILLÉES */}
        {SECTIONS.map((sec, idx) => (
          <section key={sec.step} style={{
            background: idx % 2 === 0 ? '#FFFFFF' : '#0A0A0A',
            color: idx % 2 === 0 ? '#0A0A0A' : '#F2EFE9',
            border: '2px solid #0A0A0A', borderRadius: 20,
            boxShadow: idx % 2 === 0 ? '8px 8px 0 0 #0A0A0A' : '8px 8px 0 0 #E59500',
            padding: '48px 40px', marginBottom: 32,
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: idx % 2 === 0 ? '#E59500' : '#E59500', marginBottom: 14, fontWeight: 700,
            }}>
              {sec.step}
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 18, maxWidth: 780 }}>
              {sec.title}
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, opacity: 0.9, maxWidth: 760, marginBottom: 24 }}>
              {sec.desc}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {sec.bullets.map((b) => (
                <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15 }}>
                  <CheckCircle2 size={20} style={{ color: '#E59500', flexShrink: 0, marginTop: 2 }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {sec.image && (
              <div style={{
                marginTop: 28,
                background: '#FFFFFF',
                border: '2px solid #0A0A0A',
                borderRadius: 12,
                boxShadow: '4px 4px 0 0 #E59500',
                padding: 12,
                overflow: 'hidden',
              }}>
                <img
                  src={sec.image}
                  alt={sec.imageAlt}
                  style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 6 }}
                />
              </div>
            )}
          </section>
        ))}

        {/* CTA FINAL */}
        <section style={{
          background: '#E59500', color: '#0A0A0A', border: '2px solid #0A0A0A', borderRadius: 20,
          boxShadow: '8px 8px 0 0 #0A0A0A', padding: '48px 40px', textAlign: 'center', marginTop: 24,
        }}>
          <div className="lp-section-tag" style={{ marginBottom: 12 }}>POUR LES ÉQUIPES RH & FINANCE</div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, lineHeight: 1.05, marginBottom: 14 }}>
            From planning to hiring.
          </h2>
          <p style={{ fontSize: 17, marginBottom: 28, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            Un plan, un pipeline, une équipe alignée.
          </p>
          <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={openOnboarding}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                background: '#0A0A0A', color: '#F2EFE9', padding: '14px 22px',
                border: '2px solid #0A0A0A', borderRadius: 10, cursor: 'pointer',
              }}
            >
              CE PRODUIT M'INTÉRESSE⚡️ <ArrowUpRight size={16} />
            </button>
            <a
              href={CONTACT_CALENDLY_URL}
              target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                background: '#FFFFFF', color: '#0A0A0A', padding: '14px 22px',
                border: '2px solid #0A0A0A', borderRadius: 10, textDecoration: 'none',
              }}
            >
              NOUS CONTACTER
            </a>
          </div>

        </section>
      </main>
      <StudioOnboardingDialog
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        preselectedExistingProject="gotam"
      />
    </div>

  );
};

export default GotamProductTour;
