import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Vos coordonnées", "Votre premier besoin"];

/** Fil d'étapes de l'onboarding client (étape courante : 1 ou 2). */
const OnboardingSteps = ({ current }: { current: 1 | 2 }) => (
  <ol className="mb-8 flex items-center gap-3" aria-label="Étapes de l'inscription">
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      return (
        <li key={label} className="flex flex-1 items-center gap-3" aria-current={n === current ? "step" : undefined}>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              done || n === current ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {done ? <Check className="h-4 w-4" /> : n}
          </span>
          <span className={cn("text-sm", n === current ? "font-semibold" : "text-muted-foreground")}>{label}</span>
          {n < STEPS.length && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
        </li>
      );
    })}
  </ol>
);

export default OnboardingSteps;
