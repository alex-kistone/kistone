import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pill de section : puce rose + label mono en majuscules. */
export default function SectionTag({ children, dark, studio, className }: { children: ReactNode; dark?: boolean; studio?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex h-[30px] items-center gap-2 rounded-full border px-3.5 font-ks-mono text-[11px] uppercase tracking-[0.14em]",
        dark ? "border-[rgba(245,241,234,0.2)] text-ks-dark-fg" : "border-[rgba(20,19,18,0.1)] text-ks-ink-2",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", studio ? "ks-grad-dot" : "bg-ks-pink")} aria-hidden="true" />
      {children}
    </div>
  );
}
