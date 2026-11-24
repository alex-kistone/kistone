import { useEffect, useState } from "react";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";

/** Conteneur Google Tag Manager de kistone.fr (Google Analytics y est configuré). */
const GTM_ID = "GTM-W6HMFFR2";

/** Mesure sur le site en production seulement : ni le développement local, ni les aperçus Vercel. */
const isProduction = () => /^(www\.)?kistone\.fr$/.test(window.location.hostname);

type GtmWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/**
 * Google Tag Manager / Google Analytics : chargé seulement après « Accepter » dans le bandeau
 * cookies (exigence CNIL pour la mesure d'audience Google), comme le chat Crisp.
 * Consent Mode v2 : mesure d'audience accordée, publicité toujours refusée ; un retrait du
 * consentement coupe la mesure sans recharger la page.
 * Pages vues d'une application React : dans GTM, déclencher la balise GA4 sur « Historique
 * modifié » (History Change) en plus du chargement de page.
 */
export default function GoogleTagManager() {
  const [allowed, setAllowed] = useState(() => getConsent() === "accepted");

  useEffect(() => {
    const onConsent = (e: Event) => setAllowed((e as CustomEvent).detail === "accepted");
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    const w = window as GtmWindow;
    if (!isProduction()) return;
    if (!allowed) {
      // Retrait du consentement : plus aucune mesure si le conteneur était déjà chargé
      w.gtag?.("consent", "update", { analytics_storage: "denied" });
      return;
    }
    if (w.gtag) {
      w.gtag("consent", "update", { analytics_storage: "granted" });
      return;
    }
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- format attendu par Google (objet arguments)
      w.dataLayer!.push(arguments);
    };
    w.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    w.gtag("js", new Date());
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(s);
  }, [allowed]);

  return null;
}
