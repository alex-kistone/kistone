import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VERTICALS } from "@/lib/verticals";
import { formatDate, postPath, slugify, type BlogPost } from "@/lib/blog";
import ArticleBody from "@/components/blog/ArticleBody";

const TONES = ["Expert et accessible", "Pédagogique", "Direct et concret", "Inspirant", "Institutionnel"];
const OBJECTIVES = [
  "Attirer des dirigeants qui cherchent un profil (SEO)",
  "Être cité par les moteurs IA comme référence (GEO)",
  "Expliquer une fonction et son rôle",
  "Comparer des options (fractional, temps plein, cabinet…)",
  "Attirer des freelances seniors",
];
const AUDIENCES = ["Dirigeants de startups et scale-ups", "Dirigeants de PME", "DRH et équipes RH", "Freelances seniors", "Investisseurs et boards"];
const LENGTHS = [
  { value: "court", label: "Court (~700 mots)" },
  { value: "moyen", label: "Moyen (~1 200 mots)" },
  { value: "long", label: "Long (~1 800 mots)" },
];

type Brief = { theme: string; tone: string; objective: string; audience: string; keywords: string; length: string; vertical: string };
type Draft = Omit<BlogPost, "id" | "created_at" | "updated_at" | "published_at" | "status"> & {
  id?: string; status: BlogPost["status"]; published_at: string | null; image_prompt: string;
};

const EMPTY_BRIEF: Brief = { theme: "", tone: TONES[0], objective: OBJECTIVES[0], audience: AUDIENCES[0], keywords: "", length: "moyen", vertical: "none" };
const emptyDraft = (): Draft => ({
  slug: "", title: "", excerpt: "", content: "", seo_title: "", seo_description: "", tags: [], faq: [],
  vertical: null, cover_url: null, cover_alt: "", brief: {}, status: "draft", published_at: null, image_prompt: "",
});

/** Message d'erreur d'une fonction Supabase (le corps JSON est dans le contexte de l'erreur). */
async function invokeError(error: { message: string; context?: { json?: () => Promise<{ error?: string }> } }) {
  const body = await error.context?.json?.().catch(() => null);
  return body?.error ?? error.message;
}

/** Onglet Blog de l'administration : liste des articles et éditeur assisté par l'IA. */
export default function AdminBlogPanel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts" as never).select("*").order("updated_at", { ascending: false });
    setPosts((data as BlogPost[] | null) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = (p?: BlogPost) => {
    setEditing(p ? { ...p, image_prompt: p.brief?.image_prompt ?? "" } : emptyDraft());
    setBrief(p?.brief?.theme ? { ...EMPTY_BRIEF, ...(p.brief as Partial<Brief>) } : EMPTY_BRIEF);
  };

  if (editing) {
    return (
      <Editor
        draft={editing}
        setDraft={setEditing}
        brief={brief}
        setBrief={setBrief}
        onClose={() => { setEditing(null); load(); }}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Blog</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Articles de la rubrique Ressources du site, rédigés avec l'aide de l'IA.</p>
        </div>
        <Button onClick={() => open()} className="gap-2"><Plus className="h-4 w-4" />Nouvel article</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun article pour l'instant. Donnez un thème à l'IA pour rédiger le premier.</p>
        ) : (
          <ul className="divide-y">
            {posts.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="h-12 w-20 shrink-0 rounded-md bg-muted" />
                )}
                <button type="button" onClick={() => open(p)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium hover:underline">{p.title || "Sans titre"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.status === "published" ? `Publié le ${formatDate(p.published_at)}` : `Brouillon · modifié le ${formatDate(p.updated_at)}`}
                    {p.tags.length ? ` · ${p.tags.join(", ")}` : ""}
                  </p>
                </button>
                <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status === "published" ? "Publié" : "Brouillon"}</Badge>
                {p.status === "published" && (
                  <a href={postPath(p)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Voir l'article">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Editor({ draft, setDraft, brief, setBrief, onClose }: {
  draft: Draft; setDraft: (d: Draft) => void; brief: Brief; setBrief: (b: Brief) => void; onClose: () => void;
}) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [imaging, setImaging] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });

  const generate = async () => {
    if (brief.theme.trim().length < 5) {
      toast({ title: "Thème manquant", description: "Décrivez le sujet de l'article en quelques mots.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("blog-generate", {
      body: { ...brief, vertical: brief.vertical === "none" ? null : brief.vertical },
    });
    setGenerating(false);
    if (error || data?.error) {
      toast({ title: "Rédaction impossible", description: error ? await invokeError(error) : data.error, variant: "destructive" });
      return;
    }
    setDraft({
      ...draft,
      title: data.title, slug: data.slug, excerpt: data.excerpt, content: data.content,
      seo_title: data.seo_title, seo_description: data.seo_description, tags: data.tags ?? [],
      faq: data.faq ?? [], cover_alt: data.cover_alt ?? "", image_prompt: data.image_prompt ?? "",
      vertical: brief.vertical === "none" ? null : brief.vertical,
    });
    toast({ title: "Article rédigé", description: "Relisez-le, ajustez-le puis générez l'illustration." });
  };

  const generateImage = async () => {
    setImaging(true);
    const { data, error } = await supabase.functions.invoke("blog-image", { body: { prompt: draft.image_prompt || draft.title } });
    setImaging(false);
    if (error || data?.error) {
      toast({ title: "Image impossible", description: error ? await invokeError(error) : data.error, variant: "destructive" });
      return;
    }
    set("cover_url", data.url);
  };

  const upload = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `covers/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file, { contentType: file.type });
    if (error) {
      toast({ title: "Téléversement impossible", description: error.message, variant: "destructive" });
      return;
    }
    set("cover_url", supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  };

  const save = async (status: Draft["status"]) => {
    const slug = slugify(draft.slug || draft.title);
    if (!draft.title.trim() || !slug) {
      toast({ title: "Titre manquant", description: "Donnez un titre à l'article.", variant: "destructive" });
      return;
    }
    if (status === "published" && !draft.content.trim()) {
      toast({ title: "Article vide", description: "Rédigez ou générez le contenu avant de publier.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const row = {
      slug, title: draft.title.trim(), excerpt: draft.excerpt, content: draft.content,
      seo_title: draft.seo_title || draft.title, seo_description: draft.seo_description || draft.excerpt,
      tags: draft.tags, faq: draft.faq, vertical: draft.vertical, cover_url: draft.cover_url, cover_alt: draft.cover_alt,
      brief: { ...brief, image_prompt: draft.image_prompt }, status,
      published_at: status === "published" ? draft.published_at ?? new Date().toISOString() : null,
      ...(draft.id ? {} : { author_id: user?.id }),
    };
    const q = draft.id
      ? supabase.from("blog_posts" as never).update(row as never).eq("id", draft.id).select("*").single()
      : supabase.from("blog_posts" as never).insert(row as never).select("*").single();
    const { data, error } = await q;
    setSaving(false);
    if (error) {
      const taken = error.code === "23505";
      toast({ title: "Enregistrement impossible", description: taken ? "Cette adresse est déjà utilisée par un autre article." : error.message, variant: "destructive" });
      return;
    }
    const saved = data as BlogPost;
    setDraft({ ...draft, ...saved, image_prompt: draft.image_prompt });
    toast({ title: status === "published" ? "Article publié" : "Brouillon enregistré" });
  };

  const remove = async () => {
    if (!draft.id || !window.confirm("Supprimer définitivement cet article ?")) return;
    const { error } = await supabase.from("blog_posts" as never).delete().eq("id", draft.id);
    if (error) toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
    else onClose();
  };

  const setFaq = (i: number, k: "q" | "a", v: string) => set("faq", draft.faq.map((f, j) => (j === i ? { ...f, [k]: v } : f)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onClose} className="gap-2"><ArrowLeft className="h-4 w-4" />Tous les articles</Button>
        <div className="flex flex-wrap items-center gap-2">
          {draft.id && <Button variant="ghost" onClick={remove} className="gap-2 text-destructive"><Trash2 className="h-4 w-4" />Supprimer</Button>}
          {draft.status === "published" && draft.id && (
            <Button variant="outline" asChild className="gap-2"><a href={postPath(draft)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Voir</a></Button>
          )}
          {draft.status === "published" ? (
            <>
              <Button variant="outline" disabled={saving} onClick={() => save("draft")}>Dépublier</Button>
              <Button disabled={saving} onClick={() => save("published")}>Mettre à jour</Button>
            </>
          ) : (
            <>
              <Button variant="outline" disabled={saving} onClick={() => save("draft")}>Enregistrer le brouillon</Button>
              <Button disabled={saving} onClick={() => save("published")}>Publier</Button>
            </>
          )}
        </div>
      </div>

      {/* Brief pour l'IA */}
      <Card className="border-dashed border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />Rédiger avec l'IA</CardTitle>
          <p className="text-sm text-muted-foreground">L'IA rédige un article optimisé pour Google et les moteurs IA : réponse dès l'introduction, questions en intertitres, FAQ, liens vers les pages métier.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="blog-theme">Thème</Label>
            <Textarea id="blog-theme" rows={2} value={brief.theme} onChange={(e) => setBrief({ ...brief, theme: e.target.value })} placeholder="Ex : Quand faire appel à un CFO à temps partagé après une levée de fonds" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Pick label="Ton" value={brief.tone} options={TONES} onChange={(v) => setBrief({ ...brief, tone: v })} />
            <Pick label="Objectif" value={brief.objective} options={OBJECTIVES} onChange={(v) => setBrief({ ...brief, objective: v })} />
            <Pick label="Public" value={brief.audience} options={AUDIENCES} onChange={(v) => setBrief({ ...brief, audience: v })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="blog-keywords">Mots-clés</Label>
              <Input id="blog-keywords" value={brief.keywords} onChange={(e) => setBrief({ ...brief, keywords: e.target.value })} placeholder="cfo temps partagé, daf freelance" />
            </div>
            <div className="space-y-2">
              <Label>Longueur</Label>
              <Select value={brief.length} onValueChange={(v) => setBrief({ ...brief, length: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LENGTHS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fonction liée</Label>
              <Select value={brief.vertical} onValueChange={(v) => setBrief({ ...brief, vertical: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune en particulier</SelectItem>
                  {VERTICALS.map((v) => <SelectItem key={v.id} value={v.id}>{v.short} · {v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Rédaction en cours (environ 1 min)…" : draft.content ? "Réécrire l'article" : "Rédiger l'article"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Article */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Titre</Label>
              <Input id="blog-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-slug">Adresse</Label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="shrink-0">kistone.fr/ressources/</span>
                <Input id="blog-slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} onBlur={(e) => set("slug", slugify(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Chapô</Label>
              <Textarea id="blog-excerpt" rows={2} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </div>
            <Tabs defaultValue="edit">
              <div className="flex items-center justify-between">
                <Label>Contenu (Markdown)</Label>
                <TabsList>
                  <TabsTrigger value="edit">Éditer</TabsTrigger>
                  <TabsTrigger value="preview">Aperçu</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="edit">
                <Textarea rows={24} value={draft.content} onChange={(e) => set("content", e.target.value)} className="font-mono text-[13px]" />
              </TabsContent>
              <TabsContent value="preview">
                <div className="max-h-[640px] overflow-y-auto rounded-md border p-5">
                  <ArticleBody markdown={draft.content || "_Aucun contenu._"} />
                </div>
              </TabsContent>
            </Tabs>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Questions fréquentes</Label>
                <Button variant="ghost" size="sm" onClick={() => set("faq", [...draft.faq, { q: "", a: "" }])} className="gap-1"><Plus className="h-3.5 w-3.5" />Question</Button>
              </div>
              {draft.faq.map((f, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex gap-2">
                    <Input value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} placeholder="Question" />
                    <Button variant="ghost" size="icon" onClick={() => set("faq", draft.faq.filter((_, j) => j !== i))} aria-label="Retirer la question"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Textarea rows={2} value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} placeholder="Réponse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Couverture et référencement */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Illustration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {draft.cover_url ? (
                <img src={draft.cover_url} alt={draft.cover_alt} className="aspect-[3/2] w-full rounded-md object-cover" />
              ) : (
                <div className="flex aspect-[3/2] w-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">Pas encore d'image</div>
              )}
              <Textarea rows={3} value={draft.image_prompt} onChange={(e) => set("image_prompt", e.target.value)} placeholder="Description de l'image (proposée par l'IA avec l'article)" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={generateImage} disabled={imaging} className="gap-2">
                  {imaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {imaging ? "Photo en cours (environ 30 s)…" : draft.cover_url ? "Régénérer" : "Générer l'image"}
                </Button>
                <Button size="sm" variant="outline" asChild className="gap-2">
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4" />Téléverser
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  </label>
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blog-alt" className="text-xs">Texte alternatif</Label>
                <Input id="blog-alt" value={draft.cover_alt} onChange={(e) => set("cover_alt", e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Référencement</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Counted id="blog-seo-title" label="Titre SEO" max={60} value={draft.seo_title} onChange={(v) => set("seo_title", v)} />
              <Counted id="blog-seo-desc" label="Meta description" max={155} value={draft.seo_description} onChange={(v) => set("seo_description", v)} multiline />
              <div className="space-y-1.5">
                <Label htmlFor="blog-tags" className="text-xs">Étiquettes (séparées par des virgules)</Label>
                <Input id="blog-tags" value={draft.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Pick({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Counted({ id, label, max, value, onChange, multiline }: { id: string; label: string; max: number; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const over = value.length > max;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">{label}</Label>
        <span className={over ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{value.length} / {max}</span>
      </div>
      {multiline ? (
        <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={over} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={over} />
      )}
    </div>
  );
}
