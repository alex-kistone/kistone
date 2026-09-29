import { useRef, useState } from "react";
import {
  CheckCircle2, Circle, Download, FileSignature, FolderOpen, Loader2, PlayCircle, Send, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KYC_STATUS, type KycDossier, type KycParty } from "@/lib/kyc";
import {
  CONTRACT_STATUS, PARTY_LABEL, frDate, functionErrorMessage, openPrivateFile, todayStamp, type MissionContract,
} from "./adv";
import { useOpenDossier } from "./kycDossiers";

const SIGNED_MAX_BYTES = 10 * 1024 * 1024;
const SIGNED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const SIGNED_ACCEPT = ".pdf,.docx,.jpg,.jpeg,.png";

interface Props {
  mission: { id: string; title: string; client_user_id: string | null; freelance_user_id: string | null };
  dossiers: Record<string, KycDossier>;
  contracts: MissionContract[];
  yousignEnabled: boolean;
  onGenerate: () => void;
  onChanged: () => Promise<void> | void;
}

/** Checklist de mise en place d'une mission : deux dossiers validés, deux contrats signés, puis démarrage. */
const MissionOnboardingChecklist = ({ mission, dossiers, contracts, yousignEnabled, onGenerate, onChanged }: Props) => {
  const { toast } = useToast();
  const openDossier = useOpenDossier();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmStart, setConfirmStart] = useState(false);
  const fileInputs = useRef<Record<KycParty, HTMLInputElement | null>>({ client: null, freelance: null });

  const contractOf = (party: KycParty) => contracts.find((c) => c.party === party) ?? null;
  const userOf = (party: KycParty) => (party === "client" ? mission.client_user_id : mission.freelance_user_id);

  const doneCount =
    (["client", "freelance"] as KycParty[]).filter((p) => {
      const uid = userOf(p);
      return uid && dossiers[uid]?.status === "approved";
    }).length
    + contracts.filter((c) => c.status === "signed").length;

  const open = async (path: string) => {
    const err = await openPrivateFile("contracts", path);
    if (err) toast({ title: "Ouverture impossible", description: err, variant: "destructive" });
  };

  const sendForSignature = async (contract: MissionContract) => {
    setBusy(`send-${contract.party}`);
    const { data, error } = await supabase.functions.invoke("contracts-send", { body: { contract_id: contract.id } });
    setBusy(null);
    if (error || data?.error) {
      const message = error ? await functionErrorMessage(error) : String(data.error);
      toast({ title: "Envoi pour signature impossible", description: message, variant: "destructive" });
      return;
    }
    toast({ title: "Contrat envoyé pour signature", description: `Le signataire ${PARTY_LABEL[contract.party].toLowerCase()} reçoit un email de Yousign.` });
    await onChanged();
  };

  const uploadSigned = async (party: KycParty, file: File) => {
    const nameExt = file.name.split(".").pop()?.toLowerCase();
    const ext = SIGNED_TYPES[file.type] ?? (nameExt === "jpeg" ? "jpg" : nameExt);
    if (!ext || !Object.values(SIGNED_TYPES).includes(ext)) {
      toast({ title: "Format non accepté", description: "Déposez un PDF, un DOCX, un JPG ou un PNG.", variant: "destructive" });
      return;
    }
    if (file.size > SIGNED_MAX_BYTES) {
      toast({ title: "Fichier trop lourd", description: "10 Mo maximum.", variant: "destructive" });
      return;
    }
    setBusy(`upload-${party}`);
    const path = `${mission.id}/${party}/signe-${todayStamp()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (uploadError) {
      setBusy(null);
      toast({ title: "Dépôt impossible", description: uploadError.message, variant: "destructive" });
      return;
    }
    // Upsert : seules ces colonnes sont écrites, le document d'origine est conservé.
    const { error } = await supabase.from("contracts" as never).upsert(
      {
        mission_id: mission.id,
        party,
        status: "signed",
        signed_document_path: path,
        signed_at: new Date().toISOString(),
      } as never,
      { onConflict: "mission_id,party" },
    );
    setBusy(null);
    if (error) {
      toast({ title: "Version signée déposée mais statut non mis à jour", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Contrat ${PARTY_LABEL[party].toLowerCase()} signé`, description: "La version signée est rangée sur la mission." });
    await onChanged();
  };

  const startMission = async () => {
    setBusy("start");
    const { error } = await supabase.rpc("activate_mission" as never, { _mission_id: mission.id } as never);
    setBusy(null);
    setConfirmStart(false);
    if (error) {
      toast({ title: "La mission ne peut pas démarrer", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mission démarrée", description: `${mission.title} est maintenant en cours.` });
    await onChanged();
  };

  const renderDossier = (party: KycParty) => {
    const uid = userOf(party);
    const dossier = uid ? dossiers[uid] : undefined;
    const ok = dossier?.status === "approved";
    return (
      <li className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <StepIcon ok={ok} />
          <span className="font-medium">Dossier {PARTY_LABEL[party].toLowerCase()}</span>
          {dossier ? (
            <Badge className={KYC_STATUS[dossier.status].tone}>{KYC_STATUS[dossier.status].label}</Badge>
          ) : (
            <Badge variant="secondary">{uid ? "Non ouvert" : "Compte non relié"}</Badge>
          )}
        </div>
        {uid && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 self-start text-xs sm:self-auto"
            onClick={() => openDossier(uid)}
          >
            <FolderOpen className="h-3.5 w-3.5" /> Voir le dossier
          </Button>
        )}
      </li>
    );
  };

  const renderContract = (party: KycParty) => {
    const c = contractOf(party);
    const ok = c?.status === "signed";
    const canSend = yousignEnabled && !!c?.document_path && c.status !== "signed" && c.status !== "sent";
    const inputId = `signed-${mission.id}-${party}`;
    return (
      <li className="flex flex-col gap-2 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <StepIcon ok={ok} />
          <span className="font-medium">Contrat {PARTY_LABEL[party].toLowerCase()}</span>
          {c ? (
            <Badge className={CONTRACT_STATUS[c.status].tone}>{CONTRACT_STATUS[c.status].label}</Badge>
          ) : (
            <Badge variant="secondary">À générer</Badge>
          )}
          {c?.sent_at && c.status === "sent" && <span className="text-xs text-muted-foreground">le {frDate(c.sent_at)}</span>}
          {c?.signed_at && ok && <span className="text-xs text-muted-foreground">le {frDate(c.signed_at)}</span>}
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {!c?.document_path && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={onGenerate}>
              <FileSignature className="h-3.5 w-3.5" /> Générer
            </Button>
          )}
          {c?.document_path && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => open(c.document_path!)}>
              <Download className="h-3.5 w-3.5" /> Télécharger
            </Button>
          )}
          {c?.signed_document_path && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => open(c.signed_document_path!)}>
              <Download className="h-3.5 w-3.5" /> Version signée
            </Button>
          )}
          {canSend && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" disabled={!!busy} onClick={() => sendForSignature(c!)}>
              {busy === `send-${party}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Envoyer pour signature
            </Button>
          )}
          {!yousignEnabled && !ok && (
            <>
              <input
                id={inputId}
                ref={(el) => { fileInputs.current[party] = el; }}
                type="file"
                accept={SIGNED_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-label={`Version signée du contrat ${PARTY_LABEL[party].toLowerCase()}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) uploadSigned(party, file);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                disabled={!!busy}
                onClick={() => fileInputs.current[party]?.click()}
              >
                {busy === `upload-${party}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Déposer la version signée
              </Button>
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <section aria-label="Mise en place de la mission" className="mt-4 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Mise en place · {doneCount}/4</h4>
        <Button size="sm" className="gap-1" disabled={!!busy} onClick={() => setConfirmStart(true)}>
          {busy === "start" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          Démarrer la mission
        </Button>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        {yousignEnabled
          ? "Les contrats partent en signature électronique (Yousign)."
          : "Signature manuelle : téléchargez le contrat, faites-le signer, puis déposez la version signée."}
      </p>
      <ul className="divide-y divide-border text-sm">
        {renderDossier("client")}
        {renderDossier("freelance")}
        {renderContract("client")}
        {renderContract("freelance")}
      </ul>

      <AlertDialog open={confirmStart} onOpenChange={(v) => { if (busy !== "start") setConfirmStart(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Démarrer la mission ?</AlertDialogTitle>
            <AlertDialogDescription>
              La mission passe « En cours » si les deux dossiers sont validés et les deux contrats signés.
              Sinon, ce qu'il manque vous sera indiqué.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "start"}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={busy === "start"} onClick={(e) => { e.preventDefault(); startMission(); }}>
              {busy === "start" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oui, démarrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

const StepIcon = ({ ok }: { ok: boolean }) =>
  ok ? (
    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#17663F]" aria-label="Fait" />
  ) : (
    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="À faire" />
  );

export default MissionOnboardingChecklist;
