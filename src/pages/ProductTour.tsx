import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { BriefcaseBusiness, Users, FileSearch, Workflow, CheckCircle2, ArrowLeft, ArrowUpRight, Target, Search, MessageSquare, ClipboardCheck, Share2, LineChart } from 'lucide-react';
import KistoneHeader from '@/components/KistoneHeader';
import SEO from '@/components/SEO';
import StudioOnboardingDialog from '@/components/studio/StudioOnboardingDialog';
import './studio.css';
import leKit42 from '@/assets/le-kit/le-kit-42.png.asset.json';
import leKit41 from '@/assets/le-kit/le-kit-41.png.asset.json';
import leKit43 from '@/assets/le-kit/le-kit-43.png.asset.json';
import leKit44 from '@/assets/le-kit/le-kit-44.png.asset.json';
import leKit45 from '@/assets/le-kit/le-kit-45.png.asset.json';
import leKit05 from '@/assets/le-kit/le-kit-05.png.asset.json';
import freelanceKanban from '@/assets/freelance/freelance-kanban.png.asset.json';
import freelanceProfile from '@/assets/freelance/freelance-profile.png.asset.json';
import jarviLogo from '@/assets/jarvi-logo.jpeg.asset.json';
import luccaLogo from '@/assets/lucca-logo.jpeg.asset.json';
import portailPipeline from '@/assets/portail/portail-pipeline.png.asset.json';
import portailLogin from '@/assets/portail/portail-login.png.asset.json';

type Phase = {
  num: string;
  label: string;
  Icon: typeof Target;
  title: string;
  items: string[];
  image?: { url: string };
};

type Tour = {
  slug: string;
  name: string;
  tag: string;
  tagline: string;
  description: string;
  Icon: typeof BriefcaseBusiness;
  features?: { title: string; desc: string }[];
  phases?: Phase[];
  audience: string;
  stack: string;
};

const TOURS: Record<string, Tour> = {
  gotam: {
    slug: 'gotam',
    name: 'Gotam',
    tag: 'HEADCOUNT PLANNING',
    tagline: 'Pilotez votre plan de recrutement.',
    description:
      "Gotam est une solution de headcount planning pensée pour les équipes RH et Talent Acquisition. Construisez votre plan de recrutement, suivez chaque poste en temps réel et alignez vos managers sur les priorités du business.",
    Icon: BriefcaseBusiness,
    features: [
      { title: 'Plan de recrutement structuré', desc: 'Centralisez tous vos besoins par équipe, niveau, budget et timing.' },
      { title: 'Suivi en temps réel', desc: 'Visualisez l\'avancement de chaque poste : ouvert, en cours, signé, onboardé.' },
      { title: 'Validation managers', desc: 'Workflow de validation intégré pour valider les besoins en quelques clics.' },
      { title: 'Reporting board-ready', desc: 'Exportez vos KPIs et plans en un clic pour vos comités de direction.' },
    ],
    audience: 'Directions RH, Head of Talent, COO de scale-up',
    stack: 'Supabase · Lovable · Claude',
  },
  connect: {
    slug: 'connect',
    name: 'Doublez la valorisation de votre cabinet',
    tag: 'PLATEFORME FREELANCE',
    tagline: 'Le tout-en-un pour développer l\'activité Freelance de son cabinet.',
    description:
      "Automatisez la gestion de votre communauté Freelance, tarifs, disponibilité en temps réel, administratif (légal, contrats, CRA...). Le tout-en-un pour développer l'activité Freelance de son cabinet.",
    Icon: FileSearch,
    features: [
      { title: 'Matching intelligent', desc: 'Analyse sémantique des compétences, secteur, TJM et disponibilité.' },
      { title: 'Vivier propriétaire', desc: 'Construisez votre base de freelances qualifiés, enrichie automatiquement.' },
      { title: 'Pipeline visuel', desc: 'Suivez chaque mission de la qualification à la signature.' },
      { title: 'Notifications automatisées', desc: 'Emails, WhatsApp et relances orchestrés sans intervention manuelle.' },
      { title: 'Gestion des CRA', desc: 'Envoi automatique des comptes rendus d\'activité aux consultants et aux clients avec validation et facturation.' },
      { title: 'Suivi des KPIs', desc: 'Chiffre d\'affaires, marge, trésorerie, time to fill, durée des missions... Tout pour piloter votre activité Freelance.' },
    ],
    audience: 'Cabinets de recrutement, ESN, plateformes freelance',
    stack: 'Supabase · Gemini · Resend',
  },
  'portail-client': {
    slug: 'portail-client',
    name: 'Plateforme CDI',
    tag: 'PORTAIL CLIENT',
    tagline: 'Un pont direct entre vous et vos clients.',
    description:
      "La Plateforme CDI donne à vos clients un accès en temps réel à leurs recrutements : suivi du pipeline candidat, commentaires et remarques, statistiques du funnel. Le tout customisable à vos couleurs et votre logo.",
    Icon: Users,
    features: [
      { title: 'Suivi du pipeline candidat', desc: 'Vos clients suivent chaque candidat en temps réel, de la suggestion à la validation.' },
      { title: 'Commentaires et remarques', desc: 'Feedback client directement sur les profils, sans allers-retours par email.' },
      { title: 'Statistiques du funnel', desc: 'Taux de conversion par étape, volumes et délais pour piloter la mission à deux.' },
    ],
    audience: 'Cabinets de recrutement et ESN sur du CDI',
    stack: 'Supabase · Lovable · Resend',
  },
  'le-kit': {
    slug: 'le-kit',
    name: 'Assistant sourcing',
    tag: 'ASSISTANT IA SOURCING',
    tagline: "L'assistant qui vous accompagne sur l'ensemble du cycle de sourcing.",
    description:
      "L'Assistant sourcing couvre toutes les étapes d'une mission de recrutement : du brief initial au rapport d'activité final. Chaque phase est augmentée par l'IA pour faire gagner du temps au recruteur et fiabiliser ses décisions.",
    Icon: Workflow,
    phases: [
      {
        num: '01',
        label: 'MISSION',
        Icon: Target,
        title: 'Définir',
        items: [
          'Reformulation IA d\'un brief écrit à partir d\'un résumé notetaker',
          'Challenger le brief',
          "Génération de l'offre d'emploi",
          'Création de l\'argumentaire candidat',
        ],
        image: leKit42,
      },
      {
        num: '02',
        label: 'MISSION',
        Icon: Search,
        title: 'Trouver',
        items: [
          'Définition du plan de sourcing',
          'Génération de Boolean search',
          'Market analysis',
          'Matching IA sur le vivier existant',
        ],
        image: leKit41,
      },
      {
        num: '03',
        label: 'CANDIDAT',
        Icon: MessageSquare,
        title: 'Contacter',
        items: [
          'Personnalisation des messages d\'approche',
          'Séquences de contact multicanales automatisées',
        ],
        image: leKit43,
      },
      {
        num: '04',
        label: 'CANDIDAT',
        Icon: ClipboardCheck,
        title: 'Évaluer',
        items: [
          'Scoring et pré-tri automatique des candidatures',
          'Génération de la grille d\'évaluation (scorecard) par IA',
          'Grille d\'entretien adaptée au poste et au profil, avec identification des zones d\'ombre',
          'Transcription et synthèse d\'entretien',
          'Comparatif des résultats',
        ],
        image: leKit44,
      },
      {
        num: '05',
        label: 'CANDIDAT',
        Icon: Share2,
        title: 'Partager',
        items: [
          'Génération automatique de la présentation candidat',
          'Rédaction d\'email vers le client',
          'Push CV assisté par IA',
        ],
        image: leKit05,
      },
      {
        num: '06',
        label: 'MISSION',
        Icon: LineChart,
        title: 'Suivi',
        items: [
          'Synthèse de la mission',
          'Rapport d\'activité',
        ],
        image: leKit45,
      },
    ],
    audience: 'Recruteurs internes, freelances RH, TA leads, cabinets de recrutement',
    stack: 'Claude · OpenAI · Lovable · Supabase',
  },
};

const ProductTour = () => {
  const { slug } = useParams<{ slug: string }>();
  const tour = slug ? TOURS[slug] : null;
  if (!tour) return <Navigate to="/" replace />;
  const Icon = tour.Icon;
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#F2EFE9', fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}>
      <SEO
        title={`${tour.name} — ${tour.tagline}`}
        description={tour.description}
        path={`/product-tour/${tour.slug}`}
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

        <div style={{
          background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 20,
          boxShadow: '8px 8px 0 0 #0A0A0A', padding: '48px 40px', marginBottom: 40,
        }}>
          {!['le-kit', 'connect', 'portail-client'].includes(tour.slug) && (
            <div className="lp-usecase-icon" style={{ marginBottom: 20 }}><Icon size={28} /></div>
          )}
          <div className="lp-section-tag" style={{ marginBottom: 12 }}>{tour.tag}</div>
          <h1 className="lp-section-title" style={{ marginBottom: 16, fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', whiteSpace: 'nowrap' }}>{tour.name}</h1>
          <p style={{ fontSize: 20, lineHeight: 1.5, color: '#0A0A0A', fontWeight: 500, marginBottom: 20 }}>
            {tour.tagline}
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(10,10,10,0.7)', maxWidth: 720 }}>
            {tour.description}
          </p>
          {tour.slug === 'le-kit' && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setOnboardingOpen(true)}
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
                href="https://sourcing.kistone.fr/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                  background: '#0A0A0A', color: '#F2EFE9', padding: '14px 22px',
                  border: '2px solid #0A0A0A', borderRadius: 10, textDecoration: 'none',
                }}
              >
                Accéder à l'outil <ArrowUpRight size={16} />
              </a>
            </div>
          )}
        </div>

        {tour.phases ? (
          <div style={{ marginBottom: 40 }}>
            <div className="lp-section-tag" style={{ marginBottom: 16 }}>LES 6 ÉTAPES DU CYCLE</div>
            <div style={{ display: 'grid', gap: 24 }}>
              {tour.phases.map((p) => {
                const PIcon = p.Icon;
                return (
                  <div key={p.num} style={{
                    background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 16,
                    boxShadow: '4px 4px 0 0 #0A0A0A', padding: 28,
                    display: 'grid', gridTemplateColumns: p.image ? 'minmax(0,1fr) minmax(0,1.2fr)' : '1fr',
                    gap: 24, alignItems: 'start',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', background: '#0A0A0A',
                          color: '#E59500', display: 'grid', placeItems: 'center',
                          fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontWeight: 700, fontSize: 14,
                        }}>{p.num}</div>
                        <div>
                          <div style={{
                            fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 10,
                            letterSpacing: '0.14em', color: 'rgba(10,10,10,0.55)', fontWeight: 700,
                          }}>{p.label}</div>
                          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PIcon size={20} /> {p.title}
                          </h3>
                        </div>
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                        {p.items.map((it) => (
                          <li key={it} style={{ display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.55, color: 'rgba(10,10,10,0.8)' }}>
                            <CheckCircle2 size={16} style={{ color: '#E59500', flexShrink: 0, marginTop: 3 }} />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {p.image && (
                      <div style={{
                        border: '1.5px solid #0A0A0A', borderRadius: 10, overflow: 'hidden',
                        background: '#F2EFE9',
                      }}>
                        <img src={p.image.url} alt={`Étape ${p.title}`} style={{ width: '100%', display: 'block' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 40 }}>
            <div className="lp-section-tag" style={{ marginBottom: 16 }}>FONCTIONNALITÉS CLÉS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {tour.features!.map((f) => (
                <div key={f.title} style={{
                  background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 16,
                  boxShadow: '4px 4px 0 0 #0A0A0A', padding: 24,
                }}>
                  <CheckCircle2 size={22} style={{ color: '#E59500', marginBottom: 12 }} />
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#0A0A0A' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(10,10,10,0.65)' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {['connect', 'portail-client', 'gotam'].includes(tour.slug) && (
          <div style={{ marginBottom: 40 }}>
            <div className="lp-section-tag" style={{ marginBottom: 16 }}>INTÉGRATIONS</div>
            {tour.slug === 'gotam' ? (
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
            ) : (
              <a
                href="https://www.jarvi.tech/"
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
                  src={jarviLogo.url}
                  alt="Jarvi"
                  style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, display: 'block' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#0A0A0A' }}>
                    Synchronisation native avec Jarvi ATS
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(10,10,10,0.65)', marginBottom: 8 }}>
                    {tour.slug === 'connect' ? 'Vos freelances et leurs disponibilités synchronisées directement avec votre ATS Jarvi.' : 'Candidats, besoins et étapes du pipeline synchronisés en natif avec votre ATS Jarvi.'}
                  </p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700,
                    color: '#E59500',
                  }}>
                    Découvrir Jarvi <ArrowUpRight size={14} />
                  </span>
                </div>
              </a>
            )}
          </div>
        )}

        {['connect', 'portail-client'].includes(tour.slug) && (
          <div style={{ marginBottom: 40 }}>
            <div className="lp-section-tag" style={{ marginBottom: 16 }}>APERÇU DE LA PLATEFORME</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {(tour.slug === 'portail-client' ? [
                { src: portailPipeline.url, title: 'Pipeline candidat partagé', desc: 'Screening, présentation, entretien 1, entretien 2, final, validé : vos clients suivent l\'avancement en temps réel.' },
                { src: portailLogin.url, title: 'Portail à vos couleurs', desc: 'Logo, couleurs et messages personnalisés pour une expérience client à votre marque.' },
              ] : [
                { src: freelanceKanban.url, title: 'Pipeline visuel par disponibilité', desc: 'Visualisez en un coup d\'œil les freelances disponibles, bientôt disponibles ou en mission.' },
                { src: freelanceProfile.url, title: 'Fiche freelance enrichie', desc: 'TJM, métiers, secteurs, langues et spécialités centralisés pour qualifier en quelques secondes.' },
              ]).map((img) => (
                <figure key={img.title} style={{
                  margin: 0, background: '#FFFFFF', border: '2px solid #0A0A0A', borderRadius: 16,
                  boxShadow: '4px 4px 0 0 #0A0A0A', overflow: 'hidden',
                }}>
                  <div style={{ borderBottom: '2px solid #0A0A0A', background: '#F2EFE9' }}>
                    <img src={img.src} alt={img.title} style={{ width: '100%', display: 'block' }} />
                  </div>
                  <figcaption style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 6 }}>{img.title}</h3>
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(10,10,10,0.65)' }}>{img.desc}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}




        <div style={{
          background: '#0A0A0A', color: '#F2EFE9', border: '2px solid #0A0A0A', borderRadius: 20,
          boxShadow: '8px 8px 0 0 #E59500', padding: '40px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            Envie d'un outil comme {tour.name} ?
          </h2>
          <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 24 }}>
            Nous construisons votre version sur-mesure en 15 jours.
          </p>
          <Link
            to="/#contact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
              background: '#E59500', color: '#0A0A0A', padding: '14px 22px',
              border: '2px solid #E59500', borderRadius: 10, textDecoration: 'none',
            }}
          >
            Démarrer un projet <ArrowUpRight size={16} />
          </Link>
        </div>
      </main>
      <StudioOnboardingDialog
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        preselectedExistingProject="kit"
      />
    </div>
  );
};

export default ProductTour;
