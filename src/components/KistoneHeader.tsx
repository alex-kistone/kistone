import Navbar from "@/components/site/Navbar";
import "@/site/site.css";

/**
 * En-tête des pages de la plateforme : exactement celui de la landing.
 * La déconnexion se fait depuis chaque espace (client, freelance, admin).
 * `display: contents` applique le scope .ks-site sans casser le sticky.
 */
const KistoneHeader = () => (
  <div className="ks-site contents">
    <Navbar />
  </div>
);

export default KistoneHeader;
