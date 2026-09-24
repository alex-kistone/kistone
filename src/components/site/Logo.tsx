import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Props = {
  /** « light » sur fond clair (logo noir), « dark » sur fond sombre (logo blanc). */
  tone?: "light" | "dark";
  className?: string;
};

/** Logo officiel Kistone Studio (éclair + mot), jamais recoloré ni ombré. */
export default function Logo({ tone = "light", className }: Props) {
  return (
    <Link to="/" aria-label="Kistone, accueil" className="flex shrink-0 items-center">
      <img
        src={tone === "dark" ? "/logos/logo-full-white.png" : "/logos/logo-full-black.png"}
        alt="Kistone Studio"
        width={1200}
        height={377}
        // Le PNG a une marge transparente : on la compense pour aligner le logo sur la grille
        className={cn("-ml-[8px] h-[66px] w-auto", className)}
      />
    </Link>
  );
}
