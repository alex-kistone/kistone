import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Commune = { nom: string; departement?: { nom: string } };

/**
 * Ville du freelance (fiche admin) : suggestions des communes françaises de la base officielle
 * (geo.api.gouv.fr, sans clé). La valeur retenue précise le département et le pays
 * (« Saint-Denis, Seine-Saint-Denis, France ») pour que Jarvi la géocode sans ambiguïté.
 * Hors de France, la saisie libre est gardée telle quelle (« Barcelone, Espagne »).
 */
export default function CityInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Commune[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const listId = useRef(`city-list-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const q = query.trim();
    // Pas de recherche sur une valeur déjà complète (« Lyon, Rhône, France ») ni trop courte
    if (q.length < 2 || q.includes(",")) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,departement&boost=population&limit=6`,
          { signal: controller.signal },
        );
        setResults(res.ok ? await res.json() : []);
        setActive(0);
      } catch {
        // Base indisponible ou requête annulée : la saisie libre reste possible
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const label = (c: Commune) => [c.nom, c.departement?.nom, "France"].filter(Boolean).join(", ");
  const pick = (c: Commune) => {
    const v = label(c);
    setQuery(v);
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Ex : Lyon, ou Barcelone, Espagne"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        className="pl-9"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />}
      {open && results.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
          {results.map((c, i) => (
            <li
              key={`${c.nom}-${c.departement?.nom}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(c)}
              className={cn("flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm", i === active && "bg-muted")}
            >
              <span className="font-medium text-foreground">{c.nom}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{c.departement?.nom}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
