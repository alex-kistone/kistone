import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BlogArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  created_at: string;
  read_time: string;
}

const AdminBlogPanel = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<BlogArticleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_articles")
      .select("id, title, slug, category, published, created_at, read_time")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les articles.", variant: "destructive" });
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  const togglePublished = async (article: BlogArticleRow) => {
    const { error } = await supabase
      .from("blog_articles")
      .update({ published: !article.published })
      .eq("id", article.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, published: !a.published } : a));
      toast({ title: article.published ? "Article dépublié" : "Article publié" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_articles").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Article supprimé" });
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement des articles...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Articles de blog ({articles.length})</h2>
        <Button asChild size="sm" className="gap-2">
          <Link to="/blog/new">
            <Plus className="h-4 w-4" /> Nouvel article
          </Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Aucun article pour le moment. Créez votre premier article !
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium">{article.title}</h3>
                  {article.published ? (
                    <Badge className="text-xs">En ligne</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{article.category}</span>
                  <span>{article.read_time}</span>
                  <span>{new Date(article.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublished(article)} title={article.published ? "Dépublier" : "Publier"}>
                  {article.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link to={`/blog/edit/${article.id}`} title="Modifier">
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(article.id)} title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlogPanel;
