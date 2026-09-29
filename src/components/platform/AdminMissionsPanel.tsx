import { useState, useEffect } from "react";
import { Briefcase, MapPin, Euro, Calendar, CheckCircle2, XCircle, RefreshCw, History, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ExtendMissionDialog from "./ExtendMissionDialog";
import GenerateContractsDialog from "./GenerateContractsDialog";

interface Mission {
  id: string;
  title: string;
  company_name: string;
  location: string;
  recruiter_tjm: number;
  client_tjm: number;
  start_date: string;
  end_date: string | null;
  duration_text: string | null;
  status: string;
  created_at: string;
  recruiter_name: string;
  recruiter_profile_id: string;
  need_id: string;
  extensions_count: number;
}

interface MissionExtension {
  id: string;
  previous_end_date: string | null;
  new_end_date: string | null;
  previous_recruiter_tjm: number | null;
  new_recruiter_tjm: number | null;
  reason: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "En cours", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  completed: { label: "Terminée", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const AdminMissionsPanel = () => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ missionId: string; action: string } | null>(null);
  const [extendMission, setExtendMission] = useState<Mission | null>(null);
  const [contractMission, setContractMission] = useState<Mission | null>(null);
  const [historyMission, setHistoryMission] = useState<string | null>(null);
  const [extensions, setExtensions] = useState<MissionExtension[]>([]);

  useEffect(() => { loadMissions(); }, []);

  const loadMissions = async () => {
    const { data: missionsData } = await supabase
      .from("missions" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!missionsData || missionsData.length === 0) { setLoading(false); return; }

    const profileIds = [...new Set((missionsData as any[]).map((m: any) => m.recruiter_profile_id))];
    const { data: profiles } = await supabase
      .from("recruiter_profiles")
      .select("id, first_name, last_name")
      .in("id", profileIds);

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p) => { nameMap[p.id] = `${p.first_name} ${p.last_name}`; });

    // Count extensions per mission
    const missionIds = (missionsData as any[]).map((m: any) => m.id);
    const { data: extData } = await supabase
      .from("mission_extensions" as any)
      .select("mission_id")
      .in("mission_id", missionIds);

    const extCountMap: Record<string, number> = {};
    (extData as any[] || []).forEach((e: any) => {
      extCountMap[e.mission_id] = (extCountMap[e.mission_id] || 0) + 1;
    });

    const list: Mission[] = (missionsData as any[]).map((m: any) => ({
      ...m,
      recruiter_name: nameMap[m.recruiter_profile_id] || "Inconnu",
      extensions_count: extCountMap[m.id] || 0,
    }));

    setMissions(list);
    setLoading(false);
  };

  const updateStatus = async (missionId: string, newStatus: string) => {
    const { error } = await supabase
      .from("missions" as any)
      .update({ status: newStatus })
      .eq("id", missionId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setMissions((prev) => prev.map((m) => m.id === missionId ? { ...m, status: newStatus } : m));
      toast({ title: "Statut mis à jour" });
    }
  };

  const handleConfirmedAction = () => {
    if (!confirmAction) return;
    updateStatus(confirmAction.missionId, confirmAction.action);
    setConfirmAction(null);
  };

  const loadExtensionHistory = async (missionId: string) => {
    setHistoryMission(missionId);
    const { data } = await supabase
      .from("mission_extensions" as any)
      .select("*")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });
    setExtensions((data as any[]) || []);
  };

  const getDurationSinceStart = (m: Mission) => {
    const start = new Date(m.start_date);
    const end = m.end_date ? new Date(m.end_date) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return months > 0 ? `${months} mois` : "< 1 mois";
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement des missions...</div>;

  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
        <Briefcase className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Aucune mission en cours.</p>
        <p className="mt-1 text-xs text-muted-foreground">Les missions sont créées quand un profil passe en « Validé ».</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {missions.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base">{m.title}</h3>
                  <Badge className={STATUS_LABELS[m.status]?.color || ""}>
                    {STATUS_LABELS[m.status]?.label || m.status}
                  </Badge>
                  {m.extensions_count > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => loadExtensionHistory(m.id)}>
                          <RefreshCw className="h-3 w-3" /> {m.extensions_count} renouvellement{m.extensions_count > 1 ? "s" : ""}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Voir l'historique des extensions</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{m.recruiter_name} — {m.company_name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {m.location || "—"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(m.start_date).toLocaleDateString("fr-FR")}</span>
                  {m.end_date && (
                    <span className="flex items-center gap-1">→ {new Date(m.end_date).toLocaleDateString("fr-FR")}</span>
                  )}
                  <span className="flex items-center gap-1">⏱ {m.duration_text || getDurationSinceStart(m)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">TJM Freelance / Client</div>
                  <div className="font-semibold">{m.recruiter_tjm}€ / {m.client_tjm}€</div>
                </div>
                {m.status === "active" && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setContractMission(m)}>
                      <FileText className="h-3.5 w-3.5" /> Contrats
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setExtendMission(m)}>
                      <RefreshCw className="h-3.5 w-3.5" /> Prolonger
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setConfirmAction({ missionId: m.id, action: "completed" })}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Terminer
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={() => setConfirmAction({ missionId: m.id, action: "cancelled" })}>
                      <XCircle className="h-3.5 w-3.5" /> Annuler
                    </Button>
                  </div>
                )}
                {m.status !== "active" && m.extensions_count > 0 && (
                  <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => loadExtensionHistory(m.id)}>
                    <History className="h-3.5 w-3.5" /> Historique
                  </Button>
                )}
              </div>
            </div>

            {/* Extension history inline */}
            {historyMission === m.id && extensions.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> Historique des renouvellements
                  </h4>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setHistoryMission(null)}>
                    Fermer
                  </Button>
                </div>
                <div className="space-y-2">
                  {extensions.map((ext, idx) => (
                    <div key={ext.id} className="rounded-lg border border-border bg-muted/20 p-2.5 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">#{idx + 1}</Badge>
                        <span className="text-muted-foreground">
                          {new Date(ext.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        {ext.previous_end_date && ext.new_end_date && (
                          <span>
                            {new Date(ext.previous_end_date).toLocaleDateString("fr-FR")} → {new Date(ext.new_end_date).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        {ext.previous_recruiter_tjm !== ext.new_recruiter_tjm && (
                          <span className="text-muted-foreground">
                            TJM: {ext.previous_recruiter_tjm}€ → {ext.new_recruiter_tjm}€
                          </span>
                        )}
                      </div>
                      {ext.reason && <p className="mt-1 text-muted-foreground italic">{ext.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm dialog for terminate/cancel */}
      <AlertDialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "completed" ? "Terminer la mission ?" : "Annuler la mission ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "completed"
                ? "Cette action marquera la mission comme terminée. Le freelance sera de nouveau marqué comme disponible."
                : "Cette action annulera la mission. Cette opération est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, revenir</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              className={confirmAction?.action === "cancelled" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.action === "completed" ? "Oui, terminer" : "Oui, annuler"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend mission dialog */}
      {extendMission && (
        <ExtendMissionDialog
          open={!!extendMission}
          onClose={() => setExtendMission(null)}
          mission={extendMission}
          onExtended={loadMissions}
        />
      )}

      {/* Generate contracts dialog */}
      {contractMission && (
        <GenerateContractsDialog
          open={!!contractMission}
          onClose={() => setContractMission(null)}
          mission={contractMission}
        />
      )}
    </TooltipProvider>
  );
};

export default AdminMissionsPanel;
