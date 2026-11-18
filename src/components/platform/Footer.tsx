import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t bg-card/50 py-6">
    <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
      <span>© {new Date().getFullYear()} Kistone. Tous droits réservés.</span>
      <div className="flex gap-4">
        <Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
