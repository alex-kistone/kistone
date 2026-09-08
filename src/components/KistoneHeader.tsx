import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import kistoneLogo from "@/assets/kistone-logo-noir-full.png";

const linkBase: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#6B6B5E",
  textDecoration: "none",
};

const ctaBtn: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  background: "#E59500",
  color: "#0A0A0A",
  padding: "10px 18px",
  border: "2px solid #0A0A0A",
  borderRadius: 10,
  boxShadow: "4px 4px 0 0 #0A0A0A",
  textDecoration: "none",
  display: "inline-block",
  transition: "transform 0.15s, box-shadow 0.15s",
};


type KistoneHeaderProps = {
  onStartProject?: () => void;
};

const KistoneHeader = ({ onStartProject }: KistoneHeaderProps = {}) => {
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [dashboardPath, setDashboardPath] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const id = "kistone-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setDashboardPath(null); return; }
    const userId = session.user.id;
    (async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (isAdmin) { setDashboardPath("/dashboard"); return; }
      const { data: profile } = await supabase
        .from("recruiter_profiles").select("id").eq("user_id", userId).maybeSingle();
      setDashboardPath(profile ? "/profile" : "/client/dashboard");
    })();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: scrolled ? "color-mix(in oklab, #F2EFE9 88%, transparent)" : "#F2EFE9",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #1414141A" : "1px solid transparent",
        transition: "all 200ms ease",
        fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .kh-inner { padding: 10px 16px !important; }
          .kh-logo-img { height: 42px !important; }
          .kh-cta { font-size: 11px !important; padding: 9px 12px !important; white-space: nowrap; box-shadow: 3px 3px 0 0 #0A0A0A !important; }
        }
      `}</style>
      <div
        style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px" }}
        className="flex items-center justify-between gap-3 kh-inner"
      >
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          <img src={kistoneLogo} alt="Kistone logo" className="kh-logo-img" style={{ height: 62, width: "auto", display: "block" }} />
        </Link>

        <nav className="hidden md:flex items-center gap-12">
          <style>{`
            .kh-navlink { position: relative; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #14140F; }
            .kh-navlink .kh-underline { position: absolute; left: 0; bottom: -4px; height: 2px; width: 0; transition: width 300ms ease; }
            .kh-navlink:hover .kh-underline { width: 100%; }
            .kh-navlink-studio .kh-underline { background: #D9A01B; }
            .kh-cta { position: relative; }
            .kh-cta:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 0 #0A0A0A !important; }
            .kh-burger { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px; width: 44px; height: 44px; background: #F2EFE9; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0 0 #0A0A0A; cursor: pointer; padding: 0; }
            .kh-burger-line { display: block; width: 20px; height: 2px; background: #0A0A0A; border-radius: 2px; transition: transform 0.2s ease, opacity 0.2s ease; }
            .kh-burger[aria-expanded="true"] .kh-burger-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
            .kh-burger[aria-expanded="true"] .kh-burger-line:nth-child(2) { opacity: 0; }
            .kh-burger[aria-expanded="true"] .kh-burger-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
            @media (max-width: 768px) {
              .kh-burger { display: flex; }
            }
          `}</style>

          <Link to="/open-needs" className="kh-navlink kh-navlink-studio">
            <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Besoins ouverts
            </span>
            <span aria-hidden className="kh-underline" />
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-5">
            {session && dashboardPath ? (
              <>
                <Link to={dashboardPath} style={linkBase} className="hidden sm:inline-block">
                  Mon espace
                </Link>
                <button onClick={handleLogout} style={{ ...linkBase, background: "none", border: 0, cursor: "pointer" }}>
                  Se déconnecter
                </button>
              </>
            ) : onStartProject ? (
              <button type="button" onClick={onStartProject} style={{ ...ctaBtn, cursor: "pointer" }} className="kh-cta">
                Rejoindre le réseau
              </button>
            ) : (
              <a href="/register" style={ctaBtn} className="kh-cta">
                Rejoindre le réseau
              </a>
            )}
          </div>

          <button
            type="button"
            className="kh-burger md:hidden"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <span className="kh-burger-line" />
            <span className="kh-burger-line" />
            <span className="kh-burger-line" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#F2EFE9",
            borderBottom: "2px solid #0A0A0A",
            boxShadow: "0 12px 0 0 rgba(10,10,10,0.08)",
            padding: "16px 24px 24px",
            zIndex: 55,
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                background: "#FFFFFF",
                border: "2px solid #0A0A0A",
                borderRadius: 14,
                boxShadow: "6px 6px 0 0 #0A0A0A",
                padding: "8px",
              }}
            >
              <Link
                to="/open-needs"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 14px",
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#14140F",
                  textDecoration: "none",
                  borderRadius: 10,
                }}
              >
                Besoins ouverts
              </Link>
            </div>

            <div style={{ marginTop: 16 }}>
              {session && dashboardPath ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      ...ctaBtn,
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    Mon espace
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      ...linkBase,
                      background: "none",
                      border: 0,
                      cursor: "pointer",
                      textAlign: "center",
                      padding: "10px",
                    }}
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : onStartProject ? (
                <button
                  type="button"
                  onClick={() => {
                    onStartProject();
                    setMobileMenuOpen(false);
                  }}
                  style={{ ...ctaBtn, cursor: "pointer", width: "100%", textAlign: "center" }}
                >
                  Rejoindre le réseau
                </button>
              ) : (
                <a
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ ...ctaBtn, width: "100%", textAlign: "center" }}
                >
                  Rejoindre le réseau
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default KistoneHeader;
