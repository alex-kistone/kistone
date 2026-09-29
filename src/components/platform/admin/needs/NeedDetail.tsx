import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CreateMissionDialog from "@/components/platform/CreateMissionDialog";
import NeedKanban from "./NeedKanban";
import SuggestProfilePanel from "./SuggestProfilePanel";
import { StageCounters, StatusPill, TodoBadge } from "./NeedsList";
import { budgetLabel, remoteLabel, type NeedRow, type ProfileSuggestion, type StageKey } from "./needsModel";
import type { NeedsData } from "./useNeeds";

const InfoCard = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    <div className="mt-1 break-words text-sm font-medium">{children}</div>
  </div>
);

const LONG_DESCRIPTION = 320;

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Les raccourcis ← / → ne doivent pas voler les flèches d'un champ ou d'une fenêtre ouverte. */
const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || !!el.closest("[role='listbox'],[role='slider'],[role='menu']"));

interface MissionDialogData {
  suggestionId: string;
  needId: string;
  recruiterProfileId: string;
  recruiterName: string;
  recruiterTjm: number | null;
  needTitle: string;
  companyName: string;
  missionLocation: string;
}

interface Props {
  row: NeedRow | null;
  data: NeedsData;
  /** Besoins voisins dans l'ordre et les filtres courants de la liste. */
  prevId: string | null;
  nextId: string | null;
  position: { index: number; total: number } | null;
  onBack: () => void;
  onNavigate: (needId: string) => void;
}

/** Détail d'un besoin : informations, actions de matching et pipeline des profils. */
const NeedDetail = ({ row, data, prevId, nextId, position, onBack, onNavigate }: Props) => {
  const { toast } = useToast();
  const { needs, setNeeds, suggestions, setSuggestions, profiles, missionBySuggestion, setMissionBySuggestion, reload } = data;
  const [matching, setMatching] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [missionDialog, setMissionDialog] = useState<MissionDialogData | null>(null);
  const need = row?.need ?? null;
  const needId = need?.id ?? null;

  // Changement de besoin (précédent / suivant) : on referme ce qui était ouvert
  useEffect(() => {
    setSuggesting(false);
    setExpanded(false);
  }, [needId]);

  // Raccourcis clavier ← / →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isTypingTarget(e.target) || document.querySelector("[role='dialog'],[role='alertdialog']")) return;
      if (e.key === "ArrowLeft" && prevId) onNavigate(prevId);
      else if (e.key === "ArrowRight" && nextId) onNavigate(nextId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevId, nextId, onNavigate]);

  const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const needSuggestions = useMemo(() => suggestions.filter((s) => s.need_id === needId), [suggestions, needId]);
  const pendingMissions = needSuggestions.filter((s) => s.pipeline_status === "accepted" && !missionBySuggestion.has(s.id));
  const nameOf = (s: ProfileSuggestion) => {
    const p = profilesById.get(s.recruiter_profile_id);
    return p ? `${p.first_name} ${p.last_name}` : s.anonymous_label;
  };

  const backButton = (
    <Button variant="ghost" size="sm" className="-ml-2 gap-1" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Besoins
    </Button>
  );

  const navButtons = (
    <nav aria-label="Navigation entre besoins" className="flex items-center gap-1">
      {position && (
        <span className="mr-1 font-mono text-[11px] tabular-nums text-muted-foreground">
          {position.index + 1} / {position.total}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 px-2 text-xs"
        disabled={!prevId}
        onClick={() => prevId && onNavigate(prevId)}
        aria-label="Besoin précédent"
        title="Besoin précédent (←)"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Précédent</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 px-2 text-xs"
        disabled={!nextId}
        onClick={() => nextId && onNavigate(nextId)}
        aria-label="Besoin suivant"
        title="Besoin suivant (→)"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );

  if (!row || !need) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">{backButton}</div>
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Ce besoin est introuvable. Il a peut-être été supprimé.
        </div>
      </div>
    );
  }

  /**
   * Lance le matching hybride sur le besoin. Réservé à l'admin côté UI, mais
   * c'est l'edge function qui fait autorité (elle revérifie le rôle).
   * Les suggestions déjà avancées dans le pipeline ne sont pas rejouées.
   */
  const runMatching = async () => {
    setMatching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");
      const { data: res, error } = await supabase.functions.invoke("match-profiles", {
        body: { need_id: need.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (res?.error) {
        toast({ title: "Matching impossible", description: String(res.error), variant: "destructive" });
        return;
      }
      const added: number = res?.suggestions?.length ?? 0;
      const kept: number = res?.skipped ?? 0;
      toast({
        title: added > 0 ? `${added} profil${added > 1 ? "s" : ""} suggéré${added > 1 ? "s" : ""}` : "Aucun nouveau profil",
        description: [
          kept > 0 ? `${kept} déjà dans le pipeline, conservé${kept > 1 ? "s" : ""}.` : null,
          // Sans clé Anthropic le matching reste utilisable : autant le dire.
          res?.ai_used === false ? "Classement par règles uniquement (IA indisponible)." : null,
        ].filter(Boolean).join(" ") || undefined,
      });
      await reload();
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setMatching(false);
    }
  };

  const updatePipelineStatus = async (suggestionId: string, stage: StageKey) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profile_suggestions")
      .update({ pipeline_status: stage, status_updated_at: now })
      .eq("id", suggestionId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setSuggestions((prev) => prev.map((s) => (s.id === suggestionId ? { ...s, pipeline_status: stage, status_updated_at: now } : s)));
  };

  const deleteSuggestion = async (suggestionId: string) => {
    const { error } = await supabase.from("profile_suggestions").delete().eq("id", suggestionId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    toast({ title: "Suggestion supprimée" });
  };

  const addManualSuggestion = async (profileId: string): Promise<boolean> => {
    const label = `Profil ${String.fromCharCode(65 + needSuggestions.length)}`;
    // Motifs descriptifs tirés du profil
    const profile = profilesById.get(profileId);
    const reasons: string[] = [];
    if (profile) {
      if (profile.job_title) reasons.push(profile.job_title);
      if (profile.model) reasons.push(`Modèle : ${profile.model}`);
      if (profile.skills?.length) reasons.push(`Métiers : ${profile.skills.slice(0, 4).join(", ")}`);
      if (profile.sectors?.length) reasons.push(`Secteurs : ${profile.sectors.slice(0, 3).join(", ")}`);
      if (profile.mobility?.length) reasons.push(`Mobilité : ${profile.mobility.slice(0, 3).join(", ")}`);
      if (profile.tjm) reasons.push(`TJM : ${profile.tjm}€/jour`);
      if (profile.available) reasons.push("Disponible immédiatement");
      else if (profile.availability_date) reasons.push(`Disponible le ${new Date(profile.availability_date).toLocaleDateString("fr-FR")}`);
      if (profile.super_tam) reasons.push("Super TAM");
    }
    if (reasons.length === 0) reasons.push("Sélection manuelle par l'admin");

    const { data: inserted, error } = await supabase
      .from("profile_suggestions")
      .insert({
        need_id: need.id,
        recruiter_profile_id: profileId,
        anonymous_label: label,
        match_score: 100,
        match_reasons: reasons,
        pipeline_status: "suggested",
        recruiter_first_name: profile?.first_name || null,
      })
      .select("id, need_id, anonymous_label, match_score, match_reasons, pipeline_status, recruiter_profile_id, super_tam, created_at, status_updated_at")
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return false;
    }
    setSuggestions((prev) => [inserted, ...prev]);
    toast({ title: "Profil ajouté", description: `${profile ? `${profile.first_name} ${profile.last_name}` : "Le profil"} suggéré au client` });
    setSuggesting(false);
    return true;
  };

  /** Ouvre la création de mission pour une suggestion (glisser vers « Accepté » ou bouton). */
  const openMissionDialog = (suggestionId: string) => {
    const s = suggestions.find((x) => x.id === suggestionId);
    if (!s) return;
    setMissionDialog({
      suggestionId: s.id,
      needId: s.need_id,
      recruiterProfileId: s.recruiter_profile_id,
      recruiterName: nameOf(s),
      recruiterTjm: profilesById.get(s.recruiter_profile_id)?.tjm ?? null,
      needTitle: need.job_title || "Mission",
      companyName: need.company_name || "",
      missionLocation: need.mission_location || "",
    });
  };

  const description = need.description?.trim() ?? "";
  const isLong = description.length > LONG_DESCRIPTION || description.split("\n").length > 5;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-2">
        {backButton}
        {navButtons}
      </div>

      {/* En-tête : titre, client, actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold sm:text-2xl">{need.job_title}</h2>
          <p className="mt-1 break-words text-sm text-muted-foreground">{need.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={row.status} />
            <TodoBadge reasons={row.todo} />
            <StageCounters counts={row.counts} />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" className="gap-1.5 text-xs" disabled={matching} onClick={runMatching}>
            {matching
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Analyse…</>
              : <><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Lancer le matching</>}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            aria-expanded={suggesting}
            onClick={() => setSuggesting((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Suggérer un profil
          </Button>
          {pendingMissions.map((s) => (
            <Button key={s.id} size="sm" variant="outline" className="gap-1.5 border-[#17663F]/40 text-xs text-[#17663F]" onClick={() => openMissionDialog(s.id)}>
              Créer la mission{pendingMissions.length > 1 ? ` · ${nameOf(s)}` : ""}
            </Button>
          ))}
        </div>
      </div>

      {/* Informations du besoin */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <InfoCard label="Client">
          <Link
            to={`/dashboard?tab=clients&client=${need.user_id}`}
            className="rounded-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir la fiche client ${need.company_name}`}
          >
            {need.company_name || "Client"}
          </Link>
          {need.contact_name && <span className="block text-xs font-normal text-muted-foreground">{need.contact_name}</span>}
        </InfoCard>
        <InfoCard label="Métier">{need.profile_types?.length ? need.profile_types.join(", ") : "Non précisé"}</InfoCard>
        <InfoCard label="Lieu & télétravail">
          {need.mission_location || "Non précisé"}
          <span className="block text-xs font-normal text-muted-foreground">{remoteLabel(need.remote_policy)}</span>
        </InfoCard>
        <InfoCard label="Budget">{budgetLabel(need)}</InfoCard>
        <InfoCard label="Créé le">{longDate(need.created_at)}</InfoCard>
        <InfoCard label="Statut"><StatusPill status={row.status} /></InfoCard>
      </div>

      {description && (
        <section aria-labelledby="need-description-title" className="mt-6">
          <h3 id="need-description-title" className="mb-2 text-base font-semibold">Description</h3>
          <div className="rounded-xl border border-border bg-card p-4">
            <p id="need-description" className={`whitespace-pre-line break-words text-sm text-muted-foreground ${isLong && !expanded ? "line-clamp-4" : ""}`}>
              {description}
            </p>
            {isLong && (
              <Button
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-xs"
                aria-expanded={expanded}
                aria-controls="need-description"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Voir moins" : "Voir plus"}
              </Button>
            )}
          </div>
        </section>
      )}

      {suggesting && (
        <div className="mt-6">
          <SuggestProfilePanel
            need={need}
            needs={needs}
            suggestions={suggestions}
            profiles={profiles}
            onAdd={addManualSuggestion}
            onCancel={() => setSuggesting(false)}
          />
        </div>
      )}

      <section aria-labelledby="need-pipeline-title" className="mt-8">
        <h3 id="need-pipeline-title" className="mb-3 text-base font-semibold">Pipeline des profils</h3>
        <NeedKanban
          suggestions={needSuggestions}
          profilesById={profilesById}
          missionBySuggestion={missionBySuggestion}
          onMove={updatePipelineStatus}
          onCreateMission={openMissionDialog}
          onDelete={deleteSuggestion}
        />
      </section>

      {missionDialog && (
        <CreateMissionDialog
          open
          onClose={() => setMissionDialog(null)}
          {...missionDialog}
          onMissionCreated={() => {
            // État local : suggestion acceptée, besoin pourvu, puis rechargement pour l'identifiant de la mission
            const { suggestionId, needId: createdFor } = missionDialog;
            setSuggestions((prev) => prev.map((s) => (s.id === suggestionId ? { ...s, pipeline_status: "accepted" } : s)));
            setNeeds((prev) => prev.map((n) => (n.id === createdFor ? { ...n, status: "staffed" } : n)));
            setMissionBySuggestion((prev) => new Map(prev).set(suggestionId, ""));
            setMissionDialog(null);
            reload();
          }}
        />
      )}
    </div>
  );
};

export default NeedDetail;
