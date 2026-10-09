import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Props = {
  /** « light » sur fond clair (logo noir), « dark » sur fond sombre (logo blanc). */
  tone?: "light" | "dark";
  className?: string;
};

/** Logo officiel Kistone (éclair + mot), jamais recoloré ni ombré. */
export default function Logo({ tone = "light", className }: Props) {
  return (
    <Link to="/" aria-label="Kistone, accueil" className="flex shrink-0 items-center">
      <img
        src={tone === "dark" ? "/logos/logo-full-white.png" : "/logos/logo-full-black.png"}
        alt="Kistone"
        width={1822}
        height={402}
        // PNG recadré au plus près : aucune marge à compenser
        className={cn("h-[40px] w-auto", className)}
      />
    </Link>
  );
}
