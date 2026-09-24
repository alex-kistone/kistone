import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MENUS, ROUTES } from "@/content/site";
import Cta from "./Cta";
import Logo from "./Logo";
import SmartLink from "./SmartLink";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={cn("transition-transform duration-200", open && "rotate-180")}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DesktopMenus() {
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(null), [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav ref={navRef} aria-label="Navigation principale" className="hidden gap-1 xl:flex">
      {MENUS.map((m) => {
        const isOpen = open === m.id;
        return (
          <div key={m.id} className="relative">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`menu-${m.id}`}
              onClick={() => setOpen(isOpen ? null : m.id)}
              className={cn(
                "flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[15px] text-ks-ink-2 transition-colors hover:bg-[rgba(20,19,18,0.05)]",
                isOpen && "bg-[rgba(20,19,18,0.05)]",
              )}
            >
              {m.label}
              <Chevron open={isOpen} />
            </button>
            {isOpen ? (
              <div
                id={`menu-${m.id}`}
                className="ks-drop absolute left-0 top-[52px] flex w-80 flex-col rounded-[20px] border border-[rgba(20,19,18,0.06)] bg-white p-2 shadow-ks-pop"
              >
                {m.items.map((it) => (
                  <SmartLink
                    key={it.title}
                    href={it.href}
                    onClick={() => setOpen(null)}
                    className="flex items-start gap-3 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-ks-bg"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-[3px]" style={{ background: it.dot }} aria-hidden="true" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-ks-ink">{it.title}</span>
                      <span className="text-[13px] leading-[1.4] text-ks-subtle">{it.desc}</span>
                    </span>
                  </SmartLink>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ks-line-strong bg-white xl:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="ks-site flex w-full flex-col gap-0 overflow-y-auto border-l-0 bg-ks-bg p-5 sm:max-w-sm">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="pr-10">
          <Logo />
        </div>
        <nav aria-label="Navigation mobile" className="mt-8 flex flex-col gap-7">
          {MENUS.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <span className="px-3 font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle">{m.label}</span>
              {m.items.map((it) => (
                <SmartLink
                  key={it.title}
                  href={it.href}
                  onClick={close}
                  className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-base font-medium hover:bg-white"
                >
                  <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: it.dot }} aria-hidden="true" />
                  {it.title}
                </SmartLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2.5 pt-8">
          <Cta href={ROUTES.recruit} onClick={close} size="lg">Je recrute</Cta>
          <Cta href={ROUTES.freelance} onClick={close} variant="secondary" size="lg">Je suis freelance</Cta>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ks-line bg-[rgba(245,241,234,0.82)] backdrop-blur-[16px]">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-8 lg:px-12">
        <div className="flex items-center gap-10">
          <Logo />
          <DesktopMenus />
        </div>
        <div className="flex items-center gap-2.5">
          <Cta href={ROUTES.freelance} variant="secondary" className="hidden sm:inline-flex">Je suis freelance</Cta>
          <Cta href={ROUTES.recruit} className="hidden sm:inline-flex">Je recrute</Cta>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
