import { useEffect, useState } from "react";
import { CALENDLY_URL } from "@/content/site";

const KEY = "kistone-promo-banner-closed";

/** Bandeau rose au-dessus de l'en-tête : prise de rendez-vous avec Alex (Calendly). Refermable. */
export default function PromoBanner() {
  // Affiché par défaut (pré-rendu compris) ; masqué si le visiteur l'a déjà fermé
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem(KEY)) setClosed(true); } catch { /* stockage indisponible */ }
  }, []);
  if (closed) return null;

  const close = () => {
    setClosed(true);
    try { localStorage.setItem(KEY, "1"); } catch { /* stockage indisponible */ }
  };

  return (
    <div className="relative bg-ks-pink px-12 py-2.5 text-center text-[14px] text-white sm:text-[15px]">
      <span>Échangez gratuitement avec des Fractional Leaders <strong className="font-semibold">dès cette semaine</strong> !</span>{" "}
      <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:no-underline sm:ml-3">
        Réserver un appel
        <span aria-hidden="true">→</span>
      </a>
      <button type="button" onClick={close} aria-label="Fermer le bandeau" className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/15">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}
