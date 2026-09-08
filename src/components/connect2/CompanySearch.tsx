import { useState, useRef } from "react";
import { Search, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanyResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string;
  nature_juridique: string;
  siege: {
    adresse: string;
    code_postal: string;
    libelle_commune: string;
  };
  nombre_etablissements: number;
  categorie_juridique?: string;
}

// Map common legal form codes to human-readable labels
const LEGAL_FORM_MAP: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "5410": "SARL",
  "5499": "SARL",
  "5498": "SARL unipersonnelle (EURL)",
  "5710": "SAS",
  "5720": "SASU",
  "5599": "SA",
  "5510": "SA à conseil d'administration",
  "5505": "SA à directoire",
  "6540": "Société civile",
  "5306": "SNC",
  "9220": "Association déclarée",
  "9300": "Fondation",
};

function getLegalFormLabel(code: string | undefined): string {
  if (!code) return "";
  return LEGAL_FORM_MAP[code] || code;
}

function computeTvaNumber(siren: string): string {
  const sirenNum = parseInt(siren.replace(/\s/g, ""), 10);
  if (isNaN(sirenNum)) return "";
  const key = (12 + 3 * (sirenNum % 97)) % 97;
  return `FR${key.toString().padStart(2, "0")}${siren.replace(/\s/g, "")}`;
}

export interface CompanyData {
  companyName: string;
  siren: string;
  legalForm: string;
  companyAddress: string;
  tvaNumber: string;
}

interface CompanySearchProps {
  onSelect: (data: CompanyData) => void;
}

const CompanySearch = ({ onSelect }: CompanySearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=5`
      );
      const data = await res.json();
      const items = (data.results || []).map((r: any) => ({
        siren: r.siren,
        nom_complet: r.nom_complet,
        nom_raison_sociale: r.nom_raison_sociale,
        nature_juridique: r.nature_juridique,
        categorie_juridique: r.categorie_juridique,
        siege: {
          adresse: r.siege?.adresse || "",
          code_postal: r.siege?.code_postal || "",
          libelle_commune: r.siege?.libelle_commune || "",
        },
        nombre_etablissements: r.nombre_etablissements || 0,
      }));
      setResults(items);
      setOpen(items.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (r: CompanyResult) => {
    const address = [r.siege.adresse, r.siege.code_postal, r.siege.libelle_commune]
      .filter(Boolean)
      .join(", ");

    onSelect({
      companyName: r.nom_complet || r.nom_raison_sociale,
      siren: r.siren,
      legalForm: getLegalFormLabel(r.categorie_juridique),
      companyAddress: address,
      tvaNumber: computeTvaNumber(r.siren),
    });

    setQuery(r.nom_complet || r.nom_raison_sociale);
    setOpen(false);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Rechercher votre entreprise
      </Label>
      <p className="text-xs text-muted-foreground">
        Tapez le nom ou le SIREN pour auto-remplir les informations légales
      </p>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder="Ex : Connect2, 123 456 789..."
            className="pl-9"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
            {results.map((r) => (
              <button
                key={r.siren}
                type="button"
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent/50 first:rounded-t-lg last:rounded-b-lg"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(r)}
              >
                <span className="text-sm font-medium text-foreground">
                  {r.nom_complet || r.nom_raison_sociale}
                </span>
                <span className="text-xs text-muted-foreground">
                  SIREN : {r.siren}
                  {r.siege.libelle_commune && ` · ${r.siege.libelle_commune}`}
                  {r.categorie_juridique && ` · ${getLegalFormLabel(r.categorie_juridique)}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySearch;
