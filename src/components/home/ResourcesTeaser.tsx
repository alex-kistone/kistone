import { RESOURCES } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { BoltWatermark } from "@/components/brand/Bolt";
import Cta from "@/components/site/Cta";
import PostCard from "@/components/blog/PostCard";
import { useBlogPosts } from "@/components/blog/useBlogPosts";
import { BLOG_PATH } from "@/lib/blog";

/** Ressources : les 3 derniers articles publiés ; maquette tant qu'il n'y en a pas. */
export default function ResourcesTeaser() {
  const { posts } = useBlogPosts();
  return (
    <section id="ressources" className="relative isolate mx-auto mt-24 flex max-w-ks scroll-mt-24 flex-col px-5 md:mt-[140px] md:px-8 xl:px-0">
      <BoltWatermark strokeWidth={16} className="-right-20 -top-40 h-[680px] w-auto rotate-[14deg]" />
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="ks-reveal font-ks-display text-[40px] font-bold leading-none tracking-[-0.045em] md:text-[56px]">
            Freelance, stratégie et leadership, sans jargon.
          </h2>
        </div>
        {posts.length > 0 ? (
          <Cta href={BLOG_PATH} variant="secondary" arrow className="self-start md:self-auto">Toutes les ressources</Cta>
        ) : (
          <span className="self-start rounded-full border border-ks-line-strong bg-white px-[22px] py-3 text-[15px] font-semibold text-ks-subtle md:self-auto">
            Bientôt en ligne
          </span>
        )}
      </div>
      {posts.length > 0 ? (
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
        </ul>
      ) : (
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {RESOURCES.map((r) => {
          const p = palettes[r.palette];
          return (
            <li key={r.kind} className="ks-lift ks-reveal rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card">
              <div className="flex h-[180px] items-end rounded-[20px] p-[18px]" style={{ background: p.tint }}>
                <span className="flex h-7 items-center gap-[7px] rounded-full bg-white/75 px-3 text-xs font-medium" style={{ color: p.ink }}>
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.accent }} aria-hidden="true" />
                  {r.kind}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 px-3 pb-3 pt-[18px]">
                <h3 className="font-ks-display text-[21px] font-semibold leading-[1.2] tracking-[-0.02em]">{r.title}</h3>
                <span className="text-sm text-ks-subtle">{r.meta}</span>
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </section>
  );
}
