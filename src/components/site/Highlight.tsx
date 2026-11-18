import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mot-clé d'un titre en dégradé (style du studio : rose, violet, bleu), sur les noms de métier. */
export default function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("ks-grad-text [box-decoration-break:clone]", className)}>
      {children}
    </span>
  );
}
