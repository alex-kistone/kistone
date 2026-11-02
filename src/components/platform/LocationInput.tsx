import { useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LOCATION_OPTIONS, normalizePlace } from "@/lib/locations";
import { cn } from "@/lib/utils";

interface LocationInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

/**
 * Mobilité du freelance : la France, une région ou un pays, choisis dans une liste fixe filtrée à
 * la frappe (aucun appel réseau). La valeur enregistrée reste un nom de lieu, que le matching
 * rapproche des villes de mission (src/lib/locations.ts).
 */
const LocationInput = ({ tags, onTagsChange, placeholder = "Une région ou un pays" }: LocationInputProps) => {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useRef(`location-list-${Math.random().toString(36).slice(2)}`).current;

  const q = normalizePlace(input);
  const chosen = new Set(tags.map(normalizePlace));
  const options = LOCATION_OPTIONS.filter((o) => !chosen.has(normalizePlace(o.value)))
    // Les lieux qui commencent par la saisie d'abord, puis ceux qui la contiennent
    .filter((o) => !q || normalizePlace(o.value).includes(q))
    .sort((a, b) => Number(normalizePlace(b.value).startsWith(q)) - Number(normalizePlace(a.value).startsWith(q)));

  const add = (value: string) => {
    onTagsChange([...tags, value]);
    setInput("");
    setActive(0);
  };

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button type="button" onClick={() => onTagsChange(tags.filter((t) => t !== tag))} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20" aria-label={`Retirer ${tag}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (options[active]) add(options[active].value);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          className="pl-9"
        />
        {open && (
          <ul id={listId} role="listbox" className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-lg">
            {options.length === 0 ? (
              <li className="px-4 py-2.5 text-sm text-muted-foreground">Aucune région ni aucun pays ne correspond</li>
            ) : (
              options.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => add(o.value)}
                  className={cn("flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm", i === active && "bg-muted")}
                >
                  <span className="font-medium text-foreground">{o.value}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{o.kind}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LocationInput;
