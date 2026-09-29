import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eur } from "@/lib/invoices";
import { monthLabel, monthsEndingAt, type MonthKey } from "@/lib/treasury";
import { LATE_AMOUNT, PILL_TONES, type PillTone } from "./palette";

export const KpiCard = ({ label, value, hint, icon: Icon, tone }: { label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon; tone?: "danger" | "success" }) => (
  <div className="min-w-0 rounded-xl border border-border bg-card p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
    </div>
    <p className={`mt-1 break-words text-2xl font-bold tabular-nums ${tone === "danger" ? "text-destructive" : tone === "success" ? "text-[#17693D]" : ""}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export const Section = ({ title, description, action, children }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) => (
  <section aria-label={title} className="min-w-0 rounded-xl border border-border bg-card">
    <header className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

export const EmptyState = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-10 text-center">
    <Icon className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

/** Cellule de tableau qui devient une ligne « libellé / valeur » sur mobile. */
export const Cell = ({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) => (
  <span className={`block min-w-0 ${className}`}>
    <span className="block text-xs text-muted-foreground md:sr-only">{label}</span>
    <span className="block break-words text-sm">{children}</span>
  </span>
);

export const MonthSelect = ({ id, value, onChange, last, count = 24, label }: { id: string; value: MonthKey; onChange: (m: MonthKey) => void; last: MonthKey; count?: number; label: string }) => (
  <div className="flex items-center gap-2">
    <label htmlFor={id} className="text-sm text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-9 w-[170px] bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {monthsEndingAt(last, count).reverse().map((m) => (
          <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const StatusPill = ({ tone, children }: { tone: PillTone; children: ReactNode }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PILL_TONES[tone]}`}>{children}</span>
);

/**
 * Montant selon son statut : réglé (normal), attendu (semi-gras), en retard (alerte + soulignement ondulé),
 * prévisionnel (italique atténué, « ≈ »). Les sorties sont préfixées de « − ».
 */
export type AmountStatus = "paid" | "expected" | "late" | "forecast";
export const Amount = ({ value, status = "paid", outflow = false, alert = false }: { value: number; status?: AmountStatus; outflow?: boolean; alert?: boolean }) => {
  const neg = !outflow && value < -0.004;
  const danger = alert || neg;
  const style = status === "late" ? (danger ? "font-semibold underline decoration-wavy underline-offset-4" : LATE_AMOUNT)
    : status === "expected" ? "font-semibold"
    : status === "forecast" ? `italic ${danger ? "" : "text-muted-foreground"}`
    : "";
  const text = `${status === "forecast" ? "≈ " : ""}${(outflow && Math.abs(value) > 0.004) || neg ? "− " : ""}${eur(Math.abs(value))}`;
  return <span className={`whitespace-nowrap tabular-nums ${style} ${danger ? "text-destructive" : ""}`}>{text}</span>;
};
