import { useState, useEffect, type MouseEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase, MapPin, Euro, Calendar, CheckCircle2, XCircle, RefreshCw, History, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ExtendMissionDialog from "./ExtendMissionDialog";
import GenerateContractsDialog from "./GenerateContractsDialog";
import MissionOnboardingChecklist from "./admin/MissionOnboardingChecklist";
import MissionDetail from "./admin/MissionDetail";
import MissionEndDialog from "./admin/MissionEndDialog";
import { MISSION_PARAM, MISSION_STATUS, setMissionStatus, type MissionEndAction } from "./admin/missionStatus";
import type { MissionContract } from "./admin/adv";
import { KYC_CHANGED_EVENT } from "./admin/kycDossiers";
import { fetchCompanySettings } from "@/lib/companySettings";
import type { KycDossier } from "@/lib/kyc";

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
  client_user_id: string | null;
  freelance_user_id: string | null;
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

const STATUS_LABELS = MISSION_STATUS;

const AdminMissionsPanel = () => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ missionId: string; action: MissionEndAction } | null>(null);
  const [extendMission, setExtendMission] = useState<Mission | null>(null);
  const [contractMission, setContractMission] = useState<Mission | null>(null);
  const [historyMission, setHistoryMission] = useState<string | null>(null);
  const [extensions, setExtensions] = useState<MissionExtension[]>([]);
  // Mise en place (phase 1 ADV) : dossiers KYC par compte, contrats par mission
  const [dossiers, setDossiers] = useState<Record<string, KycDossier>>({});
  const [contracts, setContracts] = useState<MissionContract[]>([]);
  const [yousignEnabled, setYousignEnabled] = useState(false);

  // Détail d'une mission : /dashboard?tab=missions&mission=<id> ; la liste se recharge au retour.
  const [searchParams, setSearchParams] = useSearchParams();
  const openMissionId = searchParams.get(MISSION_PARAM);
  const setOpenMission = (id: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set(MISSION_PARAM, id);
      else next.delete(MISSION_PARAM);
      return next;
    });
  };

  useEffect(() => { if (!openMissionId) loadMissions(); }, [openMissionId]);
  // Un dossier validé ou refusé depuis le panneau latéral met la checklist à jour
  useEffect(() => {
    const onKycChanged = () => { loadMissions(); };
    window.addEventListener(KYC_CHANGED_EVENT, onKycChanged);
    return () => window.removeEventListener(KYC_CHANGED_EVENT, onKycChanged);
  }, []);

  const loadMissions = async () => {
    const { data: missionsData } = await supabase
      .from("missions" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!missionsData || missionsData.length === 0) { setLoading(false); return; }

    const profileIds = [...new Set((missionsData as any[]).map((m: any) => m.recruiter_profile_id))];
    const { data: profiles } = await supabase
      .from("recruiter_profiles")
      .select("id, first_name, last_name, user_id")
      .in("id", profileIds);

    const nameMap: Record<string, string> = {};
    const freelanceUserMap: Record<string, string | null> = {};
    (profiles || []).forEach((p) => {
      nameMap[p.id] = `${p.first_name} ${p.last_name}`;
      freelanceUserMap[p.id] = p.user_id ?? null;
    });

    // Compte client de chaque mission (via le besoin)
    const needIds = [...new Set((missionsData as unknown as { need_id: string }[]).map((m) => m.need_id))];
    const { data: needs } = await supabase.from("client_needs").select("id, user_id").in("id", needIds);
    const clientUserMap: Record<string, string | null> = {};
    (needs || []).forEach((n) => { clientUserMap[n.id] = n.user_id ?? null; });

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
      client_user_id: clientUserMap[m.need_id] ?? null,
      freelance_user_id: freelanceUserMap[m.recruiter_profile_id] ?? null,
    }));

    // Checklist de mise en place : dossiers des parties et contrats des missions en onboarding
    const onboarding = list.filter((m) => m.status === "onboarding");
    if (onboarding.length > 0) {
      const userIds = [...new Set(onboarding.flatMap((m) => [m.client_user_id, m.freelance_user_id]).filter(Boolean))] as string[];
      const [dossierRes, contractRes, settings] = await Promise.all([
        userIds.length
          ? supabase.from("kyc_dossiers" as never).select("*").in("user_id" as never, userIds as never)
          : Promise.resolve({ data: [] }),
        supabase.from("contracts" as never).select("*").in("mission_id" as never, onboarding.map((m) => m.id) as never),
        fetchCompanySettings(),
      ]);
      const byUser: Record<string, KycDossier> = {};
      ((dossierRes.data ?? []) as unknown as KycDossier[]).forEach((d) => { byUser[d.user_id] = d; });
      setDossiers(byUser);
      setContracts((contractRes.data ?? []) as unknown as MissionContract[]);
      setYousignEnabled(settings.yousignEnabled);
    }

    setMissions(list);
    setLoading(false);
  };

  const updateStatus = async (missionId: string, newStatus: MissionEndAction) => {
    const error = await setMissionStatus(missionId, newStatus);

    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
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

  // Clic sur la carte (hors boutons, liens, champs et fenêtres ouvertes depuis la carte) : ouvre le détail.
  const onCardClick = (e: MouseEvent<HTMLDivElement>, id: string) => {
    const target = e.target as HTMLElement;
    if (!e.currentTarget.contains(target)) return; // clic dans une fenêtre en portail
    if (target.closest("button, a, input, select, textarea, label, [role='button']")) return;
    if (window.getSelection()?.toString()) return; // sélection de texte
    setOpenMission(id);
  };

  if (openMissionId) return <MissionDetail missionId={openMissionId} onBack={() => setOpenMission(null)} />;

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
          <div
            key={m.id}
            onClick={(e) => onCardClick(e, m.id)}
            className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/5 focus-within:border-foreground/20 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenMission(m.id); }}
                      aria-label={`Voir le détail de la mission ${m.title}`}
                      className="rounded-sm text-left hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {m.title}
                    </button>
                  </h3>
                  <Badge className={STATUS_LABELS[m.status]?.color || ""}>
                    {STATUS_LABELS[m.status]?.label || m.status}
                  </Badge>
                  {m.extensions_count > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={(e) => { e.stopPropagation(); loadExtensionHistory(m.id); }}>
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
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setContractMission(m); }}>
                      <FileText className="h-3.5 w-3.5" /> Contrats
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setExtendMission(m); }}>
                      <RefreshCw className="h-3.5 w-3.5" /> Prolonger
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setConfirmAction({ missionId: m.id, action: "completed" }); }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Terminer
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmAction({ missionId: m.id, action: "cancelled" }); }}>
                      <XCircle className="h-3.5 w-3.5" /> Annuler
                    </Button>
                  </div>
                )}
                {m.status === "onboarding" && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setContractMission(m); }}>
                      <FileText className="h-3.5 w-3.5" /> Générer les contrats
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmAction({ missionId: m.id, action: "cancelled" }); }}>
                      <XCircle className="h-3.5 w-3.5" /> Annuler
                    </Button>
                  </div>
                )}
                {m.status !== "active" && m.extensions_count > 0 && (
                  <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); loadExtensionHistory(m.id); }}>
                    <History className="h-3.5 w-3.5" /> Historique
                  </Button>
                )}
              </div>
            </div>

            {m.status === "onboarding" && (
              // La checklist garde ses propres actions : un clic dedans n'ouvre pas le détail.
              <div className="cursor-auto" onClick={(e) => e.stopPropagation()}>
              <MissionOnboardingChecklist
                mission={m}
                dossiers={dossiers}
                contracts={contracts.filter((c) => c.mission_id === m.id)}
                yousignEnabled={yousignEnabled}
                onGenerate={() => setContractMission(m)}
                onChanged={loadMissions}
              />
              </div>
            )}

            {/* Extension history inline */}
            {historyMission === m.id && extensions.length > 0 && (
              <div className="mt-4 cursor-auto border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> Historique des renouvellements
                  </h4>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={(e) => { e.stopPropagation(); setHistoryMission(null); }}>
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
      <MissionEndDialog
        action={confirmAction?.action ?? null}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmedAction}
      />

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
          onSaved={loadMissions}
        />
      )}
    </TooltipProvider>
  );
};

export default AdminMissionsPanel;
