import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  read_time: string;
  image_url: string | null;
  created_at: string;
}

const LatestArticlesSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from("blog_articles")
        .select("id, title, slug, excerpt, category, read_time, image_url, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  if (loading || articles.length === 0) return null;

  return (
    <section className="border-t px-4 py-20">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="mb-4 text-center">
          <motion.p variants={fadeUp} className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
            Expertise
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl font-bold sm:text-4xl">
            Derniers <span className="text-primary">articles</span>
          </motion.h2>
        </motion.div>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Conseils, tendances et retours d'expérience sur le recrutement freelance et le RPO.
        </motion.p>

        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article, i) => (
            <motion.div
              key={article.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              custom={i}
            >
              <Link
                to={`/blog/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:border-primary/30 hover:shadow-lg"
              >
                {article.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {article.read_time}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold leading-snug line-clamp-2">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Lire l'article <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-6">
            <Link to="/blog">Voir tous les articles <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LatestArticlesSection;
