import { BoltWatermark } from "@/components/brand/Bolt";
import Cta from "@/components/site/Cta";
import PostCard from "@/components/blog/PostCard";
import { useBlogPosts } from "@/components/blog/useBlogPosts";
import { BLOG_PATH } from "@/lib/blog";

/** Ressources : les 3 derniers articles RPO publiés ; section masquée tant qu'il n'y en a pas. */
export default function ResourcesTeaser() {
  const posts = useBlogPosts().posts.filter((p) => p.vertical === "rpo");
  if (posts.length === 0) return null;
  return (
    <section id="ressources" className="relative isolate mx-auto mt-24 flex max-w-ks scroll-mt-24 flex-col px-5 md:mt-[140px] md:px-8 xl:px-0">
      <BoltWatermark strokeWidth={16} className="-right-20 -top-40 h-[680px] w-auto rotate-[14deg]" />
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="ks-reveal font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[56px]">
            Réussir vos <span className="ks-grad-text">recrutements</span>.
          </h2>
        </div>
        <Cta href={BLOG_PATH} variant="secondary" arrow className="self-start md:self-auto">Toutes les ressources</Cta>
      </div>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {posts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
      </ul>
    </section>
  );
}
