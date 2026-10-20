import SmartLink from "@/components/site/SmartLink";
import { formatDate, postPath, readingMinutes, type BlogPost } from "@/lib/blog";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Découpe la catégorie en une ou deux lignes et choisit une taille proche de l'image générée. */
function coverLines(text: string): { size: number; lines: string[] } {
  const maxWidth = 1536 * 0.78;
  const widthOf = (t: string, size: number) => t.length * size * 0.56; // Outfit 700, approximation
  const fit = (lines: string[]) => Math.min(168, Math.floor(maxWidth / (Math.max(...lines.map((l) => l.length)) * 0.56)));
  const one = [text];
  if (widthOf(text, 120) <= maxWidth || !text.includes(" ")) return { size: fit(one), lines: one };
  const words = text.split(" ");
  let best = one;
  let bestLen = Infinity;
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const len = Math.max(...pair.map((l) => l.length));
    if (len < bestLen) { best = pair; bestLen = len; }
  }
  return { size: fit(best), lines: best };
}

/**
 * Couverture des articles sans image : le gabarit des couvertures générées (src/lib/blogCover.ts)
 * en SVG aux mêmes dimensions (1536 × 1024), pour un rendu identique à toutes les tailles.
 */
function CoverTemplate({ category, badge }: { category: string; badge?: string }) {
  const { size, lines } = coverLines(category);
  const lineHeight = size * 1.02;
  const top = 1024 * 0.46 - ((lines.length - 1) * lineHeight) / 2;
  const barY = top + (lines.length - 1) * lineHeight + size * 0.62 + 28;
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-[20px]">
      <svg viewBox="0 0 1536 1024" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="cv-pink"><stop offset="0" stopColor="#FF2E6E" stopOpacity="0.2" /><stop offset="1" stopColor="#FF2E6E" stopOpacity="0" /></radialGradient>
          <radialGradient id="cv-violet"><stop offset="0" stopColor="#B14DF5" stopOpacity="0.14" /><stop offset="1" stopColor="#B14DF5" stopOpacity="0" /></radialGradient>
          <radialGradient id="cv-blue"><stop offset="0" stopColor="#4C7DFF" stopOpacity="0.16" /><stop offset="1" stopColor="#4C7DFF" stopOpacity="0" /></radialGradient>
          <linearGradient id="cv-bar"><stop offset="0" stopColor="#FF2E6E" /><stop offset="0.5" stopColor="#B14DF5" /><stop offset="1" stopColor="#4C7DFF" /></linearGradient>
        </defs>
        <rect width="1536" height="1024" fill="#F5F1EA" />
        <circle cx="1321" cy="123" r="620" fill="url(#cv-pink)" />
        <circle cx="154" cy="973" r="560" fill="url(#cv-violet)" />
        <circle cx="1505" cy="1004" r="520" fill="url(#cv-blue)" />
        <g transform="translate(1137 -123) rotate(14) scale(1.25)" fill="none" stroke="#141312" strokeOpacity="0.06" strokeWidth="16">
          <path d="M38 560 L488 18 L318 398" />
          <path d="M22 588 L346 416 L602 416 L280 588 Z" />
          <path d="M300 606 L132 1006 L590 444" />
        </g>
        <text x="768" textAnchor="middle" dominantBaseline="middle" fill="#141312" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize={size} letterSpacing={-0.04 * size}>
          {lines.map((l, i) => <tspan key={l} x="768" y={top + i * lineHeight}>{l}</tspan>)}
        </text>
        <rect x="702" y={barY} width="132" height="10" rx="5" fill="url(#cv-bar)" />
        <image href="/logos/logo-full-black.png" x="72" y="865" width="394.5" height="87" />
        <rect x="499.5" y="877" width="3" height="63" fill="#141312" fillOpacity="0.18" />
        <text x="532.5" y="910.5" dominantBaseline="middle" fill="#5E5A54" fontFamily="'Geist Mono', monospace" fontWeight="500" fontSize="33" letterSpacing="4.5">AI EXPERTS PLATFORM</text>
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
