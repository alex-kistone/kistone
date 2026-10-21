import SmartLink from "@/components/site/SmartLink";
import { BOLT_FILLED_PATH, coverLayout, estimateOutfitWidth } from "@/lib/blogCoverLayout";
import { formatDate, postPath, readingMinutes, type BlogPost } from "@/lib/blog";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/**
 * Couverture des articles sans image : la carte « Design Card Blog » v3 (src/lib/blogCover.ts) en
 * SVG aux mêmes cotes (1200 × 800), pour un rendu identique à l'image à toutes les tailles.
 */
function CoverTemplate({ category, badge }: { category: string; badge?: string }) {
  const layout = coverLayout(category, estimateOutfitWidth);
  const boltH = 800 * 1.4;
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-[20px]">
      <svg viewBox="0 0 1200 800" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="cv-pink" cx="0.88" cy="0.08" r="1" gradientTransform="translate(0.88 0.08) scale(0.6 0.7) translate(-0.88 -0.08)">
            <stop offset="0" stopColor="#FF2E6E" stopOpacity="0.3" /><stop offset="0.7" stopColor="#FF2E6E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cv-violet" cx="0.04" cy="1" r="1" gradientTransform="translate(0.04 1) scale(0.5 0.55) translate(-0.04 -1)">
            <stop offset="0" stopColor="#B14DF5" stopOpacity="0.2" /><stop offset="0.7" stopColor="#B14DF5" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cv-blue" cx="1" cy="1" r="1" gradientTransform="translate(1 1) scale(0.5 0.55) translate(-1 -1)">
            <stop offset="0" stopColor="#4C7DFF" stopOpacity="0.26" /><stop offset="0.7" stopColor="#4C7DFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cv-bar"><stop offset="0" stopColor="#FF2E6E" /><stop offset="0.55" stopColor="#B14DF5" /><stop offset="1" stopColor="#4C7DFF" /></linearGradient>
        </defs>
        <rect width="1200" height="800" fill="#F5F1EA" />
        <rect width="1200" height="800" fill="url(#cv-pink)" />
        <rect width="1200" height="800" fill="url(#cv-violet)" />
        <rect width="1200" height="800" fill="url(#cv-blue)" />
        <path
          d={BOLT_FILLED_PATH}
          fill="#141312"
          fillOpacity="0.1"
          fillRule="evenodd"
          transform={`translate(${layout.boltLeft} ${-0.22 * 800}) scale(${boltH / 1024})`}
        />
        <text x="600" textAnchor="middle" dominantBaseline="middle" fill="#141312" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize={layout.size} letterSpacing={-0.045 * layout.size}>
          {layout.lines.map((l, i) => <tspan key={l} x="600" y={layout.top + i * layout.size}>{l}</tspan>)}
        </text>
        <rect x="552" y={layout.barY} width="96" height="6" rx="3" fill="url(#cv-bar)" />
        <image href="/logos/logo-full-black.png" x="60" y="678" width="299" height="66" />
        <rect x="385" y="690" width="1.5" height="42" fill="#141312" fillOpacity="0.25" />
        <text x="413" y="712" dominantBaseline="middle" fill="#4A4640" fontFamily="'Geist Mono', monospace" fontWeight="500" fontSize="22" letterSpacing="3.1">AI EXPERTS PLATFORM</text>
      </svg>
      {badge ? (
        <span className="absolute left-[18px] top-[18px] flex h-7 items-center gap-[7px] rounded-full bg-white/85 px-3 text-xs font-medium text-[#1B6541]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#2F9A63]" aria-hidden="true" />
          {badge}
        </span>
      ) : null}
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
          <div className="relative flex aspect-[3/2] items-start overflow-hidden rounded-[20px] p-[18px]" style={{ background: p.tint }}>
            <img src={post.cover_url} alt={post.cover_alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <span className="relative flex h-7 items-center gap-[7px] rounded-full bg-white/85 px-3 text-xs font-medium" style={{ color: p.ink }}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.accent }} aria-hidden="true" />
              {category}
            </span>
          </div>
        ) : (
          <CoverTemplate category={category} badge={post.tags[1]} />
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
