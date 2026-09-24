import { METHOD } from "@/content/studio";
import { STUDIO_GRADIENT } from "@/content/site";
import SectionHeader, { Section } from "./SectionHeader";

const Bubble = ({ from, children }: { from: "them" | "us"; children: string }) => (
  <div
    className={
      from === "them"
        ? "self-start rounded-[14px_14px_14px_4px] bg-white px-3 py-2"
        : "self-end rounded-[14px_14px_4px_14px] bg-ks-dark px-3 py-2 text-ks-dark-fg"
    }
  >
    {children}
  </div>
);

function Gauge({ label, value, color, full }: { label: string; value: number; color: string; full?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-[14px] bg-white p-3.5 text-[13px]">
      <div className="flex justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-ks-subtle">{value} %</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: full ? color : "#EDE7DC" }}>
        {full ? null : <div className="h-1.5 rounded-full" style={{ width: `${value}%`, background: color }} />}
      </div>
    </div>
  );
}

/** Mini-visuel de chaque étape (desktop et tablette). */
function StepVisual({ index }: { index: number }) {
  const box = "flex h-40 flex-col justify-center gap-2.5 rounded-[20px] bg-ks-muted p-5";
  switch (index) {
    case 0:
      return (
        <div className={`${box} text-[13px]`}>
          <Bubble from="them">On perd 3 h par recrue.</Bubble>
          <Bubble from="us">On automatise l’accueil ?</Bubble>
        </div>
      );
    case 1:
      return (
        <div className={box}>
          <Gauge label="Prototype v1" value={45} color={STUDIO_GRADIENT} />
        </div>
      );
    case 2:
      return (
        <div className={box}>
          <Gauge label="Intégration SIRH" value={80} color="#141312" />
          <div className="flex gap-1.5 text-xs">
            {["Workday", "Lucca", "Slack"].map((t) => (
              <span key={t} className="rounded-full bg-white px-2.5 py-1">{t}</span>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className={box}>
          <Gauge label="En production" value={100} color={STUDIO_GRADIENT} full />
          <div className="flex items-center gap-1.5 self-start rounded-full bg-white px-2.5 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-ks-success" aria-hidden="true" />
            1 240 salariés actifs
          </div>
        </div>
      );
  }
}

export default function MethodSteps() {
  return (
    <Section id="methode">
      <SectionHeader tag={METHOD.tag} title={METHOD.title} subtitle={METHOD.subtitle} />
      <ol className="mt-8 grid gap-3.5 md:mt-14 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
        {METHOD.steps.map((s, i) => (
          <li
            key={s.num}
            className="ks-lift ks-reveal flex items-center gap-3.5 rounded-3xl border border-[rgba(20,19,18,0.06)] bg-white p-2.5 shadow-ks-card md:block md:rounded-[28px] md:p-3"
          >
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-ks-muted font-ks-display text-[34px] font-bold tracking-[-0.04em] md:hidden"
              aria-hidden="true"
            >
              <span className="ks-grad-text">{s.num}</span>
            </div>
            <div className="hidden md:block" aria-hidden="true">
              <StepVisual index={i} />
            </div>
            <div className="pr-2 md:px-3 md:pb-3 md:pt-5">
              <div className="hidden font-ks-mono text-[11px] uppercase tracking-[0.14em] md:block"><span className="ks-grad-text">Étape {s.num}</span></div>
              <h3 className="font-ks-display text-[21px] font-semibold tracking-[-0.02em] md:mt-2 md:text-2xl">
                <span className="sr-only md:hidden">Étape {s.num} : </span>
                {s.title}
              </h3>
              <p className="mt-1 text-sm leading-normal text-ks-soft md:mt-2 md:text-[15px] md:leading-[1.55]">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
