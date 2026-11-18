import { TrHeader } from "@/components/transition/TrLayout";

/**
 * En-tête des pages hors site (connexion, inscription, dépôt de besoin) : celui du site du
 * cabinet. `display: contents` applique le style .tr sans casser le sticky.
 */
const KistoneHeader = () => (
  <div className="tr contents">
    <TrHeader />
  </div>
);

export default KistoneHeader;
