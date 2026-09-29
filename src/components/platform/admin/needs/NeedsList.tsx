import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NEED_STATUS, PIPELINE_STEPS, TODO_LABEL, budgetLabel, relativeAge, remoteLabel, type NeedRow, type TodoReason,
} from "./needsModel";

export const TODO_TONE = "bg-[#FFF1E0] text-[#9A4A00] dark:bg-orange-950/40 dark:text-orange-300";

/** Pastille « À traiter » avec ses raisons (« Mission à créer · À relancer »). */
export const TodoBadge = ({ reasons, className }: { reasons: TodoReason[]; className?: string }) =>
  reasons.length === 0 ? null : (
    <span className={cn("inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", TODO_TONE, className)}>
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">À traiter · {reasons.map((r) => TODO_LABEL[r]).join(" · ")}</span>
    </span>
  );

export const StatusPill = ({ status }: { status: NeedRow["status"] }) => (
  <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", NEED_STATUS[status].tone)}>
    {NEED_STATUS[status].label}
  </span>
);

/** Compteurs par étape du pipeline (proposés / présélectionnés / entretien / acceptés). */
export const StageCounters = ({ counts }: { counts: NeedRow["counts"] }) => (
  <span className="flex flex-wrap items-center gap-1">
    {PIPELINE_STEPS.map((step) => {
      const Icon = step.icon;
      const n = counts[step.key];
      return (
        <span
          key={step.key}
          title={`${n} ${step.counterLabel}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
            n > 0 ? cn("border-transparent text-foreground", step.bg) : "border-border text-muted-foreground/60",
          )}
        >
          <Icon className={cn("h-3 w-3", n > 0 ? step.color : "")} aria-hidden="true" />
          {n}
          <span className="sr-only"> {step.counterLabel}</span>
        </span>
      );
    })}
  </span>
);

interface Props {
  rows: NeedRow[];
  onOpen: (needId: string) => void;
  /** Masque le nom du client (fiche client : il est déjà connu). */
  hideClient?: boolean;
}

/** Liste des besoins : une ligne par besoin, façon tableau sur grand écran, cartes empilées sur mobile. */
const NeedsList = ({ rows, onOpen, hideClient = false }: Props) => (
  <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
    {rows.map(({ need, counts, status, todo }) => {
      const metiers = need.profile_types?.length ? need.profile_types.join(", ") : null;
      const place = [need.mission_location, remoteLabel(need.remote_policy)].filter((s) => s && s !== "—").join(" · ");
      const age = relativeAge(need.created_at);
      const label = [
        need.job_title,
        hideClient ? null : need.company_name,
        NEED_STATUS[status].label,
        todo.length ? `à traiter : ${todo.map((r) => TODO_LABEL[r]).join(", ")}` : null,
        `créé ${age}`,
      ].filter(Boolean).join(", ");
      return (
        <li key={need.id}>
          <button
            type="button"
            onClick={() => onOpen(need.id)}
            aria-label={`${label}. Ouvrir le besoin`}
            className="grid w-full grid-cols-1 gap-x-4 gap-y-2 p-4 text-left transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_auto_minmax(7.5rem,auto)_auto] lg:items-center"
          >
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0 break-words font-medium">{need.job_title}</span>
                <TodoBadge reasons={todo} />
              </span>
              <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                {[hideClient ? null : need.company_name, metiers].filter(Boolean).join(" · ") || "Métier non précisé"}
              </span>
            </span>
            <span className="min-w-0 text-sm">
              <span className="block">{budgetLabel(need)}</span>
              <span className="block break-words text-xs text-muted-foreground">{place || "Lieu non précisé"}</span>
            </span>
            <StageCounters counts={counts} />
            <span className="flex items-center gap-2 lg:flex-col lg:items-end lg:gap-1">
              <StatusPill status={status} />
              <span className="text-xs text-muted-foreground">{age}</span>
            </span>
            <ChevronRight className="hidden h-4 w-4 text-muted-foreground lg:block" aria-hidden="true" />
          </button>
        </li>
      );
    })}
  </ul>
);

export default NeedsList;
