import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import TrLayout from "@/components/transition/TrLayout";
import { ROLES, rolePath } from "@/content/transition";

/**
 * Page introuvable. Pré-rendue en dist/404.html et servie par Vercel avec le statut 404 : les
 * adresses inconnues ne sont pas indexées comme des pages (pas de « soft 404 »).
 */
const NotFound = () => (
  <TrLayout>
    <Helmet>
      <title>Page introuvable | Kistone</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <section className="sec">
      <div className="wrap" style={{ display: "grid", gap: 22, justifyItems: "start" }}>
        <span className="kicker">Erreur 404</span>
        <h1>Cette page n'existe pas.</h1>
        <p className="lead">Elle a peut-être changé d'adresse. Voici où trouver ce que vous cherchez.</p>
        <div className="hero-actions" style={{ marginTop: 8 }}>
          <Link className="btn btn-dark" to="/">Retour à l'accueil</Link>
          <a className="btn btn-line" href="/#contact">Trouver un manager</a>
        </div>
        <div className="others" style={{ marginTop: 32, width: "100%" }}>
          {ROLES.map((r) => <Link key={r.slug} to={rolePath(r)}><span>{r.short}</span><small>{r.duree}</small></Link>)}
        </div>
      </div>
    </section>
  </TrLayout>
);

export default NotFound;
