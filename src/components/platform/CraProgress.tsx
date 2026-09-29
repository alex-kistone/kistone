import { cn } from "@/lib/utils";

const STEPS = ["Saisi", "Envoyé", "Validé"] as const;

/** Étape d'un CRA : 1 saisie (ou à refaire), 2 envoyé au client, 3 validé (facturé ou non). */
const stepOf = (status: string | null | undefined): 1 | 2 | 3 => {
  if (status === "client_approved" || status === "admin_invoiced") return 3;
  if (status === "submitted") return 2;
  return 1;
};

interface Props {
  status: string | null | undefined;
  /** Trois segments et « x/3 » seulement, sans la ligne d'explication. */
  compact?: boolean;
  className?: string;
}

/** Jauge en trois étapes d'un CRA : Saisi → Envoyé → Validé ; un refus client repart à l'étape 1. */
const CraProgress = ({ status, compact = false, className }: Props) => {
  const step = stepOf(status);
  const rejected = status === "client_rejected";
  const label = rejected ? "refusé, à refaire" : STEPS[step - 1];
  return (
    <div
      role="img"
      aria-label={`Étape ${step} sur 3 : ${label}`}
      className={cn("flex flex-col gap-1", className)}
    >
      <div className="flex items-center gap-2">
        <div className="flex gap-1" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 w-6 rounded-full sm:w-7",
                i >= step
                  ? "bg-border"
                  : rejected
                    ? "bg-destructive"
                    : step === 3
                      ? "bg-[#1F9D5B]"
                      : "bg-primary",
              )}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground" aria-hidden="true">{step}/3</span>
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground" aria-hidden="true">
          {rejected ? "Refusé, à refaire" : STEPS[step - 1]}
          {step < 3 ? ` · en attente : ${step === 1 ? "freelance" : "client"}` : ""}
        </p>
      )}
    </div>
  );
};

export default CraProgress;
