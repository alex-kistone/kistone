import { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Article du blog (Ressources). Contenu en Markdown. */
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
  faq: { q: string; a: string }[];
  vertical: string | null;
  cover_url: string | null;
  cover_alt: string;
  brief: Record<string, string>;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const BLOG_PATH = "/ressources";
export const postPath = (p: Pick<BlogPost, "slug">) => `${BLOG_PATH}/${p.slug}`;

/**
 * Articles publiés connus au rendu : fournis par le pré-rendu (contexte côté serveur,
 * window.__KS_BLOG__ dans la page), sinon chargés depuis Supabase.
 */
export const BlogDataContext = createContext<BlogPost[] | null>(null);

declare global {
  interface Window { __KS_BLOG__?: BlogPost[] }
}

export function useInitialPosts(): BlogPost[] | null {
  const fromServer = useContext(BlogDataContext);
  if (fromServer) return fromServer;
  return typeof window !== "undefined" && Array.isArray(window.__KS_BLOG__) ? window.__KS_BLOG__ : null;
}

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("blog_posts" as never)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data as BlogPost[] | null) ?? [];
}

/** Adresse d'article : minuscules sans accents, mots séparés par des tirets. */
export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** Temps de lecture estimé (200 mots par minute). */
export const readingMinutes = (md: string) => Math.max(1, Math.round(md.split(/\s+/).length / 200));

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
