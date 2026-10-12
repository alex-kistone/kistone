import { useEffect, useState } from "react";
import { fetchPublishedPosts, useInitialPosts, type BlogPost } from "@/lib/blog";

/** Articles publiés : ceux du pré-rendu s'ils sont là, puis la version à jour depuis Supabase. */
export function useBlogPosts(): { posts: BlogPost[]; loading: boolean } {
  const initial = useInitialPosts();
  const [posts, setPosts] = useState<BlogPost[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  useEffect(() => {
    let alive = true;
    fetchPublishedPosts().then((p) => {
      if (!alive) return;
      setPosts(p);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);
  return { posts, loading };
}
