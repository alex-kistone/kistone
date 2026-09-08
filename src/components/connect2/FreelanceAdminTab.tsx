import { useState } from "react";
import { Upload, FileText, Trash2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CompanySearch, { type CompanyData } from "@/components/connect2/CompanySearch";

interface DocumentUploadProps {
  label: string;
  description: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  userId: string;
  folder: string;
}

const DocumentUpload = ({ label, description, currentUrl, onUploaded, onRemoved, userId, folder }: DocumentUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "Fichier trop volumineux", description: "La taille maximale est de 10 Mo.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${folder}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-documents")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Generate a signed URL (private bucket)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("admin-documents")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      if (signedError) throw signedError;

      // Store the path (not signed URL) for persistence
      onUploaded(fileName);

      toast({ title: "Document uploadé", description: `${label} a été enregistré avec succès.` });
    } catch (err: any) {
      toast({ title: "Erreur d'upload", description: err.message || "Impossible d'uploader le fichier.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;
    try {
      await supabase.storage.from("admin-documents").remove([currentUrl]);
      onRemoved();
      toast({ title: "Document supprimé" });
    } catch {
      onRemoved();
    }
  };

  const fileName = currentUrl ? currentUrl.split("/").pop() : null;

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold">{label}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {currentUrl ? (
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-foreground">{fileName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove} className="shrink-0 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 transition-colors hover:border-primary/40 hover:bg-muted/50">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? "Upload en cours..." : "Cliquez pour uploader (PDF, JPG, PNG — max 10 Mo)"}
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};

interface FreelanceAdminTabProps {
  userId: string;
  profileId: string | null;
  companyName: string;
  setCompanyName: (v: string) => void;
  legalForm: string;
  setLegalForm: (v: string) => void;
  siren: string;
  setSiren: (v: string) => void;
  tvaNumber: string;
  setTvaNumber: (v: string) => void;
  companyAddress: string;
  setCompanyAddress: (v: string) => void;
  urssafDocUrl: string | null;
  setUrssafDocUrl: (v: string | null) => void;
  insuranceDocUrl: string | null;
  setInsuranceDocUrl: (v: string | null) => void;
  ribDocUrl: string | null;
  setRibDocUrl: (v: string | null) => void;
  onSave: () => void;
  saving: boolean;
}

const FreelanceAdminTab = ({
  userId,
  profileId,
  companyName,
  setCompanyName,
  legalForm,
  setLegalForm,
  siren,
  setSiren,
  tvaNumber,
  setTvaNumber,
  companyAddress,
  setCompanyAddress,
  urssafDocUrl,
  setUrssafDocUrl,
  insuranceDocUrl,
  setInsuranceDocUrl,
  ribDocUrl,
  setRibDocUrl,
  onSave,
  saving,
}: FreelanceAdminTabProps) => {
  return (
    <div className="space-y-8">
      {/* Legal info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations légales</h3>
        <p className="text-sm text-muted-foreground">Ces informations sont utilisées pour la génération de vos contrats.</p>

        <CompanySearch
          onSelect={(data: CompanyData) => {
            setCompanyName(data.companyName);
            setSiren(data.siren);
            setLegalForm(data.legalForm);
            setCompanyAddress(data.companyAddress);
            setTvaNumber(data.tvaNumber);
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="adminCompanyName">Nom de la société</Label>
            <Input id="adminCompanyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex : Ma Société SAS" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminLegalForm">Forme juridique</Label>
            <Input id="adminLegalForm" value={legalForm} onChange={(e) => setLegalForm(e.target.value)} placeholder="EURL, SAS, Micro..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminSiren">SIREN</Label>
            <Input id="adminSiren" value={siren} onChange={(e) => setSiren(e.target.value)} placeholder="XXX XXX XXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminTvaNumber">N° TVA intracommunautaire</Label>
            <Input id="adminTvaNumber" value={tvaNumber} onChange={(e) => setTvaNumber(e.target.value)} placeholder="FR XX XXXXXXXXX" />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="adminCompanyAddress">Adresse du siège</Label>
            <Input id="adminCompanyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Adresse complète" />
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Documents administratifs</h3>
        <p className="text-sm text-muted-foreground">Uploadez vos justificatifs pour compléter votre dossier.</p>

        <DocumentUpload
          label="Justificatif URSSAF"
          description="Attestation de vigilance ou certificat de conformité URSSAF"
          currentUrl={urssafDocUrl}
          onUploaded={(path) => setUrssafDocUrl(path)}
          onRemoved={() => setUrssafDocUrl(null)}
          userId={userId}
          folder="urssaf"
        />

        <DocumentUpload
          label="Attestation d'assurance RC Pro"
          description="Assurance responsabilité civile professionnelle en cours de validité"
          currentUrl={insuranceDocUrl}
          onUploaded={(path) => setInsuranceDocUrl(path)}
          onRemoved={() => setInsuranceDocUrl(null)}
          userId={userId}
          folder="insurance"
        />

        <DocumentUpload
          label="RIB"
          description="Relevé d'identité bancaire pour le versement de vos honoraires"
          currentUrl={ribDocUrl}
          onUploaded={(path) => setRibDocUrl(path)}
          onRemoved={() => setRibDocUrl(null)}
          userId={userId}
          folder="rib"
        />
      </div>

      <Button onClick={onSave} size="lg" className="w-full" disabled={saving}>
        {saving ? "Sauvegarde..." : "Enregistrer mes informations"}
      </Button>
    </div>
  );
};

export default FreelanceAdminTab;
