import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Network, Package, Users, ChevronLeft, ChevronRight, Globe, ShieldCheck, Bot, Lock, Briefcase, Search } from 'lucide-react';
import KistoneHeader from '@/components/KistoneHeader';
import kistoneLogoLight from '@/assets/kistone-logo-blanc.png';
import gotamPicto from '@/assets/gotam-picto.png.asset.json';
import StudioOnboardingDialog from '@/components/studio/StudioOnboardingDialog';
import SEO from '@/components/SEO';
import cardHiring from '@/assets/studio-card-hiring.jpg';
import cardKit from '@/assets/studio-card-kit.jpg';
import cardPlatform from '@/assets/studio-card-platform.jpg';
import cardCustom from '@/assets/studio-card-custom.jpg';
// Real human photography sourced from Unsplash (free, commercial-use stock library — Shutterstock equivalent)
const heroScene = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1280&q=80';
const portraitMarie = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=768&q=80';
const portraitThomas = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=768&q=80';
const portraitAmina = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=768&q=80';
const persona1 = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=512&q=80';
const persona2 = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=512&q=80';
const persona3 = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=512&q=80';
const persona4 = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=512&q=80';
import pourQuiBg from '@/assets/pour-qui-bg.jpg';
import './studio.css';

const TESTIMONIALS = [
  {
    quote: "On a divisé par 3 le temps passé à trier les CV. L'outil livré en 12 jours s'est branché direct sur notre ATS.",
    name: 'Marie Lefèvre',
    role: 'Talent Lead · Scale-up SaaS',
    photo: portraitMarie,
  },
  {
    quote: "Une équipe qui parle recrutement, pas seulement code. La maquette en 48h a aligné tout le COMEX.",
    name: 'Thomas Becker',
    role: 'DRH · Groupe industriel',
    photo: portraitThomas,
  },
  {
    quote: "Mon scoring de candidats tourne tout seul depuis 3 mois. Je récupère 6h par semaine, sans rien gérer.",
    name: 'Amina Sow',
    role: 'Recruteuse freelance · Tech',
    photo: portraitAmina,
  },
];



type Slide = {
  tag: string;
  tagStyle?: string;
  title: string;
  desc: string;
  image: string;
  mini: { label: string; val: string; cls?: string; cta?: string }[];
};

const SLIDES: Slide[] = [
  {
    tag: 'KISTONE STUDIO',
    tagStyle: 'green',
    title: 'Hiring Plan',
    desc: 'On a remplacé 4 Google Sheets par un dashboard temps-réel. Suivi de recrutement, KPIs, et plan de headcount en un seul écran.',
    image: cardHiring,
    mini: [{ label: 'AVANT', val: '4 GoogleSheets', cls: 'grey' }, { label: 'GAIN', val: '30% temps', cls: 'green' }],
  },
  {
    tag: 'KISTONE STUDIO',
    tagStyle: 'green',
    title: 'Assistant sourcing',
    desc: "On a regroupé tous vos agents IA au même endroit. Scoring, sourcing, génération d'offres et onboarding — un seul toolkit.",
    image: cardKit,
    mini: [{ label: 'TÂCHES', val: '6 outils en 1' }, { label: 'GAIN', val: '2h/jour', cls: 'green' }],
  },
  {
    tag: 'KISTONE STUDIO',
    title: 'Plateforme Freelance',
    desc: "Automatisez la gestion de votre communauté Freelance, tarifs, disponibilité en temps réel, administratif (légal, contrats, CRA...). Le tout-en-un pour développer l'activité Freelance de son cabinet.",
    image: cardPlatform,
    mini: [{ label: 'SETUP', val: '3 jours' }, { label: 'IMPACT', val: '+20% de biz', cls: 'green' }],
  },
  {
    tag: 'SUR-MESURE',
    tagStyle: 'green',
    title: 'Votre projet ici',
    desc: "Un besoin spécifique ? On le code en 15 jours. Dashboard, agent IA, connecteur, automatisations — vous briefez, on livre.",
    image: cardCustom,
    mini: [{ label: 'DÉLAI', val: '15 jours' }, { label: '', val: '', cta: 'DÉMARRER UN PROJET⚡️', cls: 'green' }],
  },
];

const PROCESS_STEPS = [
  { label: 'BRIEF', title: 'Premier Call de découverte' },
  { label: 'PROTO', title: 'Une maquette en 48h' },
  { label: 'BUILD', title: 'Nous codons, vous validez' },
  { label: 'LIVRAISON', title: 'Nous livrons. Vous recrutez.' },
];

const NOT_US = [
  { title: 'Pas un ATS de plus', desc: "Votre ATS fait déjà le job. Nous ne venons pas le remplacer, nous venons le compléter." },
  { title: 'Pas un projet IT à 6 mois', desc: "Pas de cahier des charges de 80 pages, pas de comité de pilotage. 15 jours, prix fixe." },
  { title: 'Pas un outil générique', desc: "Pas de SaaS qu'il faut tordre pour entrer dans votre process. Nous codons ce qui colle exactement à votre métier." },
  { title: 'Pas de licences', desc: "Nous ne vendons pas d'abonnement à un produit. Nous codons l'outil qu'il vous faut, à vous." },
];

const VERSUS_LOSER = [
  'Cahier des charges de 80 pages',
  'Réunions hebdomadaires sans fin',
  '6 interlocuteurs pour une décision',
  'Budget opaque et variable',
  'Livraison tardive, specs changées',
  "Maintenance facturée à l'heure",
];
const VERSUS_WINNER = [
  'Brief en 1h, nous comprenons vite',
  'Un interlocuteur, zéro bureaucratie',
  'Prix fixe annoncé dès le départ',
  'App livrée en 15 jours chrono',
  'Itérations rapides post-livraison',
  'Stack IA moderne et maintenue',
];


const WHY = [
  { title: 'Nous avons fait votre métier', desc: "16 ans dans les RH. Cabinet, missions, sourcing, qualification, négo, reporting. Nous avons vécu vos outils — nous savons pourquoi ils ne suivent pas." },
  { title: 'Nous codons à votre vitesse', desc: '15 jours du brief au déploiement. Pas 6 mois de cadrage, pas de comité. Stack AI-native pour aller vite sans sacrifier la qualité.' },
  { title: "C'est votre outil, pas une licence", desc: "Code propriétaire, hébergement chez vous si vous le souhaitez, modifiable. Pas de SaaS qui vous tient en otage. Votre méthode, votre outil." },
];

const HeroCarousel = ({ slides, onCtaClick }: { slides: Slide[]; onCtaClick?: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const interacted = useRef(false);

  const goTo = useCallback((i: number) => setCurrent((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused || interacted.current) return;
    const t = setInterval(() => goTo(current + 1), 3500);
    return () => clearInterval(t);
  }, [current, goTo, slides.length, paused]);

  return (
    <div className="lp-carousel-wrap lp-anim-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="lp-carousel">
        <div className="lp-carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {slides.map((s, i) => (
            <div className={`lp-carousel-slide ${i === slides.length - 1 ? 'lp-slide-cream' : ''}`} key={i}>
              <div className="lp-slide-card">
                <div className={`lp-slide-tag ${s.tagStyle || ''}`}>{s.tag}</div>
                <div className="lp-slide-title">{s.title}</div>
                <p className="lp-slide-desc">{s.desc}</p>
              </div>
              <div className="lp-slide-row">
                {s.mini.map((m, j) => (
                  <div className="lp-slide-mini" key={j}>
                    {m.cta ? (
                      <button type="button" className="lp-btn-primary text-base" onClick={onCtaClick} style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}>{m.cta}</button>
                    ) : (
                      <>
                        <div className="lp-slide-mini-label">{m.label}</div>
                        <div className={`lp-slide-mini-val ${m.cls || ''}`}>{m.val}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className="lp-arrow lp-arrow-left"
        onClick={() => { interacted.current = true; goTo(current - 1); }}
        aria-label="Slide précédent"
      >
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>
      <button
        className="lp-arrow lp-arrow-right"
        onClick={() => { interacted.current = true; goTo(current + 1); }}
        aria-label="Slide suivant"
      >
        <ChevronRight size={24} strokeWidth={2.5} />
      </button>
      <div className="lp-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`lp-dot ${i === current ? 'active' : ''}`}
            onClick={() => { interacted.current = true; goTo(i); }}
            aria-label={`Aller au slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const useScrollReveal = () => {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll<HTMLElement>('.lp-reveal');
    if (reduced) { els.forEach((el) => el.classList.add('lp-revealed')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('lp-revealed'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

const Studio = () => {
  useScrollReveal();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  return (
    <div className="lp-body">
      <SEO
        title="Kistone Studio — Outils & automatisations IA pour recruteurs"
        description="Kistone Studio code les outils, connexions et automatisations sur-mesure qui boostent votre stack recrutement. Livré en 15 jours, prix fixe."
        path="/"
      />
      <KistoneHeader onStartProject={() => setOnboardingOpen(true)} />


      <main id="main">
        {/* HERO */}
        <div className="lp-hero">
          <div className="lp-hero-inner lp-container">
            <div>
              <div className="lp-hero-tag lp-anim-1">AI product builder</div>
              <h1 className="lp-hero-title lp-anim-2">
                Une stack recrutement et RH<br /><span className="lp-accent">boostée par l'IA.</span>
              </h1>
              <p className="lp-hero-sub lp-anim-3">
                Nous codons les outils, connexions et automatisations sur-mesure afin de vous faire gagner en productivité.
              </p>
              <div className="lp-hero-actions lp-anim-4">
                <button type="button" onClick={() => setOnboardingOpen(true)} className="lp-btn-primary text-base" style={{ border: 'none', cursor: 'pointer' }}>DÉMARRER UN PROJET ⚡️</button>
                <a href="/realisations" className="lp-btn-ghost">Voir les cas d'usage →</a>
              </div>
              <div className="lp-hero-stats lp-anim-5">
                <div><div className="lp-stat-num">15j</div><div className="lp-stat-label">délai de livraison</div></div>
                <div><div className="lp-stat-num">×6</div><div className="lp-stat-label">+RAPIDE QU'UNE ESN</div></div>
                <div><div className="lp-stat-num">100%</div><div className="lp-stat-label">SUR-MESURE</div></div>
              </div>
            </div>
            <HeroCarousel slides={SLIDES} onCtaClick={() => setOnboardingOpen(true)} />
          </div>
        </div>

        {/* TICKER */}
        <div className="lp-reassure-wrap">
          <div className="lp-ticker">
            <div className="lp-ticker-track">
              {Array.from({ length: 2 }).map((_, k) => (
                <div className="lp-ticker-group" key={k} aria-hidden={k === 1}>
                  <span className="lp-ticker-item">POUR CABINETS · RPO · TA INTERNES · INDÉPENDANTS</span>
                  <span className="lp-ticker-dot">★</span>
                  <span className="lp-ticker-item is-strong">CONFORME RGPD</span>
                  <span className="lp-ticker-dot">★</span>
                  <span className="lp-ticker-item">Stack : <strong>CLAUDE · LOVABLE · GOOGLE AI STUDIO</strong></span>
                  <span className="lp-ticker-dot">★</span>
                </div>
              ))}
            </div>
          </div>
        </div>





        {/* POUR QUI */}
        <div className="lp-pourqui-wrap lp-container" id="pour-qui">
          <div className="lp-pourqui lp-reveal">
            <img src={pourQuiBg} alt="" className="lp-pourqui-bg" loading="lazy" width={1920} height={1024} />
            <div className="lp-pourqui-inner">
              <div className="lp-section-tag">POUR QUI ?</div>
              <h2 className="lp-section-title text-5xl">Conçu pour celles et ceux qui recrutent.</h2>
              <div className="lp-pourqui-grid">
                <div className="lp-pourqui-card">
                  <span className="lp-pourqui-num">01</span>
                  <div className="lp-pourqui-body">
                    <h3 className="lp-pourqui-title">
                      Cabinets
                      <svg className="lp-pourqui-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d="M5 19L19 5m0 0H9m10 0v10"/></svg>
                    </h3>
                    <p className="lp-pourqui-desc">Cabinets de recrutement et ESN qui veulent mieux s'outiller.</p>
                    <span className="lp-pourqui-bar" />
                  </div>
                </div>
                <div className="lp-pourqui-card">
                  <span className="lp-pourqui-num">02</span>
                  <div className="lp-pourqui-body">
                    <h3 className="lp-pourqui-title">
                      Indépendants
                      <svg className="lp-pourqui-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d="M5 19L19 5m0 0H9m10 0v10"/></svg>
                    </h3>
                    <p className="lp-pourqui-desc">Recruteurs freelance qui automatisent leur sourcing et leur prospection client.</p>
                    <span className="lp-pourqui-bar" />
                  </div>
                </div>
                <div className="lp-pourqui-card">
                  <span className="lp-pourqui-num">03</span>
                  <div className="lp-pourqui-body">
                    <h3 className="lp-pourqui-title">
                      Équipes en interne
                      <svg className="lp-pourqui-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d="M5 19L19 5m0 0H9m10 0v10"/></svg>
                    </h3>
                    <p className="lp-pourqui-desc">Talent Acquisition et RH qui veulent des outils branchés sur leur ATS / SIRH.</p>
                    <span className="lp-pourqui-bar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REALISATIONS */}
        <div className="lp-section-wrap lp-container" id="realisations">
          <div className="lp-section lp-reveal" style={{ background: '#FFE5CC' }}>
            <div className="lp-section-tag">NOS REALISATIONS</div>
            <h2 className="lp-section-title lp-title-nowrap text-5xl">Des outils construits pour le recrutement</h2>
            <div className="lp-realisations-grid">
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><img src={gotamPicto.url} alt="" aria-hidden="true" width={20} height={20} style={{ display: 'block', objectFit: 'contain' }} /></div>
                <div className="lp-realisations-title">Hiring Plan</div>
                <div className="lp-realisations-desc">Gotam est une solution de planification des effectifs pour créer et suivre son plan de recrutement. Structurez vos besoins, suivez vos recrutements en temps réel.</div>
                <Link to="/product-tour/gotam" className="lp-realisations-link">En savoir plus →</Link>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><Network size={20} /></div>
              <div className="lp-realisations-title">Plateforme Freelance</div>
                <div className="lp-realisations-desc">Automatisez la gestion de votre communauté Freelance, tarifs, disponibilité en temps réel, administratif (légal, contrats, CRA...).</div>
                <Link to="/product-tour/connect" className="lp-realisations-link">En savoir plus →</Link>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><Users size={20} /></div>
                <div className="lp-realisations-title">Plateforme CDI</div>
                <div className="lp-realisations-desc">Un pont direct entre vous et vos clients : suivi du pipeline candidat, commentaires et remarques, statistiques du funnel. 100% customisable à votre marque.</div>
                <Link to="/product-tour/portail-client" className="lp-realisations-link">En savoir plus →</Link>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><Package size={20} /></div>
                <div className="lp-realisations-title">Assistant sourcing</div>
                <div className="lp-realisations-desc">Retrouvez tout le pack essentiel du recruteur augmenté par l'IA. Les outils indispensables pour recruter plus vite et mieux.</div>
                <Link to="/product-tour/le-kit" className="lp-realisations-link">En savoir plus →</Link>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><Briefcase size={20} /></div>
                <div className="lp-realisations-title">SIRH</div>
                <div className="lp-realisations-desc">Connectez vos outils RH et centralisez la gestion des collaborateurs, contrats, congés et fiches de paie au même endroit.</div>
                <span className="lp-realisations-link lp-realisations-link--disabled">En savoir plus →</span>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><Search size={20} /></div>
                <div className="lp-realisations-title">ATS</div>
                <div className="lp-realisations-desc">Pilotez l'ensemble de vos processus de recrutement : publication d'offres, parsing de CV, scoring et suivi des candidatures.</div>
                <span className="lp-realisations-link lp-realisations-link--disabled">En savoir plus →</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY */}
        <div className="lp-section-wrap lp-container" id="securite">
          <div className="lp-security lp-reveal">
            <div className="lp-security-grid">
              <div className="lp-security-item">
                <div className="lp-security-icon"><Globe size={20} /></div>
                Données hébergées en UE
              </div>
              <div className="lp-security-item">
                <div className="lp-security-icon"><ShieldCheck size={20} /></div>
                Conforme RGPD
              </div>
              <div className="lp-security-item">
                <div className="lp-security-icon"><Bot size={20} /></div>
                Conforme AI-Act
              </div>
              <div className="lp-security-item">
                <div className="lp-security-icon"><Lock size={20} /></div>
                Pas d'entraînement des données
              </div>
            </div>
          </div>
        </div>

        {/* PROCESS + USE CASES fusion */}
        <div className="lp-section-wrap lp-container" id="process">
          <div className="lp-section lp-reveal">
            <div className="lp-section-tag">COMMENT ÇA MARCHE</div>
            <h2 className="lp-section-title text-5xl">Là où nous faisons gagner du temps.</h2>
            <p className="lp-section-sub">Des briques concrètes qui s'imbriquent dans votre ATS, CRM ou SIRH.</p>
            
            <div className="lp-personas">
              <div className="lp-persona-stack">
                <img src={persona1} alt="" loading="lazy" width={44} height={44} />
                <img src={persona2} alt="" loading="lazy" width={44} height={44} />
                <img src={persona3} alt="" loading="lazy" width={44} height={44} />
                <img src={persona4} alt="" loading="lazy" width={44} height={44} />
              </div>
              <span className="lp-personas-label">CONÇU ET TESTÉ AVEC DES RECRUTEURS</span>
            </div>

            <div className="lp-process-grid lp-process-timeline">
              {PROCESS_STEPS.map((step, i) => (
                <div className="lp-process-card" key={i}>
                  <div className="lp-process-pill"><span className="lp-process-pill-num">{String(i + 1).padStart(2, '0')}</span></div>
                  <div className="lp-process-step-label">{step.label}</div>
                  <div className="lp-process-title">{step.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>




        {/* CTA */}

        <div className="lp-cta-wrap lp-container" id="contact">
          <div className="lp-cta lp-reveal">
            <div className="lp-section-tag">DÉMARRER</div>
            <h2 className="lp-cta-title">
              Nous construisons votre<br /><span className="lp-accent">prochain outil ?</span>
            </h2>
            <p className="lp-cta-sub">
              Sourcing, entretiens, prospection client, automatisations branchées sur votre ATS / CRM / SIRH… Dites-nous où vos recruteurs perdent du temps. Réponse sous 24h avec proposition claire et prix fixe.
            </p>
            <button type="button" onClick={() => setOnboardingOpen(true)} className="lp-btn-primary text-base" style={{ border: 'none', cursor: 'pointer' }}>PARTAGEZ VOTRE IDÉE⚡️</button>
          </div>
        </div>
      </main>

      <StudioOnboardingDialog open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      {/* FOOTER */}
      <div className="lp-footer-wrap">
        <div className="lp-footer lp-container">
          <div className="lp-footer-logo">
            <img src={kistoneLogoLight} alt="Kistone Studio logo" className="lp-logo-img" />
          </div>
          <ul className="lp-footer-links">
            <li><a href="#process">Comment ça marche</a></li>
            <li><a href="#realisations">Nos réalisations</a></li>
            <li><a href="#why">Pourquoi Kistone</a></li>
            <li><a href="mailto:aguego@kistone.fr">Contact</a></li>
          </ul>
          <div className="lp-footer-copy">© 2026 Kistone Studio</div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
