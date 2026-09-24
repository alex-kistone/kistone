import SectionTag from "@/components/site/SectionTag";
import { RESOURCES } from "@/content/home";
import { palettes } from "@/lib/palettes";

export default function ResourcesTeaser() {
  return (
    <section id="ressources" className="mx-auto mt-24 flex max-w-ks scroll-mt-24 flex-col px-5 md:mt-[140px] md:px-8 xl:px-0">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionTag className="ks-reveal">Ressources</SectionTag>
          <h2 className="ks-reveal mt-5 font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[56px]">
            Recruter et outiller, sans jargon.
          </h2>
        </div>
        <span className="self-start rounded-full border border-ks-line-strong bg-white px-[22px] py-3 text-[15px] font-semibold text-ks-subtle md:self-auto">
          Bientôt en ligne
        </span>
      </div>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {RESOURCES.map((r) => {
          const p = palettes[r.palette];
          return (
            <li key={r.kind} className="ks-lift ks-reveal rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card">
              <div className="flex h-[180px] items-end rounded-[20px] p-[18px]" style={{ background: p.tint }}>
                <span className="flex h-7 items-center gap-[7px] rounded-full bg-white/75 px-3 text-xs font-medium" style={{ color: p.ink }}>
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.accent }} aria-hidden="true" />
                  {r.kind}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 px-3 pb-3 pt-[18px]">
                <h3 className="font-ks-display text-[21px] font-semibold leading-[1.2] tracking-[-0.02em]">{r.title}</h3>
                <span className="text-sm text-ks-subtle">{r.meta}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
