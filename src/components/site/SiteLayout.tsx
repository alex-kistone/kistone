import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import "@/site/site.css";
import Footer from "./Footer";
import Navbar from "./Navbar";

/** Défile vers l'ancre (« /#marketplace », « /studio#tarifs ») ou en haut de page. */
function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    const samePage = lastPath.current === pathname;
    lastPath.current = pathname;
    if (!hash) {
      if (!samePage) window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    // Après un changement de page, on attend que la nouvelle page soit peinte puis on saute sans animation.
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: samePage ? "smooth" : "auto", block: "start" });
    }, samePage ? 0 : 50);
    return () => window.clearTimeout(timer);
  }, [pathname, hash, key]);
  return null;
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ks-site flex min-h-screen flex-col">
      <ScrollToHash />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
