import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "connect2_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const refuse = () => {
    localStorage.setItem(COOKIE_KEY, "refused");
    setVisible(false);
  };

  if (!visible) return null;

  // Aux couleurs du site Kistone (tokens ks-*). Refuser et Accepter ont le même poids visuel.
  return (
    <div
      role="region"
      aria-label="Cookies"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-[720px] rounded-[20px] border border-ks-line bg-white p-4 font-ks-sans text-ks-ink shadow-ks-pop animate-in slide-in-from-bottom-4 duration-300 sm:inset-x-6 sm:bottom-6 sm:p-5"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center text-sm leading-[1.5] text-ks-soft sm:text-left">
          Nous utilisons des cookies essentiels pour le fonctionnement du site.{" "}
          <Link to="/privacy" className="font-medium text-ks-ink underline underline-offset-2 hover:text-black">
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={refuse}
            className="h-10 rounded-full border border-ks-line-strong bg-white px-5 text-sm font-medium text-ks-ink transition-colors hover:bg-[#FBF8F3]"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={accept}
            className="h-10 rounded-full bg-ks-dark px-5 text-sm font-semibold text-ks-dark-fg transition-[filter] hover:brightness-110"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
