import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { METIERS } from "@/lib/taxonomy";
import { palettes } from "@/lib/palettes";
import { VERTICALS, verticalOf, type Vertical } from "@/lib/verticals";
import { cn } from "@/lib/utils";

const RHYTHMS = [
  { value: "5", label: "Temps plein" },
  { value: "4", label: "4 jours par semaine" },
  { value: "3", label: "3 jours par semaine" },
  { value: "2", label: "2 jours par semaine" },
  { value: "1", label: "1 jour par semaine" },
];

type Props = {
  vertical: Vertical;
  onVertical: (v: Vertical) => void;
  /** Métiers à recruter (RPO). */
  profileTypes: string[];
  onProfileTypes: (v: string[]) => void;
  /** Spécialités attendues (départements C-Level). */
  specialties: string[];
  onSpecialties: (v: string[]) => void;
  /** Jours par semaine demandés, "5" = temps plein. */
  days: string;
  onDays: (v: string) => void;
  /** Fonction déjà choisie à l'écran précédent (parcours public) : pas de nouveau choix ici. */
  hideFunctionChoice?: boolean;
};

const toggle = (list: string[], value: string, on: boolean) => (on ? [...list, value] : list.filter((x) => x !== value));

/**
 * Le « quoi » d'un besoin : la fonction recherchée (RPO, DRH, CFO, COO, CRO, CTO), puis les
 * métiers à recruter (RPO) ou les spécialités attendues (C-Level), et le rythme souhaité.
 */
export default function NeedFunctionFields({ vertical, onVertical, profileTypes, onProfileTypes, specialties, onSpecialties, days, onDays, hideFunctionChoice }: Props) {
  const conf = verticalOf(vertical);
  const isRpo = vertical === "rpo";

  return (
    <>
      {!hideFunctionChoice && (
      <div className="space-y-3">
        <Label id="need-function-label">Fonction recherchée</Label>
        <div role="radiogroup" aria-labelledby="need-function-label" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {VERTICALS.map((v) => {
            const p = palettes[v.palette];
            const on = v.id === vertical;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  if (v.id === vertical) return;
                  onVertical(v.id);
                  // Les spécialités d'une fonction n'ont pas de sens pour une autre
                  onSpecialties([]);
                }}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
                  on ? "border-foreground ring-1 ring-foreground" : "border-border hover:bg-muted/50",
                )}
              >
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: p.tint, color: p.ink }}>{v.short}</span>
                <span className="text-sm font-semibold leading-tight">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {isRpo ? (
        <div className="space-y-3">
          <Label>Typologies de profils recherchés</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {METIERS.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2">
                <Checkbox checked={profileTypes.includes(type)} onCheckedChange={(c) => onProfileTypes(toggle(profileTypes, type, !!c))} />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Label>Spécialités attendues</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {conf.specialties.map((sp) => (
              <label key={sp} className="flex cursor-pointer items-center gap-2">
                <Checkbox checked={specialties.includes(sp)} onCheckedChange={(c) => onSpecialties(toggle(specialties, sp, !!c))} />
                <span className="text-sm">{sp}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="need-rhythm">Rythme souhaité</Label>
        <Select value={days} onValueChange={onDays}>
          <SelectTrigger id="need-rhythm" className="max-w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RHYTHMS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
