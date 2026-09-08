import { useEffect, useState } from "react";
import KistoneHeader from "@/components/KistoneHeader";
import SEO from "@/components/SEO";
import StudioOnboardingDialog from "@/components/studio/StudioOnboardingDialog";
import alexandreFounder from "@/assets/alexandre-founder.png";
import claudeLogo from "@/assets/tools/claude.svg";
import googleAiStudioLogo from "@/assets/tools/google-ai-studio.png";
import lovableLogo from "@/assets/tools/lovable.png";
import githubLogo from "@/assets/tools/github.svg";
import supabaseLogo from "@/assets/tools/supabase.webp";
import kistoneLogoLight from "@/assets/kistone-logo-blanc.png";
import "@/pages/studio.css";

const whyItems = [
  {
    title: "Nous avons fait votre métier",
    desc: "16 ans dans les RH. Cabinet, missions, sourcing, qualification, négo, reporting client. Nous avons vécu vos outils — nous savons pourquoi ils ne suivent pas.",
  },
  {
    title: "Nous codons à votre vitesse",
    desc: "15 jours du brief au déploiement. Pas 6 mois de cadrage, pas de comité. Stack AI-native pour aller vite sans sacrifier la qualité — sur-mesure, vraiment.",
  },
  {
    title: "C'est votre outil, pas une licence",
    desc: "Code propriétaire, hébergement chez vous si vous le souhaitez, modifiable. Pas de SaaS qui vous tient en otage. Votre méthode, votre outil.",
  },
];

const PourquoiKistone = () => {
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    document.title = "Pourquoi Kistone — HR Product Builder";
  }, []);

  return (
    <div className="lp-body">
      <SEO
        title="Pourquoi Kistone — HR Product Builder pour recruteurs"
        description="16 ans de recrutement, une stack AI-native et un studio qui code vos outils en 15 jours. Découvrez pourquoi Kistone change la donne pour vos équipes RH."
        path="/pourquoi-kistone"
      />
      <KistoneHeader onStartProject={() => setOnboardingOpen(true)} />
      <StudioOnboardingDialog open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      {/* ORIGIN */}
      <div className="lp-section-wrap lp-container" style={{ paddingTop: 80 }}>
        <div className="lp-origin">
          <div className="lp-origin-photo">
            <img src={alexandreFounder} alt="Alexandre, fondateur de Kistone Studio" loading="lazy" />
          </div>
          <div className="lp-origin-body">
            <div className="lp-section-tag">L'ORIGINE</div>
            <h1 className="lp-origin-title">L'origine de Kistone Studio.</h1>
            <p className="lp-origin-p">
              Pendant 16 ans, j'ai travaillé dans le monde du recrutement. J'ai sourcé, qualifié,
              négocié, livré, reporté. J'ai utilisé plusieurs ATS du marché — et j'ai bricolé sur
              Notion, Airtable, Excel pour combler ce qu'ils ne savent pas faire.
            </p>
            <p className="lp-origin-p">
              Avec l'arrivée de l'IA et des outils de vibe coding, j'ai réalisé qu'on pouvait coder
              en 15 jours ce que les éditeurs mettent 3 mois à sortir — et toujours cher. Kistone
              Studio est né de cette intuition : un studio qui code pour les recruteurs afin
              d'améliorer leur productivité et réduire les tâches répétitives sans valeur ajoutée.
            </p>
            <div className="lp-origin-sign">
              <div className="lp-origin-name">— Alexandre</div>
            </div>
          </div>
        </div>
      </div>

      {/* WHY KISTONE */}
      <div className="lp-section-wrap lp-container">
        <div className="lp-section">
          <div className="lp-section-tag">POURQUOI KISTONE</div>
          <h2 className="lp-section-title">
            Le recrutement change. Votre stack doit aussi changer.
          </h2>
          <p className="lp-section-sub">
            Tenu par un recruteur, pas par un éditeur. Trois raisons concrètes pour lesquelles nos
            clients arrêtent de bricoler — et démarrent avec nous.
          </p>
          <div className="lp-why-grid">
            {whyItems.map((it, i) => (
              <div className="lp-why-card" key={i}>
                <div className="lp-why-num">0{i + 1}</div>
                <div className="lp-why-title">{it.title}</div>
                <p className="lp-why-desc">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOOLS */}
      <div className="lp-section-wrap lp-container">
        <div className="lp-section">
          <div className="lp-section-tag">NOTRE STACK</div>
          <h2 className="lp-section-title">Les outils qui nous font gagner du temps.</h2>
          <p className="lp-section-sub">
            Une stack AI-native, choisie pour livrer vite sans sacrifier la qualité.
          </p>
          <div className="lp-tools-row">
            <div className="lp-tool-item">
              <img src={lovableLogo} alt="Lovable" loading="lazy" />
              <span>Lovable</span>
            </div>
            <div className="lp-tool-item">
              <img src={claudeLogo} alt="Claude" loading="lazy" />
              <span>Claude</span>
            </div>
            <div className="lp-tool-item">
              <img src={googleAiStudioLogo} alt="Google AI Studio" loading="lazy" />
              <span>Google AI Studio</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="lp-cta-wrap lp-container">
        <div className="lp-cta">
          <div className="lp-section-tag">DÉMARRER</div>
          <h2 className="lp-cta-title">
            Nous construisons votre
            <br />
            <span className="lp-accent">prochain outil ?</span>
          </h2>
          <p className="lp-cta-sub">
            Dites-nous où vos recruteurs perdent du temps. Réponse sous 24h avec proposition claire
            et prix fixe.
          </p>
          <a href="mailto:alex@gotam.ai" className="lp-btn-primary">
            Partagez votre idée ⚡
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <div className="lp-footer-wrap">
        <div className="lp-footer lp-container">
          <div className="lp-footer-logo">
            <img src={kistoneLogoLight} alt="Kistone Studio" className="lp-logo-img" />
          </div>
          <ul className="lp-footer-links">
            <li><a href="/#process">Comment ça marche</a></li>
            <li><a href="/#realisations">Nos réalisations</a></li>
            <li><a href="/pourquoi-kistone">Pourquoi Kistone</a></li>
            <li><a href="mailto:aguego@kistone.fr">Contact</a></li>
          </ul>
          <div className="lp-footer-copy">© 2026 Kistone Studio</div>
        </div>
      </div>
    </div>
  );
};

export default PourquoiKistone;
