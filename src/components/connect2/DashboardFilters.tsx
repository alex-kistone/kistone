import { useState, useMemo, useEffect } from "react";
import { Search, Filter, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { type FullProfile } from "@/components/connect2/ProfileDetailModal";

const SKILLS_OPTIONS = [
  "Tech", "Data", "Product", "Sales", "Life Science", "Industrie",
  "Energies", "Digital & Marketing", "Fonctions support", "CFO",
  "Banque/Assurance", "Autre",
];

const SECTORS_OPTIONS = [
  "Startup/scaleup", "Banque/assurance", "Retail", "ESN", "Industrie",
];

interface DashboardFiltersProps {
  profiles: FullProfile[];
  onFiltered: (filtered: FullProfile[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  viewMode: "grid" | "kanban";
  onViewModeChange: (mode: "grid" | "kanban") => void;
}

const DashboardFilters = ({
  profiles,
  onFiltered,
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}: DashboardFiltersProps) => {
  const [modelFilter, setModelFilter] = useState("all");
  const [mobilityFilter, setMobilityFilter] = useState("");
  const [tjmRange, setTjmRange] = useState<[number, number]>([0, 1500]);
  const [tjmActive, setTjmActive] = useState(false);
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [sectorsFilter, setSectorsFilter] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);

  // Extract unique cities from all profiles
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    profiles.forEach((p) => p.mobility?.forEach((c) => cities.add(c)));
    return Array.from(cities).sort();
  }, [profiles]);

  // Extract unique languages
  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    profiles.forEach((p) =>
      (p.languages as any[])?.forEach((l) => {
        if (l.language?.trim()) langs.add(l.language.trim());
      })
    );
    return Array.from(langs).sort();
  }, [profiles]);

  const activeFilterCount = [
    modelFilter !== "all",
    mobilityFilter !== "",
    tjmActive,
    skillsFilter.length > 0,
    sectorsFilter.length > 0,
    languageFilter !== "",
    ratingFilter > 0,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setModelFilter("all");
    setMobilityFilter("");
    setTjmRange([0, 1500]);
    setTjmActive(false);
    setSkillsFilter([]);
    setSectorsFilter([]);
    setLanguageFilter("");
    setRatingFilter(0);
  };

  // Apply filters
  useEffect(() => {
    let result = [...profiles];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q)) ||
          p.clients?.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (modelFilter !== "all") {
      result = result.filter((p) => p.model?.includes(modelFilter));
    }

    if (mobilityFilter) {
      result = result.filter((p) =>
        p.mobility?.some((c) => c.toLowerCase() === mobilityFilter.toLowerCase())
      );
    }

    if (tjmActive) {
      result = result.filter(
        (p) => p.tjm != null && p.tjm >= tjmRange[0] && p.tjm <= tjmRange[1]
      );
    }

    if (skillsFilter.length > 0) {
      result = result.filter((p) =>
        skillsFilter.some((skill) => p.skills?.includes(skill))
      );
    }

    if (sectorsFilter.length > 0) {
      result = result.filter((p) =>
        sectorsFilter.some((sector) => (p as any).sectors?.includes(sector))
      );
    }

    if (languageFilter) {
      result = result.filter((p) =>
        (p.languages as any[])?.some(
          (l) => l.language?.toLowerCase() === languageFilter.toLowerCase()
        )
      );
    }

    if (ratingFilter > 0) {
      result = result.filter((p) => (p.admin_rating ?? 0) >= ratingFilter);
    }

    // Sort
    if (sortBy === "tjm") {
      result.sort((a, b) => (a.tjm || 0) - (b.tjm || 0));
    } else if (sortBy === "availability") {
      result.sort(
        (a, b) =>
          new Date(a.availability_date || "9999").getTime() -
          new Date(b.availability_date || "9999").getTime()
      );
    } else {
      result.sort((a, b) => a.last_name.localeCompare(b.last_name));
    }

    onFiltered(result);
  }, [
    profiles, search, modelFilter, mobilityFilter,
    tjmRange, tjmActive, skillsFilter, sectorsFilter,
    languageFilter, ratingFilter, sortBy,
  ]);

  return (
    <div className="mb-6 space-y-3">
      {/* Row 1: Search + Sort + View toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom, compétence, client..."
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="tjm">TJM</SelectItem>
            <SelectItem value="availability">Disponibilité</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange("grid")}
              title="Vue grille"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange("kanban")}
              title="Vue Kanban"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Row 2: Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Modèle (100% RPO) */}

        {/* Mobilité */}
        <Select value={mobilityFilter || "all"} onValueChange={(v) => setMobilityFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
            <SelectValue placeholder="Mobilité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes villes</SelectItem>
            {allCities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* TJM Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={`h-8 text-xs ${tjmActive ? "border-primary text-primary" : ""}`}>
              {tjmActive ? `${tjmRange[0]}€ - ${tjmRange[1]}€` : "Range TJM"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-4" align="start">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">TJM (€/jour)</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={tjmActive}
                  onCheckedChange={(checked) => setTjmActive(!!checked)}
                />
                <span className="text-xs text-muted-foreground">Activer</span>
              </div>
            </div>
            <Slider
              min={0}
              max={1500}
              step={50}
              value={tjmRange}
              onValueChange={(v) => { setTjmRange(v as [number, number]); setTjmActive(true); }}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{tjmRange[0]}€</span>
              <span>{tjmRange[1]}€</span>
            </div>
          </PopoverContent>
        </Popover>

        {/* Métiers recrutés */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={`h-8 text-xs ${skillsFilter.length > 0 ? "border-primary text-primary" : ""}`}>
              Métiers {skillsFilter.length > 0 && `(${skillsFilter.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-2" align="start">
            <Label className="text-sm font-medium">Métiers recrutés</Label>
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {SKILLS_OPTIONS.map((skill) => (
                <label key={skill} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={skillsFilter.includes(skill)}
                    onCheckedChange={(checked) => {
                      if (checked) setSkillsFilter([...skillsFilter, skill]);
                      else setSkillsFilter(skillsFilter.filter((s) => s !== skill));
                    }}
                  />
                  <span className="text-xs">{skill}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Secteurs */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={`h-8 text-xs ${sectorsFilter.length > 0 ? "border-primary text-primary" : ""}`}>
              Secteurs {sectorsFilter.length > 0 && `(${sectorsFilter.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-2" align="start">
            <Label className="text-sm font-medium">Secteurs / Environnements</Label>
            <div className="space-y-1.5">
              {SECTORS_OPTIONS.map((sector) => (
                <label key={sector} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={sectorsFilter.includes(sector)}
                    onCheckedChange={(checked) => {
                      if (checked) setSectorsFilter([...sectorsFilter, sector]);
                      else setSectorsFilter(sectorsFilter.filter((s) => s !== sector));
                    }}
                  />
                  <span className="text-xs">{sector}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Note admin (étoiles) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={`h-8 gap-1 text-xs ${ratingFilter > 0 ? "border-primary text-primary" : ""}`}>
              <Star className={`h-3 w-3 ${ratingFilter > 0 ? "fill-amber-400 text-amber-400" : ""}`} />
              {ratingFilter > 0 ? `≥ ${ratingFilter}★` : "Note"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 space-y-2" align="start">
            <Label className="text-sm font-medium">Note admin minimum</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingFilter(ratingFilter === star ? 0 : star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-5 w-5 ${
                      ratingFilter >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {ratingFilter > 0 && (
              <p className="text-xs text-muted-foreground">Affiche les profils notés ≥ {ratingFilter}</p>
            )}
          </PopoverContent>
        </Popover>

        {/* Langues */}
        <Select value={languageFilter || "all"} onValueChange={(v) => setLanguageFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
            <SelectValue placeholder="Langues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes langues</SelectItem>
            {allLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground" onClick={clearAllFilters}>
            <X className="h-3 w-3" />
            Réinitialiser ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardFilters;
