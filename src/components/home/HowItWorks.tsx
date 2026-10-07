import SectionTag from "@/components/site/SectionTag";
import { RECRUITERS, STEPS } from "@/content/home";
import { palettes, type PaletteName } from "@/lib/palettes";

/** Une teinte de carte par étape (jamais le rose, réservé aux détails clés). */
const STEP_TINTS: PaletteName[] = ["apricot", "sage", "blue"];

/** Étape 1 : le besoin saisi, ses critères. */
function BriefMini() {
  const p = palettes.apricot;
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-[0_10px_24px_-16px_rgba(60,40,20,0.35)]">
      <div className="h-2 w-[85%] rounded-full bg-ks-secondary" />
      <div className="h-2 w-[62%] rounded-full bg-ks-secondary" />
      <div className="mt-1 flex flex-wrap gap-1.5">
        {["RPO Tech", "Paris", "Dès que possible"].map((c) => (
          <span key={c} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: p.soft, color: p.ink }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Étape 2 : la shortlist, triée par correspondance. */
function ShortlistMini() {
  const rows = [
    { r: RECRUITERS[0], score: 94 },
    { r: RECRUITERS[3], score: 88 },
  ];
  return (
    <div className="flex w-full flex-col gap-2">
      {rows.map(({ r, score }) => {
        const p = palettes[r.palette];
        return (
          <div key={r.name} className="flex items-center gap-2.5 rounded-2xl bg-white p-2.5 shadow-[0_10px_24px_-16px_rgba(60,40,20,0.35)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-ks-display text-[11px] font-semibold" style={{ background: p.tint, color: p.ink }}>
              {r.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold">{r.name}</div>
              <div className="mt-1 h-1 rounded-full bg-ks-secondary">
                <div className="h-1 rounded-full bg-ks-pink" style={{ width: `${score}%` }} />
              </div>
            </div>
            <span className="text-[12px] font-semibold">{score}%</span>
          </div>
        );
      })}
    </div>
  );
}

/** Étape 3 : le suivi de la mission. */
function TrackingMini() {
  const p = palettes.blue;
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_24px_-16px_rgba(60,40,20,0.35)]">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-semibold">Postes pourvus</span>
        <span className="font-ks-display text-[15px] font-semibold">2/3</span>
      </div>
      <div className="h-1.5 rounded-full bg-ks-secondary">
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: p.accent }} />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-ks-subtle">CRA d'octobre</span>
        <span className="rounded-full bg-[#E8F5EE] px-2 py-0.5 font-medium text-[#17663F]">Validé</span>
      </div>
    </div>
  );
}

const VISUALS = [BriefMini, ShortlistMini, TrackingMini];

export default function HowItWorks() {
  return (
    <section id="comment" className="mx-auto mt-24 flex max-w-ks scroll-mt-24 flex-col items-center px-5 text-center md:mt-[140px] md:px-8 xl:px-0">
      <SectionTag className="ks-reveal">Comment ça marche</SectionTag>
      <h2 className="ks-reveal mt-5 font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[72px]">
        Un recruteur senior.
        <br />
        Sans le CDI.
      </h2>
      <p className="ks-reveal mt-[18px] text-[17px] leading-[1.5] text-ks-soft md:text-[19px]">
        Il rejoint vos équipes, utilise vos outils et recrute à votre rythme.
      </p>
      <ol className="mt-14 grid w-full gap-5 text-left md:grid-cols-3">
        {STEPS.map((s, i) => {
          const Visual = VISUALS[i];
          const p = palettes[STEP_TINTS[i]];
          return (
            <li key={s.num} className="ks-lift ks-reveal flex flex-col rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card">
              <div className="flex h-[170px] items-center rounded-[20px] px-5" style={{ background: p.tint }} aria-hidden="true">
                <Visual />
              </div>
              <div className="flex flex-col gap-2.5 px-5 pb-5 pt-6">
                <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">{s.num}</span>
                <h3 className="font-ks-display text-[24px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="text-base leading-[1.55] text-ks-soft">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
