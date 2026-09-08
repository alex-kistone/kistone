import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Network, Package, Users } from 'lucide-react';
import KistoneHeader from '@/components/KistoneHeader';
import SEO from '@/components/SEO';
import StudioOnboardingDialog from '@/components/studio/StudioOnboardingDialog';
import kistoneLogoLight from '@/assets/kistone-logo-blanc.png';
import gotamPicto from '@/assets/gotam-picto.png.asset.json';
import pourQuiBg from '@/assets/pour-qui-bg.jpg';
import './studio.css';

const Realisations = () => {
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll<HTMLElement>('.lp-reveal');
    if (reduced) { els.forEach((el) => el.classList.add('lp-revealed')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('lp-revealed'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp-body" style={{ minHeight: '100vh', background: '#F2EFE9', fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}>
      <SEO
        title="Nos réalisations — Kistone Studio"
        description="Découvrez nos outils construits pour le recrutement : Hiring Plan, Plateforme Freelance et Assistant sourcing."
        path="/realisations"
      />
      <KistoneHeader onStartProject={() => setOnboardingOpen(true)} />

      <main>
        {/* REALISATIONS */}
        <div className="lp-section-wrap lp-container" id="realisations" style={{ paddingTop: 40 }}>
          <div className="lp-section lp-reveal" style={{ background: '#FFE5CC' }}>
            <div className="lp-section-tag">NOS REALISATIONS</div>
            <h2 className="lp-section-title text-5xl">Des outils construits pour le recrutement</h2>
            <div className="lp-realisations-grid">
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><img src={gotamPicto.url} alt="Gotam" width={20} height={20} style={{ display: 'block', objectFit: 'contain' }} /></div>
                <div className="lp-realisations-title">Hiring Plan</div>
                <div className="lp-realisations-desc">Gotam est une solution de planification des effectifs pour créer et suivre son plan de recrutement. Structurez vos besoins, suivez vos recrutements en temps réel.</div>
                <Link to="/product-tour/gotam" className="lp-realisations-link">En savoir plus →</Link>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-prod-badge">En prod</span>
                <div className="lp-usecase-icon"><Network size={20} /></div>
                <div className="lp-realisations-title">Plateforme Freelance</div>
                <div className="lp-realisations-desc">Automatisez la gestion de votre communauté Freelance, tarifs, disponibilité en temps réel, administratif (légal, contrats, CRA...). Le tout-en-un pour développer l'activité Freelance de son cabinet.</div>
                <Link to="/product-tour/connect" className="lp-realisations-link">En savoir plus →</Link>
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
                <div className="lp-usecase-icon"><Users size={20} /></div>
                <div className="lp-realisations-title">Plateforme CDI</div>
                <div className="lp-realisations-desc">Un pont direct entre vous et vos clients : suivi du pipeline candidat, commentaires et remarques, statistiques du funnel. Customisable à vos couleurs et votre logo.</div>
                <Link to="/product-tour/portail-client" className="lp-realisations-link">En savoir plus →</Link>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><Users size={20} /></div>
                <div className="lp-realisations-title">SIRH</div>
                <div className="lp-realisations-desc">Connectez vos outils RH et centralisez la gestion des collaborateurs, contrats, congés et fiches de paie au même endroit.</div>
                <span className="lp-realisations-link lp-realisations-link--disabled">En savoir plus →</span>
              </div>
              <div className="lp-realisations-card">
                <span className="lp-live-badge">Live</span>
                <div className="lp-usecase-icon"><Network size={20} /></div>
                <div className="lp-realisations-title">ATS</div>
                <div className="lp-realisations-desc">Pilotez l'ensemble de vos processus de recrutement : publication d'offres, parsing de CV, scoring et suivi des candidatures.</div>
                <span className="lp-realisations-link lp-realisations-link--disabled">En savoir plus →</span>
              </div>
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

        {/* CTA DÉMARRER */}
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

      <div className="lp-footer-wrap">
        <div className="lp-footer lp-container">
          <div className="lp-footer-logo">
            <img src={kistoneLogoLight} alt="Kistone Studio logo" className="lp-logo-img" />
          </div>
          <ul className="lp-footer-links">
            <li><Link to="/studio#process">Comment ça marche</Link></li>
            <li><Link to="/realisations">Nos réalisations</Link></li>
            <li><Link to="/studio#why">Pourquoi Kistone</Link></li>
            <li><a href="mailto:aguego@kistone.fr">Contact</a></li>
          </ul>
          <div className="lp-footer-copy">© 2026 Kistone Studio</div>
        </div>
      </div>
    </div>
  );
};

export default Realisations;
