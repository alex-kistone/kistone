import type { ReactNode } from "react";

type Props = { title: ReactNode; subtitle?: string };

/** En-tête de section centré : H2, sous-titre d'une ligne. */
export default function SectionHeader({ title, subtitle }: Props) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="ks-reveal font-ks-display text-[40px] font-bold leading-[1.02] tracking-[-0.045em] md:text-[56px] md:leading-none lg:text-[72px]">
        {title}
      </h2>
      {subtitle ? (
        <p className="ks-reveal mt-3 text-base leading-normal text-ks-soft md:mt-[18px] md:text-[19px]">{subtitle}</p>
      ) : null}
    </div>
  );
}

/** Deux temps d'un titre : retour à la ligne en desktop, à la suite en mobile. */
export function TwoPartTitle({ a, b }: { a: string; b: string }) {
  return (
    <>
      {a} <br className="hidden md:block" />
      {b}
    </>
  );
}

/** Conteneur de section : 1200px max, 20px de gouttière en mobile, 140px entre sections (96px mobile). */
export function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`mt-24 scroll-mt-24 px-5 md:mt-[140px] md:px-8 ${className}`}>
      <div className="mx-auto w-full max-w-ks">{children}</div>
    </section>
  );
}
