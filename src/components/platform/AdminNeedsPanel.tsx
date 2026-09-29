import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Building2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NeedsList from "./admin/needs/NeedsList";
import NeedDetail from "./admin/needs/NeedDetail";
import { useNeeds } from "./admin/needs/useNeeds";
import {
  EMPTY_FILTERS, NEED_PARAM, NEED_STATUS, applyFiltersToParams, filterAndSortRows, filtersFromParams,
  type NeedDisplayStatus, type NeedFilters,
} from "./admin/needs/needsModel";

const ALL = "all";

/**
 * Onglet « Besoins » : liste filtrable (?tab=needs&q=…&status=…&client=…&todo=1)
 * et détail d'un besoin (&need=<id>) avec son pipeline de profils.
 */
const AdminNeedsPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openNeedId = searchParams.get(NEED_PARAM);
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const data = useNeeds({ withProfiles: true });
  const { rows, loading, error } = data;

  const visible = useMemo(() => filterAndSortRows(rows, filters), [rows, filters]);
  const todoCount = useMemo(() => rows.filter((r) => r.todo.length > 0).length, [rows]);
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(({ need }) => { if (!map.has(need.user_id)) map.set(need.user_id, need.company_name || "Client sans nom"); });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [rows]);

  const setFilters = (patch: Partial<NeedFilters>) => {
    setSearchParams((prev) => applyFiltersToParams(prev, { ...filtersFromParams(prev), ...patch }), { replace: true });
  };

  const openNeed = useCallback((id: string | null, replace = false) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set(NEED_PARAM, id);
      else next.delete(NEED_PARAM);
      return next;
    }, { replace });
  }, [setSearchParams]);
  const navigateTo = useCallback((id: string) => openNeed(id, true), [openNeed]);

  if (loading) return <div className="py-8 text-center text-muted-foreground" role="status">Chargement des besoins clients…</div>;

  if (openNeedId) {
    const row = rows.find((r) => r.need.id === openNeedId) ?? null;
    // Précédent / suivant dans l'ordre et les filtres de la liste ; un besoin hors filtres n'a pas de voisins.
    const index = visible.findIndex((r) => r.need.id === openNeedId);
    return (
      <NeedDetail
        row={row}
        data={data}
        prevId={index > 0 ? visible[index - 1].need.id : null}
        nextId={index >= 0 && index < visible.length - 1 ? visible[index + 1].need.id : null}
        position={index >= 0 ? { index, total: visible.length } : null}
        onBack={() => openNeed(null)}
        onNavigate={navigateTo}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <Building2 className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">{error ? `Chargement impossible : ${error}` : "Aucun besoin client déposé."}</p>
      </div>
    );
  }

  const hasFilters = filters.q !== "" || filters.status !== "" || filters.client !== "" || filters.todo;

  return (
    <div className="min-w-0 space-y-4">
      {/* Recherche et filtres (conservés dans l'URL) */}
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            placeholder="Rechercher un poste, un client…"
            aria-label="Rechercher un besoin par poste ou client"
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={filters.status || ALL} onValueChange={(v) => setFilters({ status: v === ALL ? "" : (v as NeedDisplayStatus) })}>
            <SelectTrigger className="h-9 min-w-0 text-sm sm:w-40" aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              {(Object.keys(NEED_STATUS) as NeedDisplayStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{NEED_STATUS[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.client || ALL} onValueChange={(v) => setFilters({ client: v === ALL ? "" : v })}>
            <SelectTrigger className="h-9 min-w-0 text-sm sm:w-52" aria-label="Filtrer par client">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les clients</SelectItem>
              {clients.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={filters.todo ? "default" : "outline"}
            size="sm"
            className="col-span-2 h-9 gap-2 text-xs sm:col-span-1"
            aria-pressed={filters.todo}
            onClick={() => setFilters({ todo: !filters.todo })}
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            À traiter seulement ({todoCount})
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="col-span-2 h-9 gap-1 text-xs text-muted-foreground sm:col-span-1" onClick={() => setFilters(EMPTY_FILTERS)}>
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Réinitialiser
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {visible.length} besoin{visible.length > 1 ? "s" : ""}{hasFilters ? ` sur ${rows.length}` : ""} · à traiter d'abord, puis les plus récents
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun besoin ne correspond à ces filtres.
        </div>
      ) : (
        <NeedsList rows={visible} onOpen={(id) => openNeed(id)} />
      )}
    </div>
  );
};

export default AdminNeedsPanel;
