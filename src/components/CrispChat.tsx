import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";

/** Identifiant public du site Crisp de Kistone. */
const CRISP_WEBSITE_ID = "74a03cc2-a63e-4a88-9369-1c0410179d32";

/** Espaces connectés : ils ont déjà leur propre messagerie, la bulle Crisp y est masquée. */
const APP_AREAS = /^\/(dashboard|profile|open-needs|client\/(dashboard|onboarding|new-need|edit-need|profile))/;

type CrispWindow = Window & { $crisp?: unknown[][]; CRISP_WEBSITE_ID?: string };

/**
 * Chat Crisp sur le site : chargé seulement après l'accord du visiteur aux cookies, masqué dans
 * les espaces connectés.
 */
export default function CrispChat() {
  const { pathname } = useLocation();
  const [allowed, setAllowed] = useState(() => getConsent() === "accepted");

  useEffect(() => {
    const onConsent = (e: Event) => setAllowed((e as CustomEvent).detail === "accepted");
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  // Chargement unique du script Crisp
  useEffect(() => {
    if (!allowed) return;
    const w = window as CrispWindow;
    if (w.$crisp) return;
    w.$crisp = [];
    w.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
    const s = document.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    document.head.appendChild(s);
  }, [allowed]);

  // Retrait du consentement : conversation effacée, bulle masquée (le script ne se recharge plus)
  useEffect(() => {
    const w = window as CrispWindow;
    if (allowed || !w.$crisp) return;
    w.$crisp.push(["do", "session:reset"]);
    w.$crisp.push(["do", "chat:hide"]);
  }, [allowed]);

  // Bulle visible sur le site public, masquée dans les espaces connectés
  useEffect(() => {
    const w = window as CrispWindow;
    if (!allowed || !w.$crisp) return;
    w.$crisp.push(["do", APP_AREAS.test(pathname) ? "chat:hide" : "chat:show"]);
  }, [allowed, pathname]);

  return null;
}
