import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import TrLayout from "@/components/transition/TrLayout";
import Callback from "@/components/transition/Callback";
import { ArrowRight, Check, Icon, Watermark } from "@/components/transition/TrBits";
import { FAQ, GUARANTEES, ROLES, SITUATIONS, STEPS, rolePath } from "@/content/transition";
import { withIdentity } from "@/lib/structuredData";

/** Accueil : cabinet de management de transition (repris de transition.kistone.fr). */
export default function Home() {
  return (
    <TrLayout>
      <SEO
        title="Kistone · Cabinet de management de transition"
        description="Cabinet de management de transition : des dirigeants expérimentés pour la direction générale et les fonctions clés, short-list sous 48 heures, en poste sous une semaine."
        path="/"
        jsonLd={withIdentity({
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        })}
      />

      <section className="hero on-dark">
        <Watermark style={{ width: 560, height: 920, right: -120, top: -160, transform: "rotate(12deg)" }} />
        <div className="wrap">
          <div>
            <span className="kicker">Cabinet de management de transition</span>
            <h1>Des dirigeants d'expérience pour <em>les moments décisifs</em> de votre entreprise.</h1>
            <p className="lead">Direction générale, finance, ressources humaines, opérations, recrutement : nous mettons à votre disposition des managers de transition confirmés, en poste sous une semaine, avec un mandat et des objectifs clairs.</p>
            <div className="hero-actions">
              <a className="btn btn-green" href="#contact">Trouver un manager</a>
              <a className="btn btn-line" href="#expertises">Nos expertises</a>
            </div>
            <div className="hero-proof">
              <span><Check /> Managers rencontrés et références vérifiées</span>
              <span><Check /> Un associé référent par mission</span>
              <span><Check /> Confidentialité absolue</span>
            </div>
          </div>
          <Callback title="Être rappelé·e par un associé" sub="Décrivez votre besoin. Nous revenons vers vous sous 24 h ouvrées." compact />
        </div>
      </section>

      <section className="facts" aria-label="Nos engagements">
        <div className="wrap">
          <div className="fact"><b>48<small>h</small></b><span>pour vous présenter une short-list de managers</span></div>
          <div className="fact"><b>1<small>sem.</small></b><span>pour la prise de fonction du manager retenu</span></div>
          <div className="fact"><b>30<small>min</small></b><span>d'échange avec un associé pour cadrer votre besoin</span></div>
          <div className="fact"><b>1000<small>+</small></b><span>profils qualifiés au sein du réseau</span></div>
        </div>
      </section>

      <section className="sec" id="cabinet">
        <div className="wrap" style={{ position: "relative" }}>
          <div className="about">
            <div>
              <span className="kicker">Le cabinet</span>
              <h2 style={{ marginTop: 18 }}>L'expertise d'un dirigeant, le réseau d'un cabinet.</h2>
              <figure className="portrait">
                <img src="/transition/alexandre-guego.jpg" alt="Alexandre Guégo, associé fondateur" width={900} height={1349} loading="lazy" />
              </figure>
            </div>
            <div className="about-text">
              <p>Quand une fonction clé se libère ou qu'une situation se tend, le temps joue contre l'entreprise. Notre métier : y répondre en quelques jours, avec la bonne personne.</p>
              <p>Nous accompagnons les dirigeants, actionnaires et conseils d'administration de PME, d'ETI et de groupes. Chaque mission est confiée à un manager qui a déjà mené des situations comparables, et suivie par un associé du cabinet jusqu'à son terme.</p>
              <p>Notre réseau réunit d'anciens directeurs généraux, directeurs financiers, DRH, directeurs industriels, directeurs des systèmes d'information et responsables recrutement, sélectionnés pour leur expérience, leur sens de l'engagement et leur discrétion.</p>
              <div className="signature"><div><b>Alexandre Guégo</b><span>Associé fondateur</span></div></div>
            </div>
          </div>
          <div className="values"><span className="kicker">Nos valeurs</span></div>
          <div className="pillars">
            <div className="pillar"><span className="num">01</span><h3>Réactivité</h3><p>Une short-list sous 48 heures et un manager en poste sous une semaine, quand chaque jour compte.</p></div>
            <div className="pillar"><span className="num">02</span><h3>Engagement</h3><p>Un mandat, des objectifs datés, une obligation de rendre compte à chaque étape.</p></div>
            <div className="pillar"><span className="num">03</span><h3>Discrétion</h3><p>Une intervention confidentielle, respectueuse de vos équipes et de vos partenaires.</p></div>
          </div>
        </div>
      </section>

      <section className="sec sec-paper" id="expertises">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="kicker">Nos expertises</span><h2>Nos domaines d'intervention.</h2></div>
            <p className="lead">Pour chaque fonction : le contexte d'intervention, les missions confiées, les livrables attendus et le profil des managers que nous présentons.</p>
          </div>
          <div className="xp-list">
            {ROLES.map((r, i) => (
              <Link key={r.slug} className="xp-row" to={rolePath(r)}>
                <span className="xp-n">{String(i + 1).padStart(2, "0")}</span>
                <div className="xp-title"><h3>{r.short}</h3><span>{r.label.split(" · ").slice(0, 3).join(" · ")}</span></div>
                <p>{r.pitch}</p>
                <div className="xp-dur"><b>Durée indicative</b>{r.duree}</div>
                <span className="xp-go" aria-hidden="true"><ArrowRight /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="situations">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="kicker">Quand intervenir</span><h2>Nos typologies de missions.</h2></div>
            <p className="lead">Un recrutement prend plusieurs mois. Une intervention de transition permet de sécuriser la fonction immédiatement, sans compromettre le recrutement définitif.</p>
          </div>
          <div className="grid-lines">
            {SITUATIONS.map(([tag, title, text]) => (
              <div key={tag}><span className="tag">{tag}</span><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-dark on-dark" id="methodologie">
        <Watermark style={{ width: 420, height: 690, left: -140, bottom: -260, transform: "rotate(-12deg)" }} />
        <div className="wrap">
          <div className="sec-head">
            <div><span className="kicker">Notre méthodologie</span><h2>Du premier appel à la passation, un cadre éprouvé.</h2></div>
            <p className="lead">Quatre étapes, un associé référent, des objectifs écrits. Vous gardez la maîtrise de chaque décision.</p>
          </div>
          <div className="steps">
            {STEPS.map(([when, title, text], i) => (
              <div key={title} className="step">
                <div className="step-head"><span className="step-dot">0{i + 1}</span></div>
                <span className="when">{when}</span><h3>{title}</h3><p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="garanties">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="kicker">Nos garanties</span><h2>Ce sur quoi vous pouvez compter.</h2></div>
            <p className="lead">Confier une fonction de direction à un intervenant extérieur demande de la confiance. Voici nos engagements.</p>
          </div>
          <div className="guarantees">
            {GUARANTEES.map(([icon, title, text]) => (
              <div key={title} className="guarantee"><span className="g-icon"><Icon paths={icon} /></span><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-dark on-dark" id="rejoindre">
        <Watermark style={{ width: 380, height: 620, right: -100, top: -120, transform: "rotate(14deg)" }} />
        <div className="wrap">
          <div className="sec-head">
            <div><span className="kicker">Vous êtes manager de transition</span><h2>Rejoignez notre réseau de dirigeants.</h2></div>
            <div style={{ display: "grid", gap: 28, justifyItems: "start" }}>
              <p className="lead">Des missions qualifiées par un associé, un cadre contractuel géré par le cabinet, un interlocuteur unique pendant toute la mission. Votre profil se crée en quelques minutes.</p>
              <Link className="btn btn-green" to="/register">Rejoindre le réseau</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sec sec-paper" id="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div className="faq-side">
              <span className="kicker">Questions fréquentes</span>
              <h2>Vos questions, nos réponses.</h2>
              <p className="lead">Une question sur votre situation ? Un associé vous répond directement.</p>
              <div><a className="arrow-link" href="#contact">Poser une question <ArrowRight /></a></div>
            </div>
            <div className="faq">
              {FAQ.map((f, i) => (
                <details key={f.q} open={i === 0}><summary>{f.q}</summary><div className="answer">{f.a}</div></details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec sec-dark on-dark" id="contact">
        <Watermark style={{ width: 380, height: 620, right: -100, top: -120, transform: "rotate(14deg)" }} />
        <div className="wrap contact">
          <div>
            <span className="kicker">Contact</span>
            <h2 style={{ marginTop: 18 }}>Parlons de votre situation, en toute confidentialité.</h2>
            <p className="lead" style={{ marginTop: 20 }}>Un associé du cabinet vous rappelle pour comprendre votre contexte et vous proposer, le cas échéant, une short-list sous 48 heures.</p>
            <ul className="contact-list">
              <li><Check /><div><b>Confidentiel</b>Votre demande n'est lue que par un associé du cabinet</div></li>
              <li><Check /><div><b>Rappel sous 24 h ouvrées</b>Pour comprendre votre contexte et vos enjeux</div></li>
              <li><Check /><div><b>Short-list sous 48 heures</b>Des managers ayant déjà mené des missions comparables</div></li>
            </ul>
          </div>
          <Callback title="Trouver un manager" sub="Tous les champs sont confidentiels et ne servent qu'à préparer notre échange." />
        </div>
      </section>
    </TrLayout>
  );
}
