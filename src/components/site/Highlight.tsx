import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Surlignage rose du hero (« Freelance »), réutilisé sur les noms de fonction. */
export default function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("bg-[linear-gradient(transparent_62%,#F4AFC2_62%,#F4AFC2_94%,transparent_94%)] bg-no-repeat px-[0.04em] [box-decoration-break:clone]", className)}>
      {children}
    </span>
  );
}
