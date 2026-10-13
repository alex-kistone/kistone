import * as SliderPrimitive from "@radix-ui/react-slider";
import { Label } from "@/components/ui/label";

/** Libellé d'une durée de mission : « 6 mois », « À définir ». */
export const durationLabel = (months: number | null | undefined) =>
  !months ? "À définir" : months === 12 ? "12 mois et +" : `${months} mois`;

/**
 * Durée de mission souhaitée : curseur de 0 à 12 mois (0 = à définir).
 * La valeur vide (null) est enregistrée comme « à définir ».
 */
export default function MissionDurationField({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const v = value ?? 0;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <Label id="duration-label">Durée de la mission</Label>
        <span className="font-ks-display text-[18px] font-semibold tracking-[-0.02em]">{durationLabel(value)}</span>
      </div>
      <SliderPrimitive.Root
        aria-labelledby="duration-label"
        min={0}
        max={12}
        step={1}
        value={[v]}
        onValueChange={([m]) => onChange(m ? m : null)}
        className="relative flex h-6 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-ks-secondary">
          <SliderPrimitive.Range className={v ? "absolute h-full bg-ks-pink" : "absolute h-full bg-[#D9D2C7]"} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label="Durée en mois"
          aria-valuetext={durationLabel(value)}
          className="block h-5 w-5 rounded-full border-2 border-ks-pink bg-white shadow-sm transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ks-pink focus-visible:ring-offset-2 active:scale-110"
        />
      </SliderPrimitive.Root>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>À définir</span>
        <span>3 mois</span>
        <span>6 mois</span>
        <span>9 mois</span>
        <span>12 mois et +</span>
      </div>
    </div>
  );
}
