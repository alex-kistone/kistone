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
    <nav aria-label="Type de compte" className="mb-8 grid w-full max-w-[280px] grid-cols-2 rounded-full bg-ks-secondary p-1">
      {SPACES.map((s) => {
        const on = s.id === current;
        return (
          <Link
            key={s.id}
            to={signup ? `${s.path}?mode=signup` : s.path}
            replace
            aria-current={on ? "page" : undefined}
            className={cn(
              "rounded-full py-2 text-center text-sm font-semibold transition-colors",
              on ? "bg-white text-ks-ink shadow-[0_1px_3px_rgba(20,19,18,0.12)]" : "text-ks-soft hover:text-ks-ink",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
