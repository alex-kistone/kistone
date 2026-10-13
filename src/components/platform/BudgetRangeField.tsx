import * as SliderPrimitive from "@radix-ui/react-slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { budgetError } from "@/lib/budget";

/** Bornes de l'échelle (€ HT / jour) ; un montant hors échelle reste saisissable au clavier. */
const RANGE_MIN = 300;
const RANGE_MAX = 2500;
const STEP = 50;

const clamp = (n: number) => Math.min(RANGE_MAX, Math.max(RANGE_MIN, n));

/**
 * Budget TJM d'un besoin : double curseur min / max, relié aux deux champs chiffrés.
 * Champs vides tant que le client n'a rien choisi (aucun montant suggéré).
 */
export default function BudgetRangeField({ min, max, onChange }: {
  min: string; max: string; onChange: (min: string, max: string) => void;
}) {
  const error = budgetError(min, max);
  const lo = min ? clamp(parseInt(min)) : RANGE_MIN;
  const hi = max ? clamp(parseInt(max)) : RANGE_MAX;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <Label id="budget-label">Budget TJM (€ HT / jour)</Label>
        {!min && !max && <span className="text-xs text-muted-foreground">Faites glisser pour choisir une fourchette</span>}
      </div>

      <SliderPrimitive.Root
        aria-labelledby="budget-label"
        min={RANGE_MIN}
        max={RANGE_MAX}
        step={STEP}
        minStepsBetweenThumbs={1}
        value={[lo, Math.max(hi, lo + STEP)]}
        onValueChange={([a, b]) => onChange(String(a), String(b))}
        className="relative flex h-6 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-ks-secondary">
          <SliderPrimitive.Range className={min || max ? "absolute h-full bg-ks-pink" : "absolute h-full bg-[#D9D2C7]"} />
        </SliderPrimitive.Track>
        {["Minimum", "Maximum"].map((label) => (
          <SliderPrimitive.Thumb
            key={label}
            aria-label={`TJM ${label.toLowerCase()}`}
            className="block h-5 w-5 rounded-full border-2 border-ks-pink bg-white shadow-sm transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ks-pink focus-visible:ring-offset-2 active:scale-110"
          />
        ))}
      </SliderPrimitive.Root>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{RANGE_MIN} €</span>
        <span>{RANGE_MAX} €+</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetMin" className="text-xs text-muted-foreground">Minimum</Label>
          <Input id="budgetMin" type="number" min={1} inputMode="numeric" value={min} onChange={(e) => onChange(e.target.value, max)} aria-invalid={!!error} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetMax" className="text-xs text-muted-foreground">Maximum</Label>
          <Input id="budgetMax" type="number" min={1} inputMode="numeric" value={max} onChange={(e) => onChange(min, e.target.value)} aria-invalid={!!error} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
