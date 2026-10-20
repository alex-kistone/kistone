import { Link, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { ARTICLE_AUTHOR, ARTICLE_PUBLISHER } from "@/lib/structuredData";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import SmartLink from "@/components/site/SmartLink";
import ArticleBody from "@/components/blog/ArticleBody";
import PostCard from "@/components/blog/PostCard";
import { useBlogPosts } from "@/components/blog/useBlogPosts";
import { BoltWatermark } from "@/components/brand/Bolt";
import { BLOG_PATH, formatDate, postPath, readingMinutes } from "@/lib/blog";
import { ROLE_PAGES, rolePath } from "@/content/roles";
import { ROUTES } from "@/content/site";
import { verticalOf } from "@/lib/verticals";

const BASE_URL = "https://kistone.fr";

/** /ressources/:slug : un article, sa FAQ et un appel à l'action vers la fonction concernée. */
export default function BlogPost() {
  const { slug } = useParams();
  const { posts, loading } = useBlogPosts();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-ks px-5 py-24 text-center md:px-8">
          {loading ? (
            <p className="text-ks-subtle">Chargement de l'article…</p>
          ) : (
            <>
              <h1 className="font-ks-display text-[40px] font-bold tracking-[-0.04em]">Article introuvable</h1>
              <p className="mt-3 text-ks-soft">Il a peut-être été déplacé ou retiré.</p>
              <div className="mt-6"><Cta href={BLOG_PATH} arrow>Toutes les ressources</Cta></div>
            </>
          )}
        </section>
      </SiteLayout>
    );
  }

  const url = `${BASE_URL}${postPath(post)}`;
  const role = post.vertical ? ROLE_PAGES.find((r) => r.vertical === post.vertical) : null;
  const related = posts.filter((p) => p.id !== post.id && (!post.vertical || p.vertical === post.vertical)).slice(0, 3);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seo_description || post.excerpt,
      ...(post.cover_url ? { image: post.cover_url } : {}),
      datePublished: post.published_at,
      dateModified: post.updated_at,
      mainEntityOfPage: url,
      inLanguage: "fr-FR",
      keywords: post.tags.join(", "),
      author: ARTICLE_AUTHOR,
      publisher: ARTICLE_PUBLISHER,
    },
    ...(post.faq.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ressources", item: `${BASE_URL}${BLOG_PATH}` },
        { "@type": "ListItem", position: 2, name: post.title, item: url },
      ],
    },
  ];

  return (
    <SiteLayout>
      <SEO title={post.seo_title || post.title} description={post.seo_description || post.excerpt} path={postPath(post)} type="article" image={post.cover_url ?? undefined} jsonLd={jsonLd} />
      <article className="relative isolate mx-auto max-w-[820px] px-5 pt-10 md:px-8 md:pt-16">
        <BoltWatermark strokeWidth={14} className="-right-64 top-24 hidden h-[720px] w-auto rotate-[14deg] lg:block" />
        <nav aria-label="Fil d'Ariane" className="text-sm text-ks-subtle">
          <Link to={BLOG_PATH} className="hover:text-ks-ink">Ressources</Link>
          {role && <> · <SmartLink href={rolePath(role)} className="hover:text-ks-ink">{role.role}</SmartLink></>}
        </nav>
        <h1 className="mt-5 font-ks-display text-[38px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[54px]">{post.title}</h1>
        {post.excerpt && <p className="mt-5 text-lg leading-[1.55] text-ks-soft md:text-xl">{post.excerpt}</p>}
        <p className="mt-5 text-sm text-ks-subtle">
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time> · {readingMinutes(post.content)} min de lecture
          {post.tags.length > 0 && <> · {post.tags.join(", ")}</>}
        </p>
        {post.cover_url && (
          <img src={post.cover_url} alt={post.cover_alt} className="mt-8 aspect-[3/2] w-full rounded-[24px] object-cover shadow-ks-card" />
        )}

        <div className="mt-10">
          <ArticleBody markdown={post.content} />
        </div>

        {post.faq.length > 0 && (
          <section className="mt-14">
            <h2 className="font-ks-display text-[28px] font-semibold tracking-[-0.02em]">Questions fréquentes</h2>
            <div className="mt-5 divide-y divide-[rgba(20,19,18,0.08)] rounded-[24px] bg-white px-6 shadow-ks-card">
              {post.faq.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-ks-display text-[18px] font-semibold">
                    {f.q}
                    <span className="text-ks-pink transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-[1.6] text-ks-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <aside className="mt-14 rounded-[28px] bg-ks-dark px-7 py-10 text-ks-dark-fg md:px-10">
          <p className="font-ks-display text-[26px] font-bold leading-[1.1] tracking-[-0.03em] md:text-[32px]">
            {role ? `Besoin d'un ${role.role} ?` : "Besoin d'un expert senior ?"}
          </p>
          <p className="mt-3 text-ks-dark-muted">Un premier profil qualifié sous 48 h, à temps plein ou quelques jours par semaine.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Cta href={post.vertical ? `${ROUTES.recruit}?fonction=${post.vertical}` : ROUTES.recruit} arrow>
              Partager mon besoin{post.vertical ? ` ${verticalOf(post.vertical).short}` : ""}
            </Cta>
            {role && <Cta href={rolePath(role)} variant="ghost-dark">Le métier de {role.role}</Cta>}
          </div>
        </aside>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-24 max-w-ks px-5 md:px-8 xl:px-0">
          <h2 className="font-ks-display text-[32px] font-bold tracking-[-0.04em]">À lire aussi</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {related.map((p) => <PostCard key={p.id} post={p} />)}
          </ul>
        </section>
      )}
    </SiteLayout>
  );
}
