import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/KistoneHeader";
import SEO from "@/components/SEO";
import { blogArticles } from "@/data/blogArticles";
import { blogContent } from "@/data/blogContent";
import { supabase } from "@/integrations/supabase/client";

interface DbArticle {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: string;
  image_url: string | null;
  created_at: string;
}

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [dbArticle, setDbArticle] = useState<DbArticle | null>(null);
  const [loading, setLoading] = useState(true);

  // Try static first
  const staticArticle = blogArticles.find((a) => a.slug === slug);
  const staticContent = slug ? blogContent[slug] : undefined;

  useEffect(() => {
    if (staticArticle && staticContent) {
      setLoading(false);
      return;
    }
    // Try database
    const fetchDb = async () => {
      const { data } = await supabase
        .from("blog_articles")
        .select("title, excerpt, content, category, read_time, image_url, created_at")
        .eq("slug", slug!)
        .eq("published", true)
        .single();
      if (data) setDbArticle(data);
      setLoading(false);
    };
    fetchDb();
  }, [slug]);

  // Determine which data source to use
  const article = staticArticle
    ? { title: staticArticle.title, excerpt: staticArticle.excerpt, category: staticArticle.category, readTime: staticArticle.readTime, date: staticArticle.date, imageUrl: staticArticle.imageUrl }
    : dbArticle
    ? { title: dbArticle.title, excerpt: dbArticle.excerpt, category: dbArticle.category, readTime: dbArticle.read_time, date: new Date(dbArticle.created_at).toLocaleDateString("fr-FR"), imageUrl: dbArticle.image_url || "" }
    : null;

  // ISO 8601 date for structured data
  const dateIso = dbArticle
    ? dbArticle.created_at.slice(0, 10)
    : staticArticle
    ? (() => {
        const [d, m, y] = staticArticle.date.split(".");
        return `${y}-${m}-${d}`;
      })()
    : undefined;

  const content = staticContent || dbArticle?.content;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!article || !content) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Article introuvable</h1>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-2 text-accent hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour au blog
          </Link>
        </div>
      </div>
    );
  }

  const renderContent = (md: string) => {
    const lines = md.split("\n");
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let listOrdered = false;

    const flushList = () => {
      if (listItems.length > 0) {
        const Tag = listOrdered ? "ol" : "ul";
        elements.push(
          <Tag key={elements.length} className={`mb-4 space-y-1 pl-6 ${listOrdered ? "list-decimal" : "list-disc"} text-muted-foreground`}>
            {listItems.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </Tag>
        );
        listItems = [];
      }
    };

    const formatInline = (text: string): string => {
      return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("## ")) {
        flushList();
        elements.push(<h2 key={i} className="mt-10 mb-4 font-heading text-2xl font-bold text-foreground">{line.slice(3)}</h2>);
      } else if (line.startsWith("### ")) {
        flushList();
        elements.push(<h3 key={i} className="mt-8 mb-3 font-heading text-xl font-semibold text-foreground">{line.slice(4)}</h3>);
      } else if (line.startsWith("#### ")) {
        flushList();
        elements.push(<h4 key={i} className="mt-6 mb-2 font-heading text-lg font-semibold text-foreground">{line.slice(5)}</h4>);
      } else if (line.startsWith("- ")) {
        listOrdered = false;
        listItems.push(line.slice(2));
      } else if (/^\d+\.\s/.test(line)) {
        listOrdered = true;
        listItems.push(line.replace(/^\d+\.\s/, ""));
      } else if (line.trim() === "") {
        flushList();
      } else {
        flushList();
        elements.push(<p key={i} className="mb-4 leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />);
      }
    }
    flushList();
    return elements;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${article.title} — Blog Kistone`}
        description={article.excerpt || `${article.title} — article du blog Kistone sur le recrutement freelance et l'IA.`}
        path={`/blog/${slug}`}
        type="article"
        image={article.imageUrl || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          image: article.imageUrl || undefined,
          datePublished: dateIso,
          author: {
            "@type": "Organization",
            name: "Kistone",
          },
        }}
      />
      <Header />
      <article className="px-4 py-12">
        <div className="container mx-auto max-w-3xl">
          <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour au blog
          </Link>
          {article.imageUrl && (
            <div className="mb-8 overflow-hidden rounded-2xl">
              <img src={article.imageUrl} alt={article.title} className="h-auto w-full object-cover" />
            </div>
          )}
          <div className="mb-4 flex items-center gap-3">
            <Badge variant="secondary">{article.category}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {article.readTime}
            </span>
            <span className="text-xs text-muted-foreground">{article.date}</span>
          </div>
          <h1 className="mb-8 font-heading text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>
          <div className="prose-connect2">{renderContent(content)}</div>
        </div>
      </article>
      <footer className="border-t px-4 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span>© 2025 Connect2. Tous droits réservés.</span>
          <div className="flex gap-6">
            <Link to="/" className="transition-colors hover:text-foreground">Accueil</Link>
            <Link to="/blog" className="transition-colors hover:text-foreground">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogArticle;
