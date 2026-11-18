import { Link, Navigate, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import TrLayout from "@/components/transition/TrLayout";
import Callback from "@/components/transition/Callback";
import { Check, Watermark } from "@/components/transition/TrBits";
import { ROLES, roleBySlug, rolePath } from "@/content/transition";

/** Fiche de poste d'une fonction (/expertises/:slug), au format document. */
export default function ExpertisePage() {
  const { slug } = useParams();
  const r = roleBySlug(slug);
  if (!r) return <Navigate to="/#expertises" replace />;
  const others = ROLES.filter((x) => x.slug !== r.slug);

  return (
    <TrLayout>
      <SEO title={`${r.title} · Kistone`} description={`Fiche de poste : ${r.title}. ${r.pitch}`} path={rolePath(r)} />

      <section className="job-head on-dark">
        <Watermark style={{ width: 420, height: 690, right: -60, top: -140, transform: "rotate(12deg)" }} />
        <div className="wrap">
          <nav className="crumbs" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link><span>/</span><a href="/#expertises">Expertises</a><span>/</span>
            <span style={{ color: "var(--cream)" }}>{r.short}</span>
          </nav>
          <h1>{r.title}</h1>
          <p className="lead">{r.pitch}</p>
          <div className="job-meta">
            <div><b>Rattachement</b>{r.rattachement}</div>
            <div><b>Durée indicative</b>{r.duree}</div>
            <div><b>Prise de fonction</b>Sous une semaine</div>
            <div><b>Format</b>Temps plein ou partagé</div>
          </div>
        </div>
      </section>

      <div className="wrap job-body">
        <nav className="toc" aria-label="Sommaire">
          <b>Sommaire</b>
          <a href="#contexte">Contexte</a>
          <a href="#situations">Situations types</a>
          <a href="#missions">Missions</a>
          <a href="#livrables">Livrables</a>
          <a href="#profil">Profil</a>
        </nav>
        <div className="doc">
          <section id="contexte"><span className="s-num">01</span><h2>Contexte de l'intervention</h2><p>{r.context}</p></section>
          <section id="situations"><span className="s-num">02</span><h2>Situations types</h2><div className="chips">{r.situations.map((s) => <span key={s}>{s}</span>)}</div></section>
          <section id="missions"><span className="s-num">03</span><h2>Missions confiées</h2><ol className="olist">{r.missions.map((m) => <li key={m}><span>{m}</span></li>)}</ol></section>
          <section id="livrables"><span className="s-num">04</span><h2>Livrables attendus</h2>
            <div className="deliverables">{r.livrables.map((l) => <div key={l}><Check /><span>{l}</span></div>)}</div>
          </section>
          <section id="profil"><span className="s-num">05</span><h2>Profil des managers présentés</h2>
            <ul className="ulist">{r.profil.map((p) => <li key={p}><Check /><span>{p}</span></li>)}</ul>
          </section>
        </div>
        <aside className="side">
          <Callback key={r.slug} title="Recevoir des profils" sub="Short-list de managers sous 48 heures." selected={r.slug} compact />
          <div className="side-box">
            <b>Préférez-vous en parler ?</b>
            <span>Laissez votre numéro dans le formulaire : un associé vous rappelle sous 24 h ouvrées.</span>
            <button className="btn btn-line btn-sm" type="button" onClick={() => window.print()}>Imprimer la fiche</button>
          </div>
        </aside>
      </div>

      <section className="sec others-sec" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="kicker">Autres expertises</span>
          <div className="others" style={{ marginTop: 24 }}>
            {others.map((x) => <Link key={x.slug} to={rolePath(x)}><span>{x.short}</span><small>{x.duree}</small></Link>)}
          </div>
        </div>
      </section>
    </TrLayout>
  );
}
