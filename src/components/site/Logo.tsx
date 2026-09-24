import { Link } from "react-router-dom";

/** Monogramme « K » + mot « Kistone ». */
export default function Logo() {
  return (
    <Link to="/" aria-label="Kistone, accueil" className="flex items-center gap-2.5">
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-ks-ink font-ks-display text-base font-bold text-ks-dark-fg">
        K
      </span>
      <span className="font-ks-display text-xl font-semibold tracking-[-0.02em]">Kistone</span>
    </Link>
  );
}
