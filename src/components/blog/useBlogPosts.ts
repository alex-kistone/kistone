import { useEffect, useState } from "react";
import { fetchPublishedPosts, useInitialPosts, type BlogPost } from "@/lib/blog";
import { withStaticPosts } from "@/content/articles";

/** Articles publiés : ceux du pré-rendu s'ils sont là, puis la version à jour depuis Supabase, plus les ressources du code. */
export function useBlogPosts(): { posts: BlogPost[]; loading: boolean } {
  const initial = useInitialPosts();
  const [posts, setPosts] = useState<BlogPost[]>(withStaticPosts(initial ?? []));
  const [loading, setLoading] = useState(!initial);
  useEffect(() => {
    let alive = true;
    fetchPublishedPosts().then((p) => {
      if (!alive) return;
      setPosts(withStaticPosts(p));
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);
  return { posts, loading };
}
