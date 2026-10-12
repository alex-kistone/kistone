import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const SPACES = [
  { id: "client", label: "Client", path: "/client" },
  { id: "freelance", label: "Freelance", path: "/register" },
] as const;

/**
 * Curseur Client / Freelance en tête des écrans de connexion : passe d'un espace à l'autre
 * en gardant le mode (connexion ou inscription).
 */
export default function AccountSwitch({ current, signup }: { current: "client" | "freelance"; signup: boolean }) {
  return (
    <nav aria-label="Type de compte" className="mb-7 inline-flex gap-1 rounded-full border border-[rgba(20,19,18,0.06)] bg-ks-bg p-1">
      {SPACES.map((s) => {
        const on = s.id === current;
        return (
          <Link
            key={s.id}
            to={signup ? `${s.path}?mode=signup` : s.path}
            replace
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-[104px] items-center justify-center rounded-full px-5 text-sm font-medium transition-colors",
              on ? "bg-ks-dark text-ks-dark-fg" : "text-ks-ink-2 hover:bg-[rgba(20,19,18,0.05)]",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
