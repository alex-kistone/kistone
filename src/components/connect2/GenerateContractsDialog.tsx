import { useState } from "react";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateClientContract, generateContractorContract } from "@/lib/contracts";
import type { ContractData } from "@/lib/contracts";

interface Props {
  open: boolean;
  onClose: () => void;
  mission: {
    id: string;
    title: string;
    company_name: string;
    location: string;
    recruiter_tjm: number;
    client_tjm: number;
    start_date: string;
    end_date: string | null;
    duration_text: string | null;
    recruiter_profile_id: string;
    need_id: string;
  };
}

const GenerateContractsDialog = ({ open, onClose, mission }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);

  // Editable overrides for missing legal fields
  const [overrides, setOverrides] = useState({
    clientLegalForm: "",
    clientSiren: "",
    clientAddress: "",
    clientRepresentativeName: "",
    clientRepresentativeTitle: "",
    recruiterCompanyName: "",
    recruiterLegalForm: "",
    recruiterSiren: "",
    recruiterAddress: "",
    recruiterTvaNumber: "",
  });

  const loadData = async () => {
    setLoading(true);

    // Fetch recruiter profile
    const { data: recruiter } = await supabase
      .from("recruiter_profiles")
      .select("*")
      .eq("id", mission.recruiter_profile_id)
      .single();

    // Fetch need
    const { data: need } = await supabase
      .from("client_needs")
      .select("*")
      .eq("id", mission.need_id)
      .single();

    // Fetch client profile
    let clientProfile: any = null;
    if (need) {
      const { data: cp } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", need.user_id)
        .maybeSingle();
      clientProfile = cp;
    }

    const data: ContractData = {
      missionTitle: mission.title,
      missionLocation: mission.location,
      startDate: mission.start_date,
      endDate: mission.end_date,
      durationText: mission.duration_text,
      recruiterTjm: mission.recruiter_tjm,
      clientTjm: mission.client_tjm,
      clientCompanyName: clientProfile?.company_name || need?.company_name || mission.company_name,
      clientLegalForm: (clientProfile as any)?.legal_form || "",
      clientSiren: (clientProfile as any)?.siren || "",
      clientAddress: (clientProfile as any)?.company_address || "",
      clientRepresentativeName: (clientProfile as any)?.representative_name || (clientProfile ? `${clientProfile.first_name} ${clientProfile.last_name}` : need?.contact_name || ""),
      clientRepresentativeTitle: (clientProfile as any)?.representative_title || "",
      clientContactName: need?.contact_name || "",
      clientContactEmail: need?.contact_email || "",
      recruiterFirstName: recruiter?.first_name || "",
      recruiterLastName: recruiter?.last_name || "",
      recruiterCompanyName: (recruiter as any)?.company_name || "",
      recruiterLegalForm: (recruiter as any)?.legal_form || "",
      recruiterSiren: (recruiter as any)?.siren || "",
      recruiterAddress: (recruiter as any)?.company_address || "",
      recruiterTvaNumber: (recruiter as any)?.tva_number || "",
      recruiterEmail: recruiter?.email || "",
      recruiterPhone: recruiter?.phone || "",
      needDescription: need?.description || "",
      needJobTitle: need?.job_title || mission.title,
      remotePolicy: need?.remote_policy || "on-site",
    };

    setContractData(data);
    setOverrides({
      clientLegalForm: data.clientLegalForm,
      clientSiren: data.clientSiren,
      clientAddress: data.clientAddress,
      clientRepresentativeName: data.clientRepresentativeName,
      clientRepresentativeTitle: data.clientRepresentativeTitle,
      recruiterCompanyName: data.recruiterCompanyName,
      recruiterLegalForm: data.recruiterLegalForm,
      recruiterSiren: data.recruiterSiren,
      recruiterAddress: data.recruiterAddress,
      recruiterTvaNumber: data.recruiterTvaNumber,
    });

    setDataLoaded(true);
    setLoading(false);
  };

  const getMergedData = (): ContractData => ({
    ...contractData!,
    ...overrides,
  });

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadClient = async () => {
    try {
      const blob = await generateClientContract(getMergedData());
      downloadBlob(blob, `Contrat_Client_${contractData!.clientCompanyName.replace(/\s+/g, "_")}.docx`);
      toast({ title: "Contrat client téléchargé !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDownloadContractor = async () => {
    try {
      const blob = await generateContractorContract(getMergedData());
      downloadBlob(blob, `Contrat_Consultant_${contractData!.recruiterFirstName}_${contractData!.recruiterLastName}.docx`);
      toast({ title: "Contrat consultant téléchargé !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDownloadBoth = async () => {
    await handleDownloadClient();
    setTimeout(() => handleDownloadContractor(), 500);
  };

  const missingFields = dataLoaded ? Object.entries(overrides).filter(([, v]) => !v) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer les contrats
          </DialogTitle>
          <DialogDescription>
            {mission.title} — {mission.company_name}
          </DialogDescription>
        </DialogHeader>

        {!dataLoaded ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Charger les données de la mission pour pré-remplir les contrats client et consultant.
            </p>
            <Button onClick={loadData} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Charger les données
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Missing fields warning */}
            {missingFields.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {missingFields.length} champ(s) manquant(s) — complétez ci-dessous
                </p>
              </div>
            )}

            {/* Client fields */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Informations Client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Forme juridique</Label>
                  <Input value={overrides.clientLegalForm} onChange={(e) => setOverrides(o => ({ ...o, clientLegalForm: e.target.value }))} placeholder="SAS, SARL, SA..." />
                </div>
                <div>
                  <Label className="text-xs">SIREN</Label>
                  <Input value={overrides.clientSiren} onChange={(e) => setOverrides(o => ({ ...o, clientSiren: e.target.value }))} placeholder="XXX XXX XXX" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Adresse de la société</Label>
                  <Input value={overrides.clientAddress} onChange={(e) => setOverrides(o => ({ ...o, clientAddress: e.target.value }))} placeholder="Adresse complète" />
                </div>
                <div>
                  <Label className="text-xs">Représentant légal</Label>
                  <Input value={overrides.clientRepresentativeName} onChange={(e) => setOverrides(o => ({ ...o, clientRepresentativeName: e.target.value }))} placeholder="Nom complet" />
                </div>
                <div>
                  <Label className="text-xs">Qualité du représentant</Label>
                  <Input value={overrides.clientRepresentativeTitle} onChange={(e) => setOverrides(o => ({ ...o, clientRepresentativeTitle: e.target.value }))} placeholder="DG, PDG, DRH..." />
                </div>
              </div>
            </div>

            {/* Contractor fields */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Informations Consultant — {contractData?.recruiterFirstName} {contractData?.recruiterLastName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nom de la société</Label>
                  <Input value={overrides.recruiterCompanyName} onChange={(e) => setOverrides(o => ({ ...o, recruiterCompanyName: e.target.value }))} placeholder="Nom société" />
                </div>
                <div>
                  <Label className="text-xs">Forme juridique</Label>
                  <Input value={overrides.recruiterLegalForm} onChange={(e) => setOverrides(o => ({ ...o, recruiterLegalForm: e.target.value }))} placeholder="EURL, SAS, Micro..." />
                </div>
                <div>
                  <Label className="text-xs">SIREN</Label>
                  <Input value={overrides.recruiterSiren} onChange={(e) => setOverrides(o => ({ ...o, recruiterSiren: e.target.value }))} placeholder="XXX XXX XXX" />
                </div>
                <div>
                  <Label className="text-xs">N° TVA intracommunautaire</Label>
                  <Input value={overrides.recruiterTvaNumber} onChange={(e) => setOverrides(o => ({ ...o, recruiterTvaNumber: e.target.value }))} placeholder="FR XX XXXXXXXXX" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Adresse de la société</Label>
                  <Input value={overrides.recruiterAddress} onChange={(e) => setOverrides(o => ({ ...o, recruiterAddress: e.target.value }))} placeholder="Adresse complète" />
                </div>
              </div>
            </div>

            {/* Mission recap */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <h4 className="font-semibold mb-1">Récapitulatif mission</h4>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Poste : {contractData?.needJobTitle}</span>
                <span>Lieu : {contractData?.missionLocation}</span>
                <span>Début : {contractData?.startDate ? new Date(contractData.startDate).toLocaleDateString("fr-FR") : "—"}</span>
                <span>Fin : {contractData?.endDate ? new Date(contractData.endDate).toLocaleDateString("fr-FR") : "—"}</span>
                <span>TJM Freelance : {contractData?.recruiterTjm}€</span>
                <span>TJM Client : {contractData?.clientTjm}€</span>
              </div>
            </div>

            {/* Download buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleDownloadClient} variant="outline" className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Contrat Client (DOCX)
              </Button>
              <Button onClick={handleDownloadContractor} variant="outline" className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Contrat Consultant (DOCX)
              </Button>
              <Button onClick={handleDownloadBoth} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Télécharger les 2
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerateContractsDialog;
