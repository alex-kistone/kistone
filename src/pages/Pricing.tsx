import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KistoneHeader from '@/components/KistoneHeader';
import StudioOnboardingDialog from '@/components/studio/StudioOnboardingDialog';
import SEO from '@/components/SEO';
import kistoneLogoLight from '@/assets/kistone-logo-blanc.png';
import './studio.css';
import { Check, Sparkles, ShieldCheck } from 'lucide-react';

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

const SPRINT_FEATURES = [
  "Brief d'1 h, maquette sous 48 h",
  "Développement et mise en production",
  "Reprise de vos données existantes",
  "Connexion à votre ATS / SIRH / paie",
  "Prise en main par votre équipe",
  "3 mois de support correctif inclus",
];

const SUPPORT_FEATURES = [
  "Corrections et mises à jour",
  "Petites évolutions incluses",
  "Supervision et sauvegardes",
  "Assistance par téléphone",
];

const Pricing = () => {
  useScrollReveal();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  return (
    <div className="lp-body">
      <SEO
        title="Tarifs Kistone Studio — Prix fixe, sans régie"
        description="Un prix fixe annoncé au brief : 4 900€ HT le sprint, livré en 2 semaines. Maintenance à 49€/mois sans engagement. Pas de régie, pas de dérive."
        path="/pricing"
      />
      <KistoneHeader onStartProject={() => setOnboardingOpen(true)} />

      <main id="main" style={{ minHeight: 'calc(100vh - 340px)' }}>
        <section
          className="lp-reveal"
          style={{
            background: '#F2EFE9',
            padding: '80px 24px 100px',
          }}
        >
          <div className="lp-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: 48, textAlign: 'left' }}>
              <h1
                style={{
                  fontFamily: '"TomatoGrotesk", "DM Sans", "Inter", sans-serif',
                  fontSize: 'clamp(2rem, 5.5vw, 3.6rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  color: '#14140F',
                  margin: 0,
                }}
              >
                Un prix fixe, annoncé au brief.
                <br />
                <span style={{ color: '#E59500' }}>Pas de régie, pas de dérive.</span>
              </h1>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
                alignItems: 'stretch',
              }}
            >
              {/* Sprint card */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '2px solid #0A0A0A',
                  borderRadius: 20,
                  boxShadow: '8px 8px 0 0 #E59500',
                  padding: '32px 28px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                  <div>
                    <h2
                      style={{
                        fontFamily: '"TomatoGrotesk", "DM Sans", "Inter", sans-serif',
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#14140F',
                        margin: 0,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Le sprint
                    </h2>
                    <p style={{ margin: '6px 0 0', color: '#5F5852', fontSize: 16, lineHeight: 1.5 }}>
                      Deux semaines, du brief à la mise en production.
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      background: '#E59500',
                      color: '#0A0A0A',
                      padding: '6px 12px',
                      border: '2px solid #0A0A0A',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Tout compris
                  </span>
                </div>

                <div style={{ margin: '8px 0 18px' }}>
                  <span
                    style={{
                      fontFamily: '"TomatoGrotesk", "DM Sans", "Inter", sans-serif',
                      fontSize: 'clamp(2.8rem, 7vw, 4.2rem)',
                      fontWeight: 900,
                      color: '#14140F',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    4 900€
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 20,
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 12,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#E54D2A',
                    fontWeight: 600,
                  }}
                >
                  <span>HT / le sprint</span>
                  <span style={{ color: '#0A0A0A', opacity: 0.25 }}>·</span>
                  <span>Prix annoncé avant de commencer</span>
                </div>

                <hr style={{ border: 0, borderTop: '2px solid rgba(10,10,10,0.08)', margin: '0 0 24px' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                  {SPRINT_FEATURES.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 18,
                          height: 18,
                          background: i === 5 ? '#E59500' : '#14140F',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 2,
                        }}
                      >
                        <Check size={12} color={i === 5 ? '#0A0A0A' : '#FFFFFF'} strokeWidth={3} />
                      </span>
                      <span style={{ color: '#5F5852', fontSize: 15, lineHeight: 1.45 }}>
                        {i === 5 ? <strong style={{ color: '#14140F' }}>{item}</strong> : item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                  <button
                    type="button"
                    onClick={() => setOnboardingOpen(true)}
                    style={{
                      width: '100%',
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: 13,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      background: '#E59500',
                      color: '#0A0A0A',
                      padding: '14px 20px',
                      border: '2px solid #0A0A0A',
                      borderRadius: 10,
                      boxShadow: '4px 4px 0 0 #0A0A0A',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 0 #0A0A0A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0 0 #0A0A0A'; }}
                  >
                    Démarrer un projet ⚡️
                  </button>
                </div>
              </div>

              {/* Maintenance card */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '2px solid #0A0A0A',
                  borderRadius: 20,
                  boxShadow: '8px 8px 0 0 #14140F',
                  padding: '32px 28px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h2
                    style={{
                      fontFamily: '"TomatoGrotesk", "DM Sans", "Inter", sans-serif',
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: '#14140F',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Maintenance & support
                  </h2>
                  <p style={{ margin: '6px 0 0', color: '#5F5852', fontSize: 16, lineHeight: 1.5 }}>
                    Au-delà des trois mois inclus, si vous le souhaitez.
                  </p>
                </div>

                <div style={{ margin: '8px 0 18px' }}>
                  <span
                    style={{
                      fontFamily: '"TomatoGrotesk", "DM Sans", "Inter", sans-serif',
                      fontSize: 'clamp(2.8rem, 7vw, 4.2rem)',
                      fontWeight: 900,
                      color: '#14140F',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    49€
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 20,
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 12,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#E54D2A',
                    fontWeight: 600,
                  }}
                >
                  <span>HT / mois</span>
                  <span style={{ color: '#0A0A0A', opacity: 0.25 }}>·</span>
                  <span>Sans engagement</span>
                </div>

                <hr style={{ border: 0, borderTop: '2px solid rgba(10,10,10,0.08)', margin: '0 0 24px' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                  {SUPPORT_FEATURES.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 18,
                          height: 18,
                          background: '#14140F',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 2,
                        }}
                      >
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </span>
                      <span style={{ color: '#5F5852', fontSize: 15, lineHeight: 1.45 }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                  <a
                    href="https://calendly.com/alexandre-kistone/30mins-meetup"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '100%',
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: 13,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      color: '#0A0A0A',
                      padding: '14px 20px',
                      border: '2px solid #0A0A0A',
                      borderRadius: 10,
                      boxShadow: '4px 4px 0 0 #0A0A0A',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 0 #0A0A0A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0 0 #0A0A0A'; }}
                  >
                    Book a call
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom trust bar */}
            <div
              className="lp-reveal"
              style={{
                marginTop: 24,
                background: '#0A0A0A',
                border: '2px solid #0A0A0A',
                borderRadius: 16,
                boxShadow: '6px 6px 0 0 #E59500',
                padding: '22px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
                color: '#FFFFFF',
                fontFamily: '"TomatoGrotesk", "DM Sans", "Inter", sans-serif',
                fontSize: 'clamp(1rem, 2.4vw, 1.35rem)',
                fontWeight: 700,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="#E59500" />
                Trois mois de support correctif inclus
              </span>
              <span style={{ color: '#E59500' }}>·</span>
              <span>Résiliable à tout moment</span>
            </div>

            {/* FAQ mini */}
            <div
              className="lp-reveal"
              style={{
                marginTop: 64,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {[
                { icon: <Sparkles size={18} color="#E59500" />, title: "Prix fixe", desc: "Le devis est définitif. Aucun supplément caché." },
                { icon: <ShieldCheck size={18} color="#E59500" />, title: "RGPD", desc: "Hébergement sécurisé et données sous votre contrôle." },
                { icon: <Check size={18} color="#E59500" />, title: "Livraison garantie", desc: "Un sprint de 2 semaines, maquette incluse." },
              ].map((box, i) => (
                <div
                  key={i}
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #0A0A0A',
                    borderRadius: 14,
                    padding: '18px 20px',
                    boxShadow: '3px 3px 0 0 #0A0A0A',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {box.icon}
                    <span style={{ fontWeight: 700, color: '#14140F' }}>{box.title}</span>
                  </div>
                  <p style={{ margin: 0, color: '#5F5852', fontSize: 14, lineHeight: 1.45 }}>{box.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          background: '#0A0A0A',
          color: '#B8B2A8',
          padding: '40px 24px 32px',
        }}
      >
        <div className="lp-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', textAlign: 'center' }}>
            <Link to="/" style={{ display: 'inline-flex' }}>
              <img src={kistoneLogoLight} alt="Kistone" style={{ height: 44, width: 'auto' }} />
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', justifyContent: 'center', fontSize: 13, color: '#B8B2A8' }}>
              <Link to="/" style={{ color: '#B8B2A8', textDecoration: 'none' }}>Accueil</Link>
              <Link to="/realisations" style={{ color: '#B8B2A8', textDecoration: 'none' }}>Nos réalisations</Link>
              <Link to="/pricing" style={{ color: '#B8B2A8', textDecoration: 'none' }}>Pricing</Link>
              <Link to="/pourquoi-kistone" style={{ color: '#B8B2A8', textDecoration: 'none' }}>Pourquoi Kistone</Link>
              <Link to="/blog" style={{ color: '#B8B2A8', textDecoration: 'none' }}>Blog</Link>
              <Link to="/privacy" style={{ color: '#B8B2A8', textDecoration: 'none' }}>Politique de confidentialité</Link>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B6B5E' }}>
              © {new Date().getFullYear()} Kistone. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      <StudioOnboardingDialog open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
};

export default Pricing;
