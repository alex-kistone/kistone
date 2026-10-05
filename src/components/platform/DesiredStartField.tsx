import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { todayIso } from "@/lib/needStart";

type Props = {
  /** Mode choisi : dès que possible, ou à une date précise. */
  asap: boolean;
  /** Date AAAA-MM-JJ (utilisée seulement hors « dès que possible »). */
  date: string;
  onChange: (next: { asap: boolean; date: string }) => void;
};

/**
 * Date d'arrivée souhaitée d'un besoin. Le matching mesure la disponibilité des profils
 * par rapport à cette date (avec 30 jours de tolérance).
 */
export default function DesiredStartField({ asap, date, onChange }: Props) {
  return (
    <div className="space-y-3">
      <Label id="desired-start-label">Date d'arrivée souhaitée</Label>
      <RadioGroup
        aria-labelledby="desired-start-label"
        value={asap ? "asap" : "date"}
        onValueChange={(v) => onChange({ asap: v === "asap", date })}
        className="flex flex-wrap gap-x-6 gap-y-2"
      >
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <RadioGroupItem value="asap" /> Dès que possible
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <RadioGroupItem value="date" /> À partir d'une date
        </label>
      </RadioGroup>
      {!asap && (
        <Input
          type="date"
          aria-label="Date d'arrivée souhaitée"
          min={todayIso()}
          value={date}
          onChange={(e) => onChange({ asap: false, date: e.target.value })}
          className="max-w-[220px]"
          required
        />
      )}
    </div>
  );
}
