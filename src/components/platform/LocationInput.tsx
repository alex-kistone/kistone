import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Suggestion de lieu : la valeur enregistrée et une précision affichée (département, région). */
type Place = { value: string; hint: string };

const GEO_API = "https://geo.api.gouv.fr";
const WHOLE_COUNTRY: Place = { value: "Toute la France", hint: "Mobilité nationale" };
/** Comparaison sans accents, casse, tirets ni apostrophes (« ile de » trouve « Île-de-France »). */
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-'’]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Communes et régions françaises de la base officielle (geo.api.gouv.fr, sans clé), les plus
 * peuplées d'abord. « Toute la France » est proposé dès que la saisie y correspond.
 */
async function searchPlaces(q: string, signal: AbortSignal): Promise<Place[]> {
  const nom = encodeURIComponent(q);
  const [regions, communes] = await Promise.all([
    fetch(`${GEO_API}/regions?nom=${nom}&fields=nom&limit=2`, { signal }).then((r) => (r.ok ? r.json() : [])),
    fetch(`${GEO_API}/communes?nom=${nom}&fields=nom,codeDepartement&boost=population&limit=6`, { signal }).then((r) => (r.ok ? r.json() : [])),
  ]);
  const places: Place[] = [
    ...(regions as { nom: string }[]).map((r) => ({ value: r.nom, hint: "Région" })),
    ...(communes as { nom: string; codeDepartement: string }[]).map((c) => ({ value: c.nom, hint: `Ville · ${c.codeDepartement}` })),
  ];
  if (norm(WHOLE_COUNTRY.value).includes(norm(q)) || norm(q) === "france") places.unshift(WHOLE_COUNTRY);
  return places;
}

interface LocationInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

/**
 * Mobilité du freelance : saisie avec suggestions de communes et de régions françaises. La valeur
 * enregistrée reste un nom de lieu (« Lyon », « Île-de-France »), comme avant, pour le matching.
 * « Entrée » sans suggestion choisie garde la saisie libre (ville étrangère, « Télétravail »…).
 */
const LocationInput = ({ tags, onTagsChange, placeholder = "Ajoutez une ville ou une région" }: LocationInputProps) => {
  const [input, setInput] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Dernière liste connue : un ajout qui attend la base ne doit pas écraser les lieux ajoutés entre-temps
  const tagsRef = useRef(tags);
  tagsRef.current = tags;
  const listId = useRef(`location-list-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setPlaces([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchPlaces(q, controller.signal);
        setPlaces(found);
        setActive(found.length ? 0 : -1);
        setOpen(found.length > 0);
      } catch {
        // Base indisponible ou requête annulée : la saisie libre reste possible
        if (!controller.signal.aborted) setPlaces([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  const add = (value: string) => {
    const tag = value.trim();
    if (!tag) return;
    const current = tagsRef.current;
    if (!current.some((t) => norm(t) === norm(tag))) {
      tagsRef.current = [...current, tag];
      onTagsChange(tagsRef.current);
    }
    setInput("");
    setPlaces([]);
    setOpen(false);
  };

  /**
   * Saisie validée sans choisir dans la liste (suggestions pas encore arrivées) : on retient le
   * lieu officiel qui correspond (« bord » → « Bordeaux »), sinon la saisie libre.
   */
  const addTyped = async () => {
    const q = input.trim();
    if (!q) return;
    if (open && active >= 0) return add(places[active].value);
    let found: Place[] = [];
    try {
      found = q.length >= 2 ? await searchPlaces(q, new AbortController().signal) : [];
    } catch {
      // Base indisponible : saisie libre
    }
    const exact = (p: Place) => norm(p.value) === norm(q) || (p === WHOLE_COUNTRY && norm(q) === "france");
    const match = found.find(exact) ?? found.find((p) => norm(p.value).startsWith(norm(q)));
    add(match?.value ?? q);
  };

  const removeTag = (tagToRemove: string) => onTagsChange(tags.filter((t) => t !== tagToRemove));

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20" aria-label={`Retirer ${tag}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => places.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && places.length) {
                e.preventDefault();
                setOpen(true);
                setActive((i) => (i + 1) % places.length);
              } else if (e.key === "ArrowUp" && places.length) {
                e.preventDefault();
                setActive((i) => (i <= 0 ? places.length - 1 : i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                addTyped();
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
            aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
            className="pl-9"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />}
          {open && (
            <ul id={listId} role="listbox" className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
              {places.map((p, i) => (
                <li
                  key={`${p.value}-${p.hint}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => add(p.value)}
                  className={cn("flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm", i === active && "bg-accent/60")}
                >
                  <span className="font-medium text-foreground">{p.value}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{p.hint}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="button" variant="outline" onClick={addTyped} disabled={!input.trim()}>
          Ajouter
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Choisissez une ville ou une région dans la liste. Hors de France, tapez le lieu puis « Ajouter ».</p>
    </div>
  );
};

export default LocationInput;
