import { useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS, type ProfileSuggestion, type RecruiterProfile, type StageKey } from "./needsModel";

interface Props {
  /** Suggestions du besoin affiché. */
  suggestions: ProfileSuggestion[];
  profilesById: Map<string, RecruiterProfile>;
  missionBySuggestion: Map<string, string>;
  /** Glisser vers une autre étape que « Accepté ». */
  onMove: (suggestionId: string, stage: StageKey) => void;
  /** Glisser vers « Accepté » ou bouton « Créer la mission » : ouvre la création de mission. */
  onCreateMission: (suggestionId: string) => void;
  onDelete: (suggestionId: string) => void;
}

const byNewest = (a: ProfileSuggestion, b: ProfileSuggestion) =>
  new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

/** Pipeline d'un besoin : quatre colonnes, cartes déplaçables par glisser-déposer. */
const NeedKanban = ({ suggestions, profilesById, missionBySuggestion, onMove, onCreateMission, onDelete }: Props) => {
  const [dragItem, setDragItem] = useState<string | null>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent, stage: StageKey) => {
    e.preventDefault();
    if (!dragItem) return;
    // La création de mission remplace le simple changement de statut
    if (stage === "accepted") onCreateMission(dragItem);
    else onMove(dragItem, stage);
    setDragItem(null);
  };

  const nameOf = (s: ProfileSuggestion) => {
    const p = profilesById.get(s.recruiter_profile_id);
    return p ? `${p.first_name} ${p.last_name}` : s.anonymous_label;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STEPS.map((step) => {
        const StepIcon = step.icon;
        const items = suggestions.filter((s) => s.pipeline_status === step.key).sort(byNewest);

        return (
          <div
            key={step.key}
            className={cn("flex min-w-[220px] flex-1 flex-col rounded-xl border border-border", step.bg)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, step.key)}
          >
            <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
              <StepIcon className={cn("h-4 w-4", step.color)} aria-hidden="true" />
              <span className="text-xs font-semibold">{step.label}</span>
              <Badge variant="secondary" className="ml-auto h-5 min-w-5 justify-center text-[10px]">
                {items.length}
              </Badge>
            </div>

            <div className="min-h-[120px] flex-1 space-y-2 p-2">
              {items.map((s) => {
                const name = nameOf(s);
                const missionId = missionBySuggestion.get(s.id);
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={() => setDragItem(s.id)}
                    onDragEnd={() => setDragItem(null)}
                    className={cn(
                      "group relative cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
                      dragItem === s.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{name}</span>
                          {s.super_tam && <span title="Super TAM">🥇</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          ({profilesById.get(s.recruiter_profile_id)?.first_name || s.anonymous_label})
                        </span>
                        {s.match_score > 0 && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <Progress value={s.match_score} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-medium text-muted-foreground">{s.match_score}%</span>
                          </div>
                        )}
                        {s.pipeline_status === "accepted" && (
                          missionBySuggestion.has(s.id) ? (
                            missionId ? (
                              <Link
                                to={`/dashboard?tab=missions&mission=${missionId}`}
                                className="mt-1.5 inline-block rounded-sm text-[11px] font-medium text-[#17663F] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                Mission créée
                              </Link>
                            ) : (
                              <p className="mt-1.5 text-[11px] font-medium text-[#17663F]">Mission créée</p>
                            )
                          ) : (
                            // Profil retenu par le client : l'admin lance la mise en place
                            <Button size="sm" className="mt-2 h-7 w-full text-xs" onClick={() => onCreateMission(s.id)}>
                              Créer la mission
                            </Button>
                          )
                        )}
                        {s.match_reasons.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {s.match_reasons.slice(0, 2).map((r, i) => (
                              <p key={i} className="text-[10px] leading-tight text-muted-foreground">• {r}</p>
                            ))}
                            {s.match_reasons.length > 2 && (
                              <p className="text-[10px] text-muted-foreground/60">
                                +{s.match_reasons.length - 2} autre{s.match_reasons.length - 2 > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Retirer ${name} des suggestions`}
                            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retirer cette suggestion ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Le profil {name} sera retiré des suggestions pour ce besoin.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Retirer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="flex h-full min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground/50">
                  Glissez ici
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NeedKanban;
