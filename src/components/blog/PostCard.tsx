import SmartLink from "@/components/site/SmartLink";
import { BoltMark } from "@/components/brand/Bolt";
import { formatDate, postPath, readingMinutes, type BlogPost } from "@/lib/blog";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Carte d'article : couverture (ou teinte de la fonction), étiquette, titre, date et durée. */
export default function PostCard({ post }: { post: BlogPost }) {
  const p = palettes[post.vertical ? verticalOf(post.vertical).palette : "apricot"];
  return (
    <li className="ks-lift rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white p-3 shadow-ks-card">
      <SmartLink href={postPath(post)} className="flex h-full flex-col">
        <div className={`relative flex h-[200px] overflow-hidden rounded-[20px] p-[18px] ${post.cover_url ? "items-start" : "items-end"}`} style={{ background: p.tint }}>
          {post.cover_url ? (
            <img src={post.cover_url} alt={post.cover_alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <BoltMark className="absolute -right-6 -top-6 h-[240px] w-auto rotate-[14deg] opacity-[0.12]" strokeWidth={18} />
          )}
          <span className="relative flex h-7 items-center gap-[7px] rounded-full bg-white/85 px-3 text-xs font-medium" style={{ color: p.ink }}>
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.accent }} aria-hidden="true" />
            {post.tags[0] ?? "Article"}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-[18px]">
          <h3 className="font-ks-display text-[21px] font-semibold leading-[1.2] tracking-[-0.02em]">{post.title}</h3>
          {post.excerpt && <p className="line-clamp-2 text-[15px] leading-[1.5] text-ks-soft">{post.excerpt}</p>}
          <span className="mt-auto pt-2 text-sm text-ks-subtle">{formatDate(post.published_at)} · {readingMinutes(post.content)} min de lecture</span>
        </div>
      </SmartLink>
    </li>
  );
}
