import type { MouseEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { KYC_STATUS, type KycStatus } from "@/lib/kyc";
import { cn } from "@/lib/utils";
import { ADMIN_KYC_LABEL, useOpenDossier } from "./kycDossiers";

interface Props {
  userId: string;
  status: KycStatus;
  /** Nom du titulaire, pour le libellé accessible. */
  name: string;
  className?: string;
}

/** Pastille du statut KYC d'un compte ; un clic ouvre son dossier dans le panneau latéral. */
const KycStatusPill = ({ userId, status, name, className }: Props) => {
  const openDossier = useOpenDossier();
  const label = ADMIN_KYC_LABEL[status];
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openDossier(userId);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Dossier de ${name} : ${label}`}
      title="Voir le dossier"
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        KYC_STATUS[status].tone,
        className,
      )}
    >
      <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">Dossier {label.toLowerCase()}</span>
    </button>
  );
};

export default KycStatusPill;
