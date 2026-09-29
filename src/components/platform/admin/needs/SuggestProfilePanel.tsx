import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Filter, Search, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { METIERS } from "@/lib/taxonomy";
import { PIPELINE_STEPS, type ClientNeed, type ProfileSuggestion, type RecruiterProfile } from "./needsModel";

const SECTORS_OPTIONS = ["Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie"];

interface Props {
  need: ClientNeed;
  /** Tous les besoins et suggestions : détection des profils déjà proposés au même client. */
  needs: ClientNeed[];
  suggestions: ProfileSuggestion[];
  profiles: RecruiterProfile[];
  onAdd: (profileId: string) => Promise<boolean>;
  onCancel: () => void;
}

/** Choix manuel d'un profil à suggérer pour un besoin, avec filtres. */
const SuggestProfilePanel = ({ need, needs, suggestions, profiles, onAdd, onCancel }: Props) => {
  const [selectedId, setSelectedId] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [model, setModel] = useState("all");
  const [mobility, setMobility] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [tjmRange, setTjmRange] = useState<[number, number]>([0, 1500]);
  const [tjmActive, setTjmActive] = useState(false);
  const [availability, setAvailability] = useState("all"); // "all" | "available" | "soon"

  const clearFilters = () => {
    setSearch("");
    setModel("all");
    setMobility("");
    setTjmRange([0, 1500]);
    setTjmActive(false);
    setSkills([]);
    setSectors([]);
    setRating(0);
    setAvailability("all");
  };

  // Profil déjà proposé au MÊME client sur un AUTRE besoin ?
  const duplicateInfo = useMemo(() => {
    const otherNeeds = new Map(needs.filter((n) => n.id !== need.id && n.user_id === need.user_id).map((n) => [n.id, n]));
    const out = new Map<string, { count: number; details: { jobTitle: string; statusLabel: string }[] }>();
    if (otherNeeds.size === 0) return out;
    for (const s of suggestions) {
      const other = otherNeeds.get(s.need_id);
      if (!other) continue;
      const entry = out.get(s.recruiter_profile_id) ?? { count: 0, details: [] };
      entry.count += 1;
      entry.details.push({
        jobTitle: other.job_title || "—",
        statusLabel: PIPELINE_STEPS.find((p) => p.key === s.pipeline_status)?.label || s.pipeline_status,
      });
      out.set(s.recruiter_profile_id, entry);
    }
    return out;
  }, [needs, suggestions, need.id, need.user_id]);

  const filtered = useMemo(() => {
    const already = new Set(suggestions.filter((s) => s.need_id === need.id).map((s) => s.recruiter_profile_id));
    let result = profiles.filter((p) => !already.has(p.id));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          p.job_title?.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (model !== "all") result = result.filter((p) => p.model?.includes(model));
    if (mobility) result = result.filter((p) => p.mobility?.some((c) => c.toLowerCase() === mobility.toLowerCase()));
    if (tjmActive) result = result.filter((p) => p.tjm != null && p.tjm >= tjmRange[0] && p.tjm <= tjmRange[1]);
    if (skills.length > 0) result = result.filter((p) => skills.some((skill) => p.skills?.includes(skill)));
    if (sectors.length > 0) result = result.filter((p) => sectors.some((sector) => p.sectors?.includes(sector)));
    if (rating > 0) result = result.filter((p) => (p.admin_rating ?? 0) >= rating);
    if (availability === "available") {
      result = result.filter((p) => p.available === true);
    } else if (availability === "soon") {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      result = result.filter((p) => p.available || (p.availability_date ? new Date(p.availability_date) <= in30Days : false));
    }
    return result;
  }, [need.id, profiles, suggestions, search, model, mobility, tjmActive, tjmRange, skills, sectors, rating, availability]);

  const allCities = useMemo(() => {
    const cities = new Set<string>();
    profiles.forEach((p) => p.mobility?.forEach((c) => cities.add(c)));
    return Array.from(cities).sort();
  }, [profiles]);

  const filterCount = [
    model !== "all", mobility !== "", tjmActive, skills.length > 0, sectors.length > 0, rating > 0, availability !== "all",
  ].filter(Boolean).length;

  const add = async () => {
    if (!selectedId) return;
    setAdding(true);
    const ok = await onAdd(selectedId);
    setAdding(false);
    if (ok) setSelectedId("");
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, compétence..."
            aria-label="Rechercher un profil à suggérer"
            className="h-9 pl-10 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />

          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="h-7 w-auto min-w-[110px] text-xs" aria-label="Disponibilité">
              <SelectValue placeholder="Disponibilité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="soon">Dispo. sous 30j</SelectItem>
            </SelectContent>
          </Select>

          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs" aria-label="Modèle">
              <SelectValue placeholder="Modèle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous modèles</SelectItem>
              <SelectItem value="RPO">RPO</SelectItem>
            </SelectContent>
          </Select>

          <Select value={mobility || "all"} onValueChange={(v) => setMobility(v === "all" ? "" : v)}>
            <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs" aria-label="Mobilité">
              <SelectValue placeholder="Mobilité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes villes</SelectItem>
              {allCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-7 text-xs", tjmActive && "border-primary text-primary")}>
                {tjmActive ? `${tjmRange[0]}€ - ${tjmRange[1]}€` : "TJM"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3" align="start">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">TJM (€/jour)</Label>
                <div className="flex items-center gap-1.5">
                  <Checkbox checked={tjmActive} onCheckedChange={(c) => setTjmActive(!!c)} aria-label="Activer le filtre TJM" />
                  <span className="text-[10px] text-muted-foreground">Activer</span>
                </div>
              </div>
              <Slider
                min={0}
                max={1500}
                step={50}
                value={tjmRange}
                onValueChange={(v) => { setTjmRange([v[0], v[1]]); setTjmActive(true); }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{tjmRange[0]}€</span><span>{tjmRange[1]}€</span>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-7 text-xs", skills.length > 0 && "border-primary text-primary")}>
                Métiers {skills.length > 0 && `(${skills.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 space-y-2" align="start">
              <Label className="text-xs font-medium">Métiers recrutés</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {METIERS.map((skill) => (
                  <label key={skill} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={skills.includes(skill)}
                      onCheckedChange={(checked) =>
                        setSkills(checked ? [...skills, skill] : skills.filter((s) => s !== skill))}
                    />
                    <span className="text-xs">{skill}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-7 text-xs", sectors.length > 0 && "border-primary text-primary")}>
                Secteurs {sectors.length > 0 && `(${sectors.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 space-y-2" align="start">
              <Label className="text-xs font-medium">Secteurs</Label>
              <div className="space-y-1">
                {SECTORS_OPTIONS.map((sector) => (
                  <label key={sector} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={sectors.includes(sector)}
                      onCheckedChange={(checked) =>
                        setSectors(checked ? [...sectors, sector] : sectors.filter((s) => s !== sector))}
                    />
                    <span className="text-xs">{sector}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-7 gap-1 text-xs", rating > 0 && "border-primary text-primary")}>
                <Star className={cn("h-3 w-3", rating > 0 && "fill-amber-400 text-amber-400")} aria-hidden="true" />
                {rating > 0 ? `≥ ${rating}★` : "Note"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 space-y-2" align="start">
              <Label className="text-xs font-medium">Note admin min.</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Note minimale ${star} sur 5`}
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={cn("h-4 w-4", rating >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {filterCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] text-muted-foreground" onClick={clearFilters}>
              <X className="h-3 w-3" aria-hidden="true" /> Réinitialiser ({filterCount})
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="max-h-[240px]">
        <div className="space-y-1.5" role="listbox" aria-label="Profils disponibles">
          {filtered.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">Aucun profil trouvé avec ces filtres.</p>
          ) : (
            filtered.map((p) => {
              const dup = duplicateInfo.get(p.id);
              const selected = selectedId === p.id;
              return (
                <div
                  key={p.id}
                  role="option"
                  aria-selected={selected}
                  tabIndex={0}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-primary/10"
                      : dup
                        ? "border-orange-300 bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
                        : "border-border hover:bg-muted/50",
                  )}
                  onClick={() => setSelectedId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(p.id); }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-xs font-medium">{p.first_name} {p.last_name}</span>
                      {p.super_tam && <span title="Super TAM">🥇</span>}
                      {p.model && <Badge variant="secondary" className="h-4 text-[9px]">{p.model}</Badge>}
                      {p.available ? (
                        <Badge variant="outline" className="h-4 border-green-300 text-[9px] text-green-600">Dispo</Badge>
                      ) : p.availability_date ? (
                        <Badge variant="outline" className="h-4 border-orange-300 text-[9px] text-orange-500">
                          {new Date(p.availability_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </Badge>
                      ) : null}
                      {dup && (
                        <Badge
                          variant="outline"
                          className="h-4 gap-0.5 border-orange-400 bg-orange-100/60 text-[9px] text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                          title={dup.details.map((d) => `${d.jobTitle} → ${d.statusLabel}`).join("\n")}
                        >
                          <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                          Déjà proposé ×{dup.count}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {p.job_title && <span className="truncate">{p.job_title}</span>}
                      {p.tjm && <span>{p.tjm}€/j</span>}
                      {(p.admin_rating ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />{p.admin_rating}
                        </span>
                      )}
                    </div>
                    {dup && (
                      <p className="mt-0.5 truncate text-[10px] text-orange-700 dark:text-orange-400">
                        → {dup.details.map((d) => `${d.jobTitle} (${d.statusLabel})`).join(" • ")}
                      </p>
                    )}
                  </div>
                  {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between border-t border-border/50 pt-1">
        <span className="text-[10px] text-muted-foreground">{filtered.length} profil(s) disponible(s)</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="h-8" onClick={onCancel}>
            Annuler
          </Button>
          <Button size="sm" className="h-8" disabled={!selectedId || adding} onClick={add}>
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestProfilePanel;
