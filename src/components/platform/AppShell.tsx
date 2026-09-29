import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/platform/NotificationBell";
import { DEFAULT_TAB, PLATFORM_NAV, SPACE_LABEL, type NavItem, type PlatformRole } from "@/content/platformNav";

/** Largeur du menu latéral : les pages décalent leur contenu d'autant (lg:pl-[248px]). */
export const SIDEBAR_OFFSET = "lg:pl-[248px]";

function hrefOf(item: NavItem) {
  return item.tab ? `${item.path}?tab=${item.tab}` : item.path;
}

function isActive(item: NavItem, pathname: string, search: string) {
  if (item.alsoActive?.some((p) => pathname.startsWith(p))) return true;
  if (pathname !== item.path) return false;
  const current = new URLSearchParams(search).get("tab") ?? DEFAULT_TAB[item.path] ?? null;
  const wanted = item.tab ?? DEFAULT_TAB[item.path] ?? null;
  return current === wanted;
}

function NavLinks({ role, onNavigate }: { role: PlatformRole; onNavigate?: () => void }) {
  const { pathname, search } = useLocation();
  return (
    <nav aria-label={SPACE_LABEL[role]} className="flex flex-col gap-0.5">
      {PLATFORM_NAV[role].map((item) => {
        const active = isActive(item, pathname, search);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={hrefOf(item)}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
              active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {active ? <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ role, email, onNavigate, onSignOut, bell = false }: {
  role: PlatformRole;
  email: string | null;
  onNavigate?: () => void;
  onSignOut: () => void;
  bell?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <Link to="/" aria-label="Kistone, retour au site" className="px-2 pt-1">
          <img src="/logos/logo-full-black.png" alt="Kistone" width={1200} height={377} className="-ml-1.5 h-12 w-auto" />
        </Link>
        {bell ? <NotificationBell className="h-10 w-10" /> : null}
      </div>
      <p className="mt-5 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{SPACE_LABEL[role]}</p>
      <div className="mt-2">
        <NavLinks role={role} onNavigate={onNavigate} />
      </div>
      <div className="mt-auto border-t border-border px-3 pt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Connecté</p>
        <p className="mt-1 truncate text-sm text-foreground" title={email ?? undefined}>{email ?? "…"}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-0 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Me déconnecter
        </button>
      </div>
    </div>
  );
}

/**
 * Menu latéral des espaces de la plateforme (admin, client, freelance). Fixé à
 * gauche sur ordinateur ; barre du haut + menu burger sur mobile. La page décale
 * son contenu avec SIDEBAR_OFFSET.
 */
export default function AppShell({ role }: { role: PlatformRole }) {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  const signOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-border bg-card px-3 py-5 lg:block">
        <SidebarBody role={role} email={email} onSignOut={signOut} bell />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link to="/" aria-label="Kistone, retour au site">
          <img src="/logos/logo-full-black.png" alt="Kistone" width={1200} height={377} className="-ml-1.5 h-11 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
        <NotificationBell />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Ouvrir le menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-input bg-card"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-card px-3 py-5">
            <SheetTitle className="sr-only">{SPACE_LABEL[role]}</SheetTitle>
            <SidebarBody role={role} email={email} onNavigate={() => setOpen(false)} onSignOut={signOut} />
          </SheetContent>
        </Sheet>
        </div>
      </header>
    </>
  );
}
