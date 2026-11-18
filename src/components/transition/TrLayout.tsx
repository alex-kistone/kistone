import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROLES, rolePath } from "@/content/transition";
import "@/site/transition.css";

const MENU = [
  { href: "/#cabinet", label: "Le cabinet" },
  { href: "/#expertises", label: "Expertises" },
  { href: "/#methodologie", label: "Méthodologie" },
  { href: "/#garanties", label: "Garanties" },
  { href: "/#faq", label: "Questions" },
];

/** En-tête du site, aussi utilisé par les écrans de connexion (KistoneHeader). */
export function TrHeader() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth > 1080 && setOpen(false);
    addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
    return () => { removeEventListener("keydown", onKey); removeEventListener("resize", onResize); };
  }, [open]);

  return (
    <header className="header">
      <div className="wrap">
        <Link className="logo" to="/" aria-label="Kistone, accueil">
          <img src="/transition/logo-full-black.png" alt="kistone" width={118} height={34} />
        </Link>
        <nav className="menu" aria-label="Navigation principale">
          {MENU.map((m) => <a key={m.href} href={m.href}>{m.label}</a>)}
          <Link to="/login">Connexion</Link>
        </nav>
        <a className="btn btn-dark btn-sm" href="/#contact">Trouver un manager</a>
        <button className="burger" type="button" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>
      <nav className="mobile-menu" id="mobile-menu" aria-label="Menu mobile" hidden={!open} onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
        {MENU.map((m) => <a key={m.href} href={m.href}>{m.label}</a>)}
        <Link to="/login">Connexion</Link>
        <a className="btn btn-dark btn-block" href="/#contact">Trouver un manager</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <Link className="logo" to="/"><img src="/transition/logo-full-white.png" alt="kistone" width={208} height={60} /></Link>
            <p style={{ marginTop: 18, maxWidth: 320 }}>Cabinet de management de transition. Des dirigeants expérimentés pour la direction générale et les fonctions clés des PME, ETI et groupes.</p>
          </div>
          <div>
            <h4>Expertises</h4>
            <ul>{ROLES.slice(0, 6).map((r) => <li key={r.slug}><Link to={rolePath(r)}>{r.short}</Link></li>)}</ul>
          </div>
          <div>
            <h4>&nbsp;</h4>
            <ul>{ROLES.slice(6).map((r) => <li key={r.slug}><Link to={rolePath(r)}>{r.short}</Link></li>)}</ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><a href="/#contact">Trouver un manager</a></li>
              <li><a href="/#faq">Questions fréquentes</a></li>
              <li><Link to="/register">Rejoindre le réseau</Link></li>
              <li><Link to="/login">Connexion</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} Kistone</span>
          <span><Link to="/cgu">CGU</Link> · <Link to="/privacy">Politique de confidentialité</Link></span>
        </div>
      </div>
    </footer>
  );
}

/** Gabarit des pages publiques du cabinet (style repris de transition.kistone.fr). */
export default function TrLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tr">
      <TrHeader />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
