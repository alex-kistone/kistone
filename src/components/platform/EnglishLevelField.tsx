import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENGLISH_REQUIREMENTS } from "@/lib/englishLevel";

const NONE = "none";

/** Niveau d'anglais requis pour la mission (vide = non requis). */
export default function EnglishLevelField({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="english-level">Niveau d'anglais requis</Label>
      <Select value={value ? String(value) : NONE} onValueChange={(v) => onChange(v === NONE ? null : Number(v))}>
        <SelectTrigger id="english-level" className="w-full sm:w-80">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Non requis</SelectItem>
          {ENGLISH_REQUIREMENTS.map((e) => (
            <SelectItem key={e.value} value={String(e.value)}>
              {e.label} · {e.hint}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
