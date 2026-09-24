import SectionTag from "@/components/site/SectionTag";
import { STEPS } from "@/content/home";

export default function HowItWorks() {
  return (
    <section id="comment" className="mx-auto mt-24 flex max-w-ks scroll-mt-24 flex-col items-center px-5 text-center md:mt-[140px] md:px-8 xl:px-0">
      <SectionTag className="ks-reveal">Marketplace RPO</SectionTag>
      <h2 className="ks-reveal mt-5 font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[72px]">
        Un recruteur senior.
        <br />
        Sans le CDI.
      </h2>
      <p className="ks-reveal mt-[18px] text-[17px] leading-[1.5] text-ks-soft md:text-[19px]">
        Il rejoint vos équipes, utilise vos outils et recrute à votre rythme.
      </p>
      <ol className="mt-14 grid w-full gap-5 text-left md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.num} className="ks-lift ks-reveal flex flex-col gap-3 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-8 shadow-ks-card">
            <span className="font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-pink">{s.num}</span>
            <h3 className="font-ks-display text-[26px] font-semibold tracking-[-0.02em]">{s.title}</h3>
            <p className="text-base leading-[1.55] text-ks-soft">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
