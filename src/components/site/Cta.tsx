import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import SmartLink from "./SmartLink";

type Variant = "primary" | "secondary" | "dark" | "ghost-dark" | "studio" | "studio-fill";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "ks-btn bg-ks-pink font-semibold text-white shadow-ks-pink-sm",
  secondary: "ks-ghost border border-ks-line-strong bg-white font-medium text-ks-ink",
  dark: "ks-btn bg-ks-dark font-semibold text-ks-dark-fg",
  "ghost-dark": "ks-ghost-dark border border-[rgba(245,241,234,0.22)] font-medium text-ks-dark-fg",
  // Studio : noir à contour dégradé (fonds clairs) ou aplat dégradé (fonds sombres)
  studio: "ks-btn ks-grad-border font-semibold",
  "studio-fill": "ks-btn ks-grad-bg font-semibold text-white shadow-[0_14px_30px_-14px_rgba(120,90,220,0.6)]",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

/**
 * Couleur du balayage « pixel » au survol, par variante (inspiré du site d'Aria) : un grand
 * bloc précédé de deux carrés décalés traverse le bouton de gauche à droite. Le texte reste
 * au-dessus. Pas de balayage sur les variantes studio (dégradé).
 */
const WIPE: Partial<Record<Variant, string>> = {
  primary: "bg-ks-dark",
  secondary: "bg-ks-secondary",
  dark: "bg-ks-pink",
  "ghost-dark": "bg-[rgba(245,241,234,0.14)]",
};

function Wipe({ color }: { color: string }) {
  return (
    <span aria-hidden="true" className="ks-wipe pointer-events-none absolute inset-0">
      <span className={cn("absolute inset-y-0 left-0 w-full", color)} />
      <span className={cn("absolute left-full top-0 h-1/2 w-[18px]", color)} />
      <span className={cn("absolute bottom-0 left-[calc(100%+18px)] h-1/2 w-[18px]", color)} />
      <span className={cn("absolute left-[calc(100%+36px)] top-0 h-1/2 w-[14px]", color)} />
    </span>
  );
}

/** Flèche qui sort par la droite pendant qu'une seconde entre par la gauche. */
function SlidingArrow() {
  return (
    <span className="relative inline-flex h-4 w-4 overflow-hidden">
      <span className="ks-arrow-out absolute inset-0 flex items-center justify-center"><ArrowIcon /></span>
      <span className="ks-arrow-in absolute inset-0 flex items-center justify-center"><ArrowIcon /></span>
    </span>
  );
}

export function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
  /** Couleur du balayage au survol, si celle de la variante ne se voit pas sur le fond (ex. bloc noir). */
  wipeClassName?: string;
};

/** Bouton-lien du site (pill). Rose = CTA principal, blanc = secondaire. */
export default function Cta({ href, children, variant = "primary", size = "md", arrow, className, onClick, wipeClassName }: Props) {
  const wipe = wipeClassName ?? WIPE[variant];
  return (
    <SmartLink
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full",
        wipe && "ks-wipe-host relative isolate overflow-hidden",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {wipe && <Wipe color={wipe} />}
      <span className="relative inline-flex items-center gap-2.5">
        {children}
        {arrow ? wipe ? <SlidingArrow /> : <ArrowIcon /> : null}
      </span>
    </SmartLink>
  );
}
