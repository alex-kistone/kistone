import { useSearchParams } from "react-router-dom";
import { TreasuryDashboard } from "@/components/platform/admin/treasury/TreasuryDashboard";
import { TreasuryCashView } from "@/components/platform/admin/treasury/TreasuryCashView";
import { FixedCostsView } from "@/components/platform/admin/treasury/FixedCostsView";
import { useTreasuryData } from "@/components/platform/admin/treasury/useTreasuryData";

/**
 * Pilotage (admin) : tableau de bord d'activité, trésorerie (flux, échéances, projection, TVA)
 * et frais fixes. La sous-vue est gardée dans l'URL (?view=).
 */

type View = "dashboard" | "cash" | "fixed";
const VIEWS: { key: View; label: string }[] = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "cash", label: "Trésorerie" },
  { key: "fixed", label: "Charges internes" },
];

const AdminTreasuryPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: View = VIEWS.some((v) => v.key === viewParam) ? (viewParam as View) : "dashboard";
  const { data, loading, reloadFixedCosts, reloadCashBalances } = useTreasuryData();

  const setView = (v: View) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (v === "dashboard") next.delete("view");
      else next.set("view", v);
      return next;
    }, { replace: true });
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 sm:w-fit" role="group" aria-label="Sections du pilotage">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            aria-pressed={view === v.key}
            onClick={() => setView(v.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Chargement">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : view === "dashboard" ? (
        <TreasuryDashboard data={data} />
      ) : view === "cash" ? (
        <TreasuryCashView data={data} onBalancesChanged={reloadCashBalances} />
      ) : (
        <FixedCostsView costs={data.fixedCosts} unavailable={data.fixedCostsError} onChanged={reloadFixedCosts} />
      )}
    </div>
  );
};

export default AdminTreasuryPanel;
