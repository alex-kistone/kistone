import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inscription directe : coordonnées, puis premier besoin. */
export const SIGNUP_STEPS = ["Vos coordonnées", "Votre premier besoin"];
/** Parcours public « Accéder aux profils » : le besoin d'abord, puis le compte et les coordonnées. */
export const NEED_FIRST_STEPS = ["Votre besoin", "Votre compte", "Vos coordonnées"];

/** Fil d'étapes de l'onboarding client (étape courante numérotée à partir de 1). */
const OnboardingSteps = ({ current, steps = SIGNUP_STEPS, className }: { current: number; steps?: string[]; className?: string }) => (
  <ol className={cn("mb-8 flex items-center gap-3", className)} aria-label="Étapes de l'inscription">
    {steps.map((label, i) => {
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
          {n < steps.length && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
        </li>
      );
    })}
  </ol>
);

export default OnboardingSteps;
