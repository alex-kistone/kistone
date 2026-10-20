import "./asset-visuals.css";

/**
 * Illustrations animées des quatre cartes du bento de l'accueil (qualification, matching,
 * réactivité, format), chacune dans sa teinte de carte. Purement décoratives.
 */

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center justify-between gap-2 rounded-[10px] bg-white px-3 py-2 text-[12px] text-ks-ink-2 shadow-[0_1px_2px_rgba(20,19,18,0.04)] ${className}`}>{children}</div>
);

function QualifyVisual() {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <Row>
        <span className="font-semibold text-ks-ink">Entretien de qualification</span>
        <span className="flex gap-0.5 text-[13px] text-[#4B35A0]">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className="ks-av-star inline-block" style={{ animationDelay: `${i * 0.18}s` }}>★</span>)}
        </span>
      </Row>
      {["Parcours", "Projets IA en production", "Références"].map((c, i) => (
        <Row key={c}>
          <span>{c}</span>
          <span className="ks-av-tick flex h-4 w-4 items-center justify-center rounded-full bg-[#2F9A63]" style={{ animationDelay: `${i * 0.45}s` }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
        </Row>
      ))}
    </div>
  );
}

function MatchVisual() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {["RAG", "Senior", "3 j / sem", "800 € / j"].map((c, i) => (
          <span key={c} className="ks-av-chip rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#1E4F8F]" style={{ animationDelay: `${i * 0.25}s` }}>{c}</span>
        ))}
      </div>
      <Row className="flex-col items-stretch gap-1.5">
        <span className="flex items-center justify-between">
          <span className="font-semibold text-ks-ink">Lina · AI Engineer</span>
          <span className="ks-av-score font-ks-display text-[15px] font-bold text-ks-ink">94 %</span>
        </span>
        <span className="h-1.5 rounded-full bg-[#EDF3FB]">
          <span className="ks-av-bar block h-1.5 w-[94%] rounded-full bg-[#3D7BD0]" />
        </span>
      </Row>
    </div>
  );
}

function SpeedVisual() {
  const steps = [
    { when: "Jour 0", what: "Votre besoin", at: "0%" },
    { when: "48 h", what: "1er profil", at: "50%" },
    { when: "Jour 7", what: "Démarrage", at: "100%" },
  ];
  return (
    <div className="w-full px-2">
      <div className="relative mx-2 mb-3 mt-1 h-1.5 rounded-full bg-white">
        <div className="ks-av-track absolute inset-0 rounded-full bg-[#2F9A63]" />
        {steps.map((s, i) => (
          <span
            key={s.when}
            className="ks-av-node absolute top-1/2 -ml-[7px] -mt-[7px] h-3.5 w-3.5 rounded-full border-2 border-white bg-[#2F9A63] shadow-sm"
            style={{ left: s.at, animationDelay: `${0.5 + i * 1.85}s` }}
          />
        ))}
      </div>
      <div className="flex justify-between gap-2">
        {steps.map((s, i) => (
          <div key={s.when} className={`ks-av-step flex flex-col ${i === 0 ? "items-start" : i === 1 ? "items-center" : "items-end"}`} style={{ animationDelay: `${0.5 + i * 1.85}s` }}>
            <span className="font-ks-mono text-[10px] uppercase tracking-[0.1em] text-[#1B6541]">{s.when}</span>
            <span className="mt-1 rounded-[8px] bg-white px-2 py-1 text-[11px] font-medium text-ks-ink-2">{s.what}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormatVisual() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative flex w-full rounded-full bg-white p-1 text-[11px] font-medium">
        <span className="ks-av-pick absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-ks-dark" aria-hidden="true" />
        {["Mission", "Fractional", "CtH"].map((f, i) => (
          <span key={f} className={`ks-av-label-${i} relative flex-1 py-1.5 text-center text-[#94471A]`}>{f}</span>
        ))}
      </div>
      <div className="flex gap-1.5">
        {["L", "M", "M", "J", "V"].map((d, i) => (
          <span
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${i === 0 || i === 2 ? "bg-[#E07A3A] text-white" : "ks-av-day-off"}`}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

const VISUALS = { shield: QualifyVisual, pulse: MatchVisual, clock: SpeedVisual, team: FormatVisual } as const;
const TINTS = { shield: "#E8E2F6", pulse: "#DDE8F5", clock: "#DCEEDF", team: "#FBE6D4" } as const;

export default function AssetVisual({ icon }: { icon: keyof typeof VISUALS }) {
  const Visual = VISUALS[icon];
  return (
    <div className="flex min-h-[148px] items-center rounded-[20px] p-4" style={{ background: TINTS[icon] }} aria-hidden="true">
      <Visual />
    </div>
  );
}
