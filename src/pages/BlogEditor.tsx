import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Save, Trash2, Upload, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";

const categories = ["Le modèle RPO", "Conseils", "Recruteur Freelance"];

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const BlogEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Conseils");
  const [readTime, setReadTime] = useState("5 min");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(false);

  // IA
  const [aiOpen, setAiOpen] = useState(!isEdit);
  const [aiIdea, setAiIdea] = useState("");
  const [aiTheme, setAiTheme] = useState("");
  const [aiTone, setAiTone] = useState("Professionnel et accessible");
  const [aiObjective, setAiObjective] = useState("");
  const [aiGenerateImage, setAiGenerateImage] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIGenerate = async () => {
    if (aiIdea.trim().length < 5) {
      toast({ title: "Idée requise", description: "Décris ton idée en quelques mots.", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-blog-article", {
      body: {
        idea: aiIdea.trim(),
        theme: aiTheme.trim(),
        tone: aiTone.trim(),
        objective: aiObjective.trim(),
        generateImage: aiGenerateImage,
      },
    });
    setAiLoading(false);
    if (error || !data || data.error) {
      toast({
        title: "Erreur de génération",
        description: data?.error || error?.message || "Impossible de générer l'article.",
        variant: "destructive",
      });
      return;
    }
    setTitle(data.title || "");
    setSlug(generateSlug(data.title || ""));
    setExcerpt(data.excerpt || "");
    setContent(data.content || "");
    if (data.category && categories.includes(data.category)) setCategory(data.category);
    if (data.read_time) setReadTime(data.read_time);
    if (data.image_url) setImageUrl(data.image_url);
    setAiOpen(false);
    toast({ title: "Article généré ✨", description: "Tu peux maintenant l'éditer puis le publier." });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      toast({ title: "Image uploadée" });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      if (isEdit) loadArticle();
    };
    checkAuth();
  }, []);

  const loadArticle = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("id", id!)
      .single();
    if (error || !data) {
      toast({ title: "Erreur", description: "Article introuvable.", variant: "destructive" });
      navigate("/dashboard");
    } else {
      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt);
      setContent(data.content);
      setCategory(data.category);
      setReadTime(data.read_time);
      setImageUrl(data.image_url || "");
      setPublished(data.published);
    }
    setLoading(false);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) setSlug(generateSlug(val));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({ title: "Erreur", description: "Le titre et le slug sont requis.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      category,
      read_time: readTime,
      image_url: imageUrl.trim() || null,
      published,
      author_id: session.user.id,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("blog_articles").update(payload).eq("id", id!));
    } else {
      ({ error } = await supabase.from("blog_articles").insert(payload));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isEdit ? "Article mis à jour" : "Article créé" });
      navigate("/dashboard");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    const { error } = await supabase.from("blog_articles").delete().eq("id", id!);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Article supprimé" });
      navigate("/dashboard");
    }
  };

  // Simple markdown renderer (reuse BlogArticle logic)
  const renderMarkdown = (md: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{isEdit ? "Modifier l'article" : "Nouvel article"}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isEdit && (
              <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Supprimer
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setPreview(!preview)} className="gap-2">
              <Eye className="h-4 w-4" /> {preview ? "Éditer" : "Aperçu"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "..." : "Enregistrer"}
            </Button>
          </div>
        </div>

        {preview ? (
          /* Preview mode - mirrors BlogArticle layout */
          <article className="mx-auto max-w-3xl">
            {imageUrl && (
              <div className="mb-8 overflow-hidden rounded-2xl">
                <img src={imageUrl} alt={title} className="h-auto w-full object-cover" />
              </div>
            )}
            <div className="mb-4 flex items-center gap-3">
              <Badge variant="secondary">{category}</Badge>
              <span className="text-xs text-muted-foreground">{readTime}</span>
            </div>
            <h1 className="mb-8 font-heading text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
            {excerpt && <p className="mb-8 text-lg text-muted-foreground">{excerpt}</p>}
            <div className="prose-connect2">{renderMarkdown(content)}</div>
          </article>
        ) : (
          /* Editor mode */
          <div className="space-y-6">
            {/* AI generation panel */}
            <div className="rounded-xl border-2 border-foreground bg-accent/5 p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
              <button
                type="button"
                onClick={() => setAiOpen(!aiOpen)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <h3 className="font-heading text-base font-bold">Générer avec l'IA</h3>
                </div>
                <span className="text-xs text-muted-foreground">{aiOpen ? "Masquer" : "Afficher"}</span>
              </button>
              {aiOpen && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Idée principale *</Label>
                    <Textarea
                      value={aiIdea}
                      onChange={(e) => setAiIdea(e.target.value)}
                      placeholder="Ex : Pourquoi le RPO est plus efficace qu'un cabinet de recrutement classique"
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Thème / sujet</Label>
                      <Input value={aiTheme} onChange={(e) => setAiTheme(e.target.value)} placeholder="Ex : Recrutement Tech" />
                    </div>
                    <div className="space-y-2">
                      <Label>Ton</Label>
                      <Input value={aiTone} onChange={(e) => setAiTone(e.target.value)} placeholder="Ex : Pédagogique, percutant…" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Objectif de l'article</Label>
                    <Input
                      value={aiObjective}
                      onChange={(e) => setAiObjective(e.target.value)}
                      placeholder="Ex : Convaincre un DRH de tester le RPO"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={aiGenerateImage} onCheckedChange={setAiGenerateImage} />
                    <Label className="cursor-pointer">Générer aussi une illustration</Label>
                  </div>
                  <Button onClick={handleAIGenerate} disabled={aiLoading} className="gap-2">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {aiLoading ? "Génération en cours…" : "Générer l'article"}
                  </Button>
                  {aiLoading && (
                    <p className="text-xs text-muted-foreground">
                      Cela peut prendre 20-40 secondes (texte + illustration).
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Le titre de votre article" />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-de-larticle" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Extrait / résumé</Label>
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Un court résumé qui apparaîtra sur la liste du blog" rows={2} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Temps de lecture</Label>
                <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="5 min" />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img src={imageUrl} alt="Aperçu" className="h-24 w-auto rounded-lg border border-border object-cover" />
                    <button type="button" onClick={() => setImageUrl("")} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="gap-2">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Upload..." : "Choisir une image"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label>Publié {published ? <Badge className="ml-2">En ligne</Badge> : <Badge variant="secondary" className="ml-2">Brouillon</Badge>}</Label>
            </div>

            <div className="space-y-2">
              <Label>Contenu (Markdown)</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez votre article en Markdown...

## Titre de section

Paragraphe avec du **texte en gras** et des *italiques*.

- Élément de liste
- Autre élément

1. Liste ordonnée
2. Deuxième point"
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogEditor;
