import type { BlogPost } from "@/lib/blog";
import { COMPARISON, PLAYERS } from "@/content/comparison";

/**
 * Ressources éditées dans le code (en plus des articles de la base) : elles apparaissent
 * dans la liste /ressources, sur l'accueil et dans « À lire aussi ».
 */
const base = (p: Partial<BlogPost> & Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "content" | "published_at">): BlogPost => ({
  seo_title: "",
  seo_description: "",
  tags: [],
  faq: [],
  vertical: null,
  cover_url: null,
  cover_alt: "",
  brief: {},
  status: "published",
  created_at: p.published_at!,
  updated_at: p.published_at!,
  ...p,
});

/** Texte du comparatif à plat : sert au temps de lecture affiché sur la carte. */
function comparisonText(): string {
  const flat = (v: unknown): string[] =>
    typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(flat) : v && typeof v === "object" ? Object.values(v).flatMap(flat) : [];
  return [...flat(COMPARISON), ...flat(PLAYERS)].join(" ");
}

export const STATIC_POSTS: BlogPost[] = [
  // Le comparatif a sa propre page (/ressources/comparatif-plateformes-freelance-ia) ; cette entrée l'affiche dans la liste.
  base({
    id: "static-comparatif-acteurs",
    slug: COMPARISON.slug,
    title: COMPARISON.title,
    excerpt: COMPARISON.lead,
    // Catégorie centrée sur la couverture, puis pastille verte en haut à gauche
    tags: ["Comparatif", "Étude"],
    content: comparisonText(),
    published_at: `${COMPARISON.date}T11:00:00.000Z`,
  }),
];

/** Fusionne les articles de la base et ceux du code, du plus récent au plus ancien. */
export function withStaticPosts(posts: BlogPost[]): BlogPost[] {
  const slugs = new Set(posts.map((p) => p.slug));
  return [...posts, ...STATIC_POSTS.filter((p) => !slugs.has(p.slug))].sort(
    (a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
}
