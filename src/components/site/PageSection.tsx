import type { ReactNode } from "react";
import SectionTag from "@/components/site/SectionTag";
import { BoltWatermark } from "@/components/brand/Bolt";
import { cn } from "@/lib/utils";

/** Section des pages éditoriales (métiers, modèles) : étiquette, titre H2, éclair en filigrane optionnel. */
export default function PageSection({ id, tag, title, children, className, bolt }: {
  id?: string; tag: string; title: string; children: ReactNode; className?: string; bolt?: string;
}) {
  return (
    <section id={id} className={cn("relative isolate mx-auto mt-24 max-w-ks scroll-mt-24 px-5 md:mt-32 md:px-8 xl:px-0", className)}>
      {bolt && <BoltWatermark className={bolt} />}
      <SectionTag>{tag}</SectionTag>
      <h2 className="mt-5 max-w-[820px] font-ks-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[48px]">{title}</h2>
      {children}
    </section>
  );
}
