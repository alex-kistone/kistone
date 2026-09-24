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
};

/** Bouton-lien du site (pill). Rose = CTA principal, blanc = secondaire. */
export default function Cta({ href, children, variant = "primary", size = "md", arrow, className, onClick }: Props) {
  return (
    <SmartLink
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
      {arrow ? <ArrowIcon /> : null}
    </SmartLink>
  );
}
