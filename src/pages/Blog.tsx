import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";
import Header from "@/components/KistoneHeader";
import SEO from "@/components/SEO";
import StudioOnboardingDialog from "@/components/studio/StudioOnboardingDialog";
import kistoneLogoLight from "@/assets/kistone-logo-blanc.png";
import { blogArticles as staticArticles, blogCategories, type BlogArticle as StaticArticle } from "@/data/blogArticles";
import { supabase } from "@/integrations/supabase/client";
import "@/pages/studio.css";

interface UnifiedArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  imageUrl: string;
}

const CREAM = "#FAF7F0";
const INK = "#0A0A0A";
const ORANGE = "#E59500";
const ACCENT = "#E54D2A";

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: `2px solid ${INK}`,
  borderRadius: 16,
  boxShadow: `6px 6px 0 0 ${INK}`,
  overflow: "hidden",
  display: "block",
  transition: "transform .15s ease, box-shadow .15s ease",
};

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  background: "#FFF4DF",
  color: "#B7791F",
  border: `1.5px solid ${INK}`,
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 10,
  letterSpacing: "0.12em",
  fontWeight: 700,
  textTransform: "uppercase",
};

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [dbArticles, setDbArticles] = useState<UnifiedArticle[]>([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    const fetchDb = async () => {
      const { data } = await supabase
        .from("blog_articles")
        .select("slug, title, excerpt, category, read_time, image_url, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (data) {
        setDbArticles(
          data.map((a) => ({
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            category: a.category,
            readTime: a.read_time,
            date: new Date(a.created_at)
              .toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
              .replace(/\//g, "."),
            imageUrl: a.image_url || "",
          }))
        );
      }
    };
    fetchDb();
  }, []);

  const allArticles: UnifiedArticle[] = [
    ...dbArticles,
    ...staticArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      readTime: a.readTime,
      date: a.date,
      imageUrl: a.imageUrl,
    })),
  ];

  const filtered =
    activeCategory === "Tous" ? allArticles : allArticles.filter((a) => a.category === activeCategory);

  const featured = allArticles[0];

  return (
    <div className="lp-body" style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}>
      <SEO
        title="Blog Kistone — Le blog du recruteur augmenté"
        description="Des articles pour améliorer son quotidien de recruteur, rester informé sur les tendances, les innovations et les évolutions du marché."
        path="/blog"
      />
      <Header onStartProject={() => setOnboardingOpen(true)} />
      <StudioOnboardingDialog open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      {/* Hero + Featured */}
      <section style={{ padding: "64px 16px", borderBottom: `2px solid ${INK}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: 48, gridTemplateColumns: "1fr", alignItems: "center" }} className="blog-hero-grid">
            <div>
              <span style={{ ...tagStyle, background: "#FFE5CC", color: ACCENT }}>● LE BLOG</span>
              <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.05, margin: "16px 0 16px" }}>
                Le blog du <span style={{ color: ORANGE }}>recruteur augmenté</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(10,10,10,0.7)", maxWidth: 560 }}>
                Des articles pour améliorer son quotidien de recruteur, rester informé sur les tendances, les innovations et les évolutions du marché.
              </p>
            </div>

            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                style={cardStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `10px 10px 0 0 ${INK}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 0 ${INK}`;
                }}
              >
                {featured.imageUrl && (
                  <div style={{ aspectRatio: "16 / 9", overflow: "hidden", borderBottom: `2px solid ${INK}` }}>
                    <img src={featured.imageUrl} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={tagStyle}>{featured.category}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(10,10,10,0.6)" }}>
                      <Clock size={12} /> {featured.readTime}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>{featured.title}</h2>
                  <p style={{ marginTop: 6, fontSize: 12, color: "rgba(10,10,10,0.55)" }}>{featured.date}</p>
                </div>
              </Link>
            )}
          </div>
        </div>
        <style>{`@media (min-width: 1024px){ .blog-hero-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
      </section>

      {/* Category filter */}
      <section style={{ padding: "48px 16px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Parcourez les articles par catégorie</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {blogCategories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: `2px solid ${INK}`,
                    background: active ? ORANGE : "#FFFFFF",
                    color: INK,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    boxShadow: active ? `3px 3px 0 0 ${INK}` : "none",
                    transition: "all .15s",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Articles grid */}
      <section style={{ padding: "48px 16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {filtered.map((article) => (
              <Link
                key={article.slug}
                to={`/blog/${article.slug}`}
                style={cardStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `10px 10px 0 0 ${INK}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 0 ${INK}`;
                }}
              >
                {article.imageUrl && (
                  <div style={{ aspectRatio: "16 / 9", overflow: "hidden", borderBottom: `2px solid ${INK}` }}>
                    <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={tagStyle}>{article.category}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(10,10,10,0.6)" }}>
                      <Clock size={12} /> {article.readTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{article.title}</h3>
                  <p style={{ marginTop: 8, fontSize: 14, color: "rgba(10,10,10,0.65)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {article.excerpt}
                  </p>
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "rgba(10,10,10,0.55)" }}>{article.date}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: ACCENT }}>
                      Lire <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && (
            <p style={{ padding: "48px 0", textAlign: "center", color: "rgba(10,10,10,0.55)" }}>
              Aucun article pour le moment. Revenez bientôt !
            </p>
          )}
        </div>
      </section>

      <div className="lp-footer-wrap">
        <div className="lp-footer lp-container">
          <div className="lp-footer-logo">
            <img src={kistoneLogoLight} alt="Kistone Studio logo" className="lp-logo-img" />
          </div>
          <ul className="lp-footer-links">
            <li><Link to="/#process">Comment ça marche</Link></li>
            <li><Link to="/realisations">Nos réalisations</Link></li>
            <li><Link to="/pourquoi-kistone">Pourquoi Kistone</Link></li>
            <li><a href="mailto:aguego@kistone.fr">Contact</a></li>
          </ul>
          <div className="lp-footer-copy">© 2026 Kistone Studio</div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
