import { cn } from "@/lib/utils";

/**
 * Symbole Kistone (éclair au trait) en vectoriel : net à toutes les tailles, couleur au choix
 * (currentColor). Tracé d'après le logo : flèche haute, losange central, flèche basse.
 */
export function BoltMark({ className, strokeWidth = 24 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 624 1024" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="miter" className={className} aria-hidden="true" focusable="false">
      <path d="M38 560 L488 18 L318 398" />
      <path d="M22 588 L346 416 L602 416 L280 588 Z" />
      <path d="M300 606 L132 1006 L590 444" />
    </svg>
  );
}

/**
 * Éclair en filigrane, posé en absolu dans un parent `relative` (à mettre `isolate` pour qu'il
 * passe derrière le contenu). Taille, position et rotation via className.
 */
export function BoltWatermark({ className, tone = "dark", strokeWidth }: { className?: string; tone?: "dark" | "light"; strokeWidth?: number }) {
  return (
    <BoltMark
      strokeWidth={strokeWidth}
      className={cn(
        "pointer-events-none absolute -z-10 h-auto select-none",
        tone === "dark" ? "text-ks-ink opacity-[0.06]" : "text-white opacity-[0.07]",
        className,
      )}
    />
  );
}
