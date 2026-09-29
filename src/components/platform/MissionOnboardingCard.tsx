import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Download, FileSignature, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KYC_STATUS, type KycDossier, type KycParty } from "@/lib/kyc";
import { cn } from "@/lib/utils";

interface ContractRow {
  status: "draft" | "sent" | "signed" | "declined" | "expired";
  document_path: string | null;
  signed_document_path: string | null;
}

const CONTRACT_LABEL: Record<ContractRow["status"], string> = {
  draft: "À signer",
  sent: "Envoyé pour signature",
  signed: "Signé",
  declined: "Signature refusée",
  expired: "Demande expirée",
};

/**
 * Mission « en mise en place » : ce qu'il reste à faire à cette partie avant le
 * démarrage (son dossier, son contrat). Chaque partie ne voit que les siens.
 */
export default function MissionOnboardingCard({
  missionId, party, userId, dossierHref,
}: { missionId: string; party: KycParty; userId: string; dossierHref: string }) {
  const { toast } = useToast();
  const [dossier, setDossier] = useState<KycDossier | null>(null);
  const [contract, setContract] = useState<ContractRow | null>(null);

  useEffect(() => {
    (async () => {
      const [d, c] = await Promise.all([
        supabase.from("kyc_dossiers" as never).select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("contracts" as never).select("status, document_path, signed_document_path")
          .eq("mission_id", missionId).eq("party", party).maybeSingle(),
      ]);
      setDossier((d.data as KycDossier | null) ?? null);
      setContract((c.data as ContractRow | null) ?? null);
    })();
  }, [missionId, party, userId]);

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("contracts").createSignedUrl(path, 300);
    if (error || !data) toast({ title: "Téléchargement impossible", description: error?.message, variant: "destructive" });
    else window.open(data.signedUrl, "_blank", "noopener");
  };

  const dossierDone = dossier?.status === "approved";
  const contractDone = contract?.status === "signed";

  return (
    <section aria-labelledby={`onboarding-${missionId}`} className="rounded-2xl border border-border bg-muted/50 p-4 sm:p-5">
      <h3 id={`onboarding-${missionId}`} className="font-semibold">Mission en préparation</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Elle démarre dès que les dossiers sont validés et les contrats signés par les deux parties.
      </p>
      <ul className="mt-4 space-y-3">
        <li className="flex flex-col gap-2 rounded-xl bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2.5">
            {dossierDone ? <CheckCircle2 className="h-5 w-5 text-[#1F9D5B]" aria-hidden="true" /> : <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">Votre dossier</span>
            {dossier ? (
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", KYC_STATUS[dossier.status].tone)}>
                {KYC_STATUS[dossier.status].label}
              </span>
            ) : null}
          </span>
          {!dossierDone ? (
            <Button asChild size="sm" variant="outline">
              <Link to={dossierHref}>{dossier?.status === "submitted" ? "Voir mon dossier" : "Compléter mon dossier"}</Link>
            </Button>
          ) : null}
        </li>
        <li className="flex flex-col gap-2 rounded-xl bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2.5">
            {contractDone ? <CheckCircle2 className="h-5 w-5 text-[#1F9D5B]" aria-hidden="true" /> : <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
            <FileSignature className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">Votre contrat</span>
            <span className="text-sm text-muted-foreground">
              {contract ? CONTRACT_LABEL[contract.status] : "En préparation par l'équipe Kistone"}
            </span>
          </span>
          <span className="flex flex-wrap gap-2">
            {contract?.signed_document_path ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => download(contract.signed_document_path!)}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Version signée
              </Button>
            ) : contract?.document_path ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => download(contract.document_path!)}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Télécharger
              </Button>
            ) : null}
          </span>
        </li>
      </ul>
    </section>
  );
}
