import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import camillePhoto from "@/assets/candidate-camille.jpg";
import thomasPhoto from "@/assets/candidate-thomas.jpg";
import sarahPhoto from "@/assets/candidate-sarah.jpg";
import ProfileShowcase from "@/components/connect2/ProfileShowcase";
import OpenNeedsSection from "@/components/landing/OpenNeedsSection";
import KistoneHeader from "@/components/KistoneHeader";
import kistoneLogoFull from "@/assets/kistone-logo-noir-full.png";
import SEO from "@/components/SEO";

const FUNCTIONS = [
  { code: "01", label: "Tech", desc: "Dev backend, frontend, fullstack, DevOps, SRE, mobile, architectes." },
  { code: "02", label: "Data", desc: "Data engineers, analysts, scientists, ML, analytics engineers." },
  { code: "03", label: "Product", desc: "PM, PMM, designers UX/UI, product ops, leads produit." },
  { code: "04", label: "GTM", desc: "Sales, BizDev, growth, marketing, customer success, ops revenue." },
  { code: "05", label: "Corporate", desc: "DRH, talent, people ops, legal, ops, supply, projets transverses." },
  { code: "06", label: "Finance", desc: "CFO, contrôle de gestion, FP&A, comptabilité, M&A, fundraising." },
];

const PROCESS = [
  { n: "01", t: "Brief", d: "On qualifie le poste, le niveau, le contexte et le budget." },
  { n: "02", t: "Recruteur dédié en 48h", d: "Un·e RPO senior, expert·e de votre spécialité, prend le lead." },
  { n: "03", t: "Sourcing & shortlist en 1 semaine", d: "Chasse ciblée, qualification, présentation des premiers profils." },
  { n: "04", t: "Pilotage jusqu'au closing", d: "Process, entretiens, offre : on déroule jusqu'à la signature." },
];


const SCOPED_CSS = `
.kistone-scope {
  --bg: #F2EFE9;
  --bg-2: #E8E4DB;
  --ink: #14140F;
  --ink-2: #2A2A22;
  --muted: #6B6B5E;
  --line: #1414141A;
  --accent: #E54D2A;
  --accent-ink: #FFFFFF;
  --card: #FFFFFFC9;
  background: var(--bg);
  color: var(--ink);
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.kistone-scope .serif { font-family: "TomatoGrotesk", "DM Sans", sans-serif; font-weight: 500; letter-spacing: -0.03em; }
.kistone-scope .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
.kistone-scope .muted { color: var(--muted); }
.kistone-scope a.muted:hover { color: var(--ink); }
.kistone-btn-primary:hover { transform: translate(-2px, -2px); box-shadow: 10px 10px 0 0 #E54D2A !important; }
.kistone-btn-ghost:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 0 #0A0A0A !important; }
.kistone-btn-dark:hover { transform: translate(-2px, -2px); box-shadow: 10px 10px 0 0 #fff !important; }
.kistone-btn-white:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 0 #0A0A0A !important; }
@keyframes kistoneWordIn { from { opacity: 0; transform: translateY(0.2em); } to { opacity: 1; transform: translateY(0); } }
`;

function RotatingWord() {
  const words = ["Tech", "Data", "Product", "GTM", "Corporate", "Finance"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % words.length), 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <em
      key={i}
      style={{
        color: "var(--accent)",
        display: "inline-block",
        animation: "kistoneWordIn 500ms ease both",
      }}
    >
      {words[i]}
    </em>
  );
}

const Index = () => {


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

  return (
    <div className="kistone-scope">
      <SEO
        title="Kistone Talent — Le réseau des recruteurs freelances"
        description="Rejoignez Kistone Talent : missions qualifiées, clients premium et outils IA pour les recruteurs freelances spécialisés Tech, Data, Product et RPO."
        path="/talent"
      />
      <style>{SCOPED_CSS}</style>

      {/* NAV */}
      <KistoneHeader />

      {/* HERO */}
      <section id="top" style={{ paddingTop: 96, paddingBottom: 120 }}>
        <div style={wrap()}>
          <div className="grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-7">
              <div className="mono" style={pill()}>
                <span style={dot()} /> PLATEFORME RPO · RECRUTEMENT FREELANCE
              </div>
              <h1 className="serif" style={h1()}>
                Vos recrutements <RotatingWord />
                <br />pilotés par des RPO<br />freelances seniors.
              </h1>
              <p style={lede()}>
                Tech, Data, Product, GTM, Corporate, Finance. Kistone vous connecte aux meilleurs
                recruteurs freelances spécialisés par métier, et vous accompagne du brief au closing.
                Et le studio Kistone outille vos process recrutement avec l'IA.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-10">
                <Link to="/client?mode=signup" className="kistone-btn-primary" style={btnPrimary()}>
                  Parcourir les profils
                </Link>
                <Link to="/register?mode=signup" className="kistone-btn-ghost" style={btnGhost()}>
                  Je suis freelance →
                </Link>
              </div>
            </div>
            <div className="md:col-span-5">
              <CandidateStack />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {[
              ["48h", "POUR ASSIGNER UN RECRUTEUR"],
              ["6", "spécialités métiers"],
              ["0", "frais cachés, 0 engagement"],
              ["+400", "RECRUTEURS RPO SÉLECTIONNÉS"],
            ].map(([n, l]) => (
              <div
                key={l}
                style={{
                  background: "#FFFFFF",
                  padding: "26px 22px",
                  borderRadius: 16,
                  border: "2px solid #0A0A0A",
                  boxShadow: "6px 6px 0 0 #0A0A0A",
                  boxSizing: "border-box",
                }}
              >
                <div className="serif" style={{ fontSize: 44, lineHeight: 1, letterSpacing: "-0.02em", color: "#0A0A0A" }}>{n}</div>
                <div
                  className="mono"
                  style={{ fontSize: 10, fontWeight: 700, marginTop: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E54D2A" }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TALENTS / FUNCTIONS */}
      <section id="talents" style={section()}>
        <div style={wrap()}>
          <SectionLabel n="I" title="6 spécialités, des RPO qui closent." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {FUNCTIONS.map((f) => (
              <article key={f.code} style={cardBig()}>
                <div className="mono muted" style={{ fontSize: 11, letterSpacing: "0.08em" }}>{f.code}</div>
                <h3 className="serif" style={{ fontSize: 40, lineHeight: 1.05, marginTop: 10, letterSpacing: "-0.02em" }}>
                  {f.label}
                </h3>
                <p className="muted" style={{ marginTop: 14, fontSize: 16, lineHeight: 1.55 }}>{f.desc}</p>
                <div
                  className="mono"
                  style={{ marginTop: 28, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  <span style={{ color: "var(--accent)" }}>—</span> RPO · senior · IA-augmenté
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section id="methode" style={section()}>
        <div style={wrap()}>
          <SectionLabel n="II" title="Du brief au closing, sans friction." />
          <div className="grid md:grid-cols-4 gap-6 mt-16">
            {PROCESS.map((s) => (
              <div
                key={s.n}
                style={{
                  background: "#FFFFFF",
                  border: "2px solid #0A0A0A",
                  borderRadius: 16,
                  padding: "28px 26px",
                  boxShadow: "6px 6px 0 0 #0A0A0A",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="serif"
                  style={{ fontSize: 56, lineHeight: 0.9, color: "#E54D2A", letterSpacing: "-0.02em" }}
                >
                  {s.n}
                </div>
                <div style={{ height: 2, background: "#0A0A0A", margin: "20px 0" }} />
                <h3 className="serif" style={{ fontSize: 22, lineHeight: 1.2, color: "#0A0A0A" }}>{s.t}</h3>
                <p className="muted" style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IA-FIRST */}
      <section id="ia" style={{ ...section(), paddingLeft: 16, paddingRight: 16 }}>
        <div
          style={{
            background: "#0A0A0A",
            color: "#F2EFE9",
            borderRadius: 24,
            padding: "80px 0",
            border: "2px solid #0A0A0A",
            boxShadow: "12px 12px 0 0 #E54D2A",
          }}
        >
        <div style={wrap()}>
          <div className="grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-5">
              <div className="mono" style={{ ...pill(), borderColor: "#E54D2A", color: "#E54D2A" }}>
                <span style={{ ...dot(), background: "#E54D2A" }} /> Le Studio
              </div>
              <h2
                className="serif"
                style={{
                  fontSize: "clamp(40px, 5vw, 72px)",
                  lineHeight: 1.02,
                  marginTop: 28,
                  letterSpacing: "-0.02em",
                }}
              >
                Nous sommes <em style={{ color: "#E54D2A" }}>AI-first</em>.
              </h2>
              <div className="mt-10">
                <Link
                  to="/studio"
                  className="kistone-btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    background: "#E54D2A",
                    color: "#0A0A0A",
                    border: "2px solid #0A0A0A",
                    borderRadius: 12,
                    padding: "14px 22px",
                    fontWeight: 700,
                    fontSize: 15,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    boxShadow: "6px 6px 0 0 #0A0A0A",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  Découvrir le Studio →
                </Link>
              </div>
            </div>
            <div className="md:col-span-7">
              <p style={{ fontSize: 19, lineHeight: 1.55, color: "#D6D3CB" }}>
                Notre studio outille vos recrutements : sourcing augmenté, scoring de candidats,
                automatisation de l'ATS, agents IA pour la pré-qualification. On augmente la
                productivité de vos RPO sans ajouter de têtes.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-10">
                {[
                  ["Sourcing augmenté", "Recherche multi-canal, scraping conforme et enrichissement automatique des profils."],
                  ["Scoring IA", "Matching candidat·e / poste, scoring d'appétence et priorisation des shortlists."],
                  ["Automatisation ATS", "Connecteurs, workflows et relances : votre pipeline tourne tout seul."],
                  ["Agents recruteurs", "Pré-qualification, prise de RDV et reporting délégués à des agents IA dédiés."],
                ].map(([t, d]) => (
                  <div
                    key={t}
                    style={{
                      background: "#FFFFFF",
                      border: "2px solid #0A0A0A",
                      borderRadius: 14,
                      padding: 22,
                      boxShadow: "5px 5px 0 0 #E54D2A",
                      boxSizing: "border-box",
                    }}
                  >
                    <div className="serif" style={{ fontSize: 22, color: "#0A0A0A" }}>{t}</div>
                    <p style={{ color: "rgba(10,10,10,0.65)", fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>{d}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
        </div>
      </section>


      {/* DERNIERS FREELANCES & MISSIONS */}
      <ProfileShowcase />
      <OpenNeedsSection />

      {/* CTA */}
      <section style={{ paddingTop: 80, paddingBottom: 120 }}>
        <div style={wrap()}>
          <div
            style={{
              background: "#E54D2A",
              color: "#0A0A0A",
              padding: "clamp(40px, 6vw, 88px)",
              borderRadius: 24,
              border: "2px solid #0A0A0A",
              boxShadow: "12px 12px 0 0 #0A0A0A",
              boxSizing: "border-box",
            }}
          >
            <div
              className="mono"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0A0A0A" }}
            >
              ● Prochaine étape
            </div>
            <h2
              className="serif"
              style={{
                fontSize: "clamp(40px, 6vw, 84px)",
                lineHeight: 1.0,
                marginTop: 18,
                letterSpacing: "-0.02em",
                color: "#0A0A0A",
              }}
            >
              Décrivez votre recrutement.<br />Un RPO senior vous est assigné en 48h.
            </h2>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                to="/client"
                className="kistone-btn-dark"
                style={{ transition: "transform 0.15s, box-shadow 0.15s",
                  background: "#0A0A0A",
                  color: "#fff",
                  padding: "14px 28px",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderRadius: 14,
                  border: "2px solid #0A0A0A",
                  boxShadow: "6px 6px 0 0 #fff",
                }}
              >
                Confier un recrutement →
              </Link>
              <Link
                to="/register"
                className="kistone-btn-white"
                style={{ transition: "transform 0.15s, box-shadow 0.15s",
                  background: "#fff",
                  border: "2px solid #0A0A0A",
                  color: "#0A0A0A",
                  padding: "14px 28px",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderRadius: 14,
                  boxShadow: "4px 4px 0 0 #0A0A0A",
                }}
              >
                Rejoindre le réseau RPO
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 0" }}>
        <div style={wrap()} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <img src={kistoneLogoFull} alt="Kistone logo" style={{ height: 64, width: "auto", display: "block" }} />
          </div>
          <div className="flex items-center gap-6">
            <Link to="/client" className="mono muted" style={footerLink()}>Espace Client</Link>
            <Link to="/register" className="mono muted" style={footerLink()}>Espace Freelance</Link>
            <Link to="/studio" className="mono muted" style={footerLink()}>Le studio</Link>
            <Link to="/privacy" className="mono muted" style={footerLink()}>Confidentialité</Link>
          </div>
          <div
            className="mono muted"
            style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            © {new Date().getFullYear()} Kistone
          </div>
        </div>
      </footer>
    </div>
  );
};

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-6 flex-wrap">
      <span
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          padding: "6px 14px",
          borderRadius: 999,
          background: "var(--card)",
          border: "1px solid var(--line)",
          color: "var(--accent)",
        }}
      >
        — {n}
      </span>
      <h2
        className="serif"
        style={{
          fontSize: "clamp(36px, 4.5vw, 64px)",
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          flex: 1,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

const CANDIDATES = [
  {
    photo: sarahPhoto,
    name: "Sarah R.",
    role: "RPO Tech · senior",
    func: "Tech",
    tenure: "9 ans recrutement · ex-Doctolib, Alan",
    days: "12 closings / an",
    rate: "Dispo sous 1 sem.",
    tags: ["Staff Eng.", "EM", "VP Eng.", "SRE"],
    offset: 0,
    shift: -14,
    rot: -4.2,
  },
  {
    photo: thomasPhoto,
    name: "Thomas L.",
    role: "RPO GTM · senior",
    func: "GTM",
    tenure: "15 ans recrutement · ex-Qonto, Spendesk",
    days: "18 closings / an",
    rate: "Dispo immédiate",
    tags: ["AE", "Head of Sales", "Growth", "CSM"],
    offset: 96,
    shift: 22,
    rot: 3.1,
  },
  {
    photo: camillePhoto,
    name: "Camille M.",
    role: "RPO Product · senior",
    func: "Product",
    tenure: "12 ans recrutement · ex-BlaBlaCar, Aircall",
    days: "10 closings / an",
    rate: "Dispo sous 2 sem.",
    tags: ["Senior PM", "Lead PM", "PMM", "Product Design"],
    offset: 196,
    shift: -8,
    rot: -2.6,
  },
];



function CandidateStack() {
  return (
    <div style={{ position: "relative", height: 420, marginTop: 8 }} aria-label="Exemples de freelances Kistone">
      {CANDIDATES.map((c, i) => (
        <article
          key={c.name}
          style={{
            position: "absolute",
            top: c.offset,
            right: 0,
            width: "100%",
            transform: `translateX(${c.shift ?? 0}px) rotate(${c.rot}deg)`,
            background: "#FFFFFF",
            border: "2px solid #0A0A0A",
            borderRadius: 20,
            boxShadow: "8px 8px 0 0 #0A0A0A",
            zIndex: i + 1,
            transition: "transform 300ms ease",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "104px 1fr" }}>
            <div style={{ position: "relative", background: "var(--bg-2)" }}>
              <img
                src={c.photo}
                alt={c.name}
                loading="lazy"
                width={512}
                height={640}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: "grayscale(15%) contrast(1.02)",
                }}
              />
              <span
                className="mono"
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "#E59500",
                  color: "#0A0A0A",
                  border: "2px solid #0A0A0A",
                  boxShadow: "3px 3px 0 0 #0A0A0A",
                }}
              >
                {c.func}
              </span>
            </div>
            <div style={{ padding: "20px 22px 18px" }}>
              <div
                className="mono muted"
                style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {c.role}
              </div>
              <div
                className="serif"
                style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: 4 }}
              >
                {c.name}
              </div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 6 }}>
                {c.tenure}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      letterSpacing: "0.04em",
                      padding: "3px 9px",
                      borderRadius: 999,
                      border: "1px solid var(--line)",
                      color: "var(--ink-2)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div style={{ height: 1, background: "var(--line)", margin: "14px 0 12px" }} />

              <div className="flex items-end justify-between">
                <div>
                  <div
                    className="mono muted"
                    style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}
                  >
                    Volume
                  </div>
                  <div
                    className="serif"
                    style={{ fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}
                  >
                    {c.days}
                  </div>
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    color: "var(--accent)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }} />
                  {c.rate}
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

const wrap = (): React.CSSProperties => ({
  maxWidth: 1240,
  margin: "0 auto",
  padding: "20px 28px",
});
const section = (): React.CSSProperties => ({ paddingTop: 120, paddingBottom: 40 });
const h1 = (): React.CSSProperties => ({
  fontSize: "clamp(27px, 3.9vw, 63px)",
  lineHeight: 0.95,
  letterSpacing: "-0.04em",
  marginTop: 32,
});
const lede = (): React.CSSProperties => ({
  marginTop: 32,
  fontSize: "clamp(14px, 1.2vw, 17px)",
  lineHeight: 1.5,
  color: "var(--ink-2)",
  maxWidth: 640,
});
const btnPrimary = (): React.CSSProperties => ({
  background: "#0A0A0A",
  color: "#fff",
  padding: "14px 28px",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 14,
  border: "2px solid #0A0A0A",
  boxShadow: "6px 6px 0 0 #E54D2A",
  transition: "transform 0.15s, box-shadow 0.15s",
});
const btnGhost = (): React.CSSProperties => ({
  background: "#fff",
  color: "#0A0A0A",
  padding: "14px 28px",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  border: "2px solid #0A0A0A",
  borderRadius: 14,
  boxShadow: "4px 4px 0 0 #0A0A0A",
  transition: "transform 0.15s, box-shadow 0.15s",
});
const navLink = (): React.CSSProperties => ({
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-2)",
  padding: "8px 14px",
  borderRadius: 999,
});
const footerLink = (): React.CSSProperties => ({
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
});
const pill = (): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "5px 12px",
  border: "1px solid #0A0A0A",
  background: "transparent",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#0A0A0A",
  fontFamily: "'JetBrains Mono', monospace",
});
const dot = (): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#E54D2A",
});
const cardBig = (): React.CSSProperties => ({
  background: "#FFFFFF",
  padding: "36px 32px",
  borderRadius: 20,
  border: "2px solid #0A0A0A",
  boxShadow: "8px 8px 0 0 #0A0A0A",
  boxSizing: "border-box",
  transition: "transform 0.2s, box-shadow 0.2s",
});

export default Index;
