import { palettes } from "@/lib/palettes";
import type { UseCaseKind } from "@/content/studio";
import { Check } from "./icons";

/** Mini-interfaces animées des cartes de cas d'usage (décoratives). */

function BudgetUi() {
  const p = palettes.lilac;
  const bars = [
    [62, 58],
    [66, 70],
    [70, 64],
    [76, 82],
    [82, 78],
    [90, 86],
  ];
  return (
    <div className="flex flex-col gap-2.5 md:gap-3.5">
      <div className="flex items-baseline justify-between text-xs md:text-[13px]">
        <span className="font-semibold">Masse salariale 2026</span>
        <span className="hidden items-center gap-2.5 text-[11px] text-ks-subtle md:flex">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] bg-[#DCD3F4]" />Budget</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-[2px]" style={{ background: p.accent }} />Réel</span>
        </span>
      </div>
      <div className="grid h-16 grid-cols-6 items-end gap-2 md:h-[84px] md:gap-2.5">
        {bars.map(([b, r], i) => (
          <div key={i} className="flex h-full items-end gap-0.5 md:gap-[3px]">
            <span className="grow rounded-[3px] bg-[#DCD3F4] md:rounded" style={{ height: `${b}%` }} />
            <span className="ks-bar grow rounded-[3px] md:rounded" style={{ height: `${r}%`, background: p.accent, animationDelay: `${i * 0.15}s` }} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-[5px] text-[11px] md:gap-1.5 md:text-xs">
        <div className="flex justify-between">
          <span className="text-ks-subtle">
            Budget <span className="hidden md:inline">annuel </span>consommé
          </span>
          <span className="font-semibold" style={{ color: p.ink }}>68 %</span>
        </div>
        <div className="h-[5px] rounded-full md:h-1.5" style={{ background: p.soft }}>
          <div className="ks-fill h-full rounded-full" style={{ width: "68%", background: p.accent }} />
        </div>
      </div>
    </div>
  );
}

function Pill({ label, done = true, strong, delay }: { label: string; done?: boolean; strong?: boolean; delay: number }) {
  const p = palettes.sand;
  return (
    <span
      className="ks-pop flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-[7px] text-[10px] font-medium md:h-[22px] md:px-2 md:text-[11px]"
      style={{ background: strong ? p.accent : p.soft, color: strong ? "#FFFFFF" : p.ink, animationDelay: `${delay}s` }}
    >
      {label}
      {done ? <Check size={10} strokeWidth={3} /> : null}
    </span>
  );
}

function FreelancesUi() {
  const p = palettes.sand;
  const rows = [
    { init: "JM", name: "Julie M. · Dev", pills: [{ label: "KYC" }, { label: "CRA" }] },
    { init: "KB", name: "Karim B. · Data", pills: [{ label: "KYC" }, { label: "CRA à valider", done: false, strong: true }] },
    { init: "AL", name: "Anne L. · PMO", pills: [{ label: "Urssaf" }, { label: "Contrat" }] },
  ];
  return (
    <div className="flex flex-col text-xs md:gap-1 md:text-[13px]">
      <div className="hidden justify-between border-b border-[rgba(20,19,18,0.06)] pb-2 md:flex">
        <span className="font-semibold">Missions en cours</span>
        <span className="text-[11px] text-ks-subtle">Septembre</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.init} className={`flex h-10 items-center gap-2 md:h-11 md:gap-2.5 ${i < 2 ? "border-b border-[rgba(20,19,18,0.05)]" : ""}`}>
          <span
            className="hidden h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold md:flex"
            style={{ background: p.soft }}
          >
            {r.init}
          </span>
          <span className="min-w-0 grow truncate">{r.name}</span>
          <span className="flex gap-1">
            {r.pills.map((pl, j) => (
              <Pill key={pl.label} label={pl.label} done={pl.done} strong={pl.strong} delay={(i * 2 + j) * 0.4} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function EngagementUi() {
  const p = palettes.teal;
  const curve = "M0 64 C30 60 45 52 70 54 S115 40 140 42 S185 30 210 26 S255 18 300 10";
  const gauges = [
    ["Reconnaissance", 78],
    ["Charge", 56],
    ["Management", 70],
  ] as const;
  return (
    <div className="flex flex-col gap-2 md:gap-2.5">
      <div className="flex items-center justify-between text-xs md:text-[13px]">
        <span className="font-semibold">Pulse d’engagement</span>
        <span className="flex items-center gap-1.5 text-[10px] md:text-[11px]" style={{ color: p.ink }}>
          <span className="relative h-[7px] w-[7px] md:h-2 md:w-2">
            <span className="ks-ping absolute inset-0 rounded-full" style={{ background: p.accent }} />
            <span className="absolute inset-0 rounded-full" style={{ background: p.accent }} />
          </span>
          En direct
        </span>
      </div>
      <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="block h-16 w-full md:h-20">
        <path d="M0 70 L300 70" stroke={p.soft} strokeWidth="2" />
        <path d={`${curve} L300 80 L0 80 Z`} fill={p.soft} />
        <path className="ks-draw" d={curve} fill="none" stroke={p.accent} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="grid grid-cols-3 gap-1.5 text-[10px] text-ks-subtle md:gap-2 md:text-[11px]">
        {gauges.map(([label, v], i) => (
          <div key={label} className="flex min-w-0 flex-col gap-1 md:gap-[5px]">
            <span className="truncate">{label}</span>
            <div className="h-1 rounded-full md:h-[5px]" style={{ background: p.soft }}>
              <div className="ks-fill h-full rounded-full" style={{ width: `${v}%`, background: p.accent, animationDelay: `${0.2 + i * 0.3}s` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MiniUi({ kind }: { kind: UseCaseKind }) {
  if (kind === "budget") return <BudgetUi />;
  if (kind === "freelances") return <FreelancesUi />;
  return <EngagementUi />;
}
