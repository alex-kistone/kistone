import SmartLink from "@/components/site/SmartLink";
import { BoltMark } from "@/components/brand/Bolt";
import { formatDate, postPath, readingMinutes, type BlogPost } from "@/lib/blog";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/**
 * Couverture des articles sans image, au gabarit des couvertures du blog (src/lib/blogCover.ts) :
 * fond crème, halos du dégradé IA, éclair en filigrane, catégorie centrée, logo en bas à gauche.
 */
function CoverTemplate({ category }: { category: string }) {
  return (
    <div className="relative isolate flex h-[200px] items-center justify-center overflow-hidden rounded-[20px] bg-ks-bg px-6">
      <span className="absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-[#FF2E6E] opacity-[0.16] blur-3xl" aria-hidden="true" />
      <span className="absolute -bottom-24 -left-16 -z-10 h-56 w-56 rounded-full bg-[#B14DF5] opacity-[0.12] blur-3xl" aria-hidden="true" />
      <span className="absolute -bottom-20 -right-10 -z-10 h-48 w-48 rounded-full bg-[#4C7DFF] opacity-[0.14] blur-3xl" aria-hidden="true" />
      <BoltMark className="absolute -right-4 -top-10 -z-10 h-[260px] w-auto rotate-[14deg] text-ks-ink opacity-[0.06]" strokeWidth={16} />
      <span className="flex flex-col items-center text-center">
        <span className="font-ks-display text-[30px] font-bold leading-[1.02] tracking-[-0.04em] text-ks-ink">{category}</span>
        <span className="mt-3 h-[5px] w-12 rounded-full ks-grad-bg" aria-hidden="true" />
      </span>
      <span className="absolute bottom-4 left-[18px] flex items-center gap-2" aria-hidden="true">
        <img src="/logos/logo-full-black.png" alt="" className="h-[14px] w-auto" />
        <span className="h-3 w-px bg-[rgba(20,19,18,0.18)]" />
        <span className="font-ks-mono text-[8px] uppercase tracking-[0.14em] text-ks-soft">AI expert platform</span>
      </span>
    </div>
  );
}

/** Carte d'article : couverture (ou teinte de la fonction), étiquette, titre, date et durée. */
export default function PostCard({ post }: { post: BlogPost }) {
  const p = palettes[post.vertical ? verticalOf(post.vertical).palette : "apricot"];
  const category = post.tags[0] ?? "Article";
  return (
    <li className="ks-lift rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card">
      <SmartLink href={postPath(post)} className="flex h-full flex-col">
        {post.cover_url ? (
          <div className="relative flex h-[200px] items-start overflow-hidden rounded-[20px] p-[18px]" style={{ background: p.tint }}>
            <img src={post.cover_url} alt={post.cover_alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <span className="relative flex h-7 items-center gap-[7px] rounded-full bg-white/85 px-3 text-xs font-medium" style={{ color: p.ink }}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.accent }} aria-hidden="true" />
              {category}
            </span>
          </div>
        ) : (
          <CoverTemplate category={category} />
        )}
        <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-[18px]">
          <h3 className="font-ks-display text-[21px] font-semibold leading-[1.2] tracking-[-0.02em]">{post.title}</h3>
          {post.excerpt && <p className="line-clamp-2 text-[15px] leading-[1.5] text-ks-soft">{post.excerpt}</p>}
          <span className="mt-auto pt-2 text-sm text-ks-subtle">{formatDate(post.published_at)} · {readingMinutes(post.content)} min de lecture</span>
        </div>
      </SmartLink>
    </li>
  );
}
