import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import Highlight from "@/components/site/Highlight";
import PostCard from "@/components/blog/PostCard";
import { useBlogPosts } from "@/components/blog/useBlogPosts";
import { BoltWatermark } from "@/components/brand/Bolt";
import { BLOG_PATH } from "@/lib/blog";
import { ROUTES } from "@/content/site";

/** /ressources : tous les articles publiés, du plus récent au plus ancien. */
export default function BlogIndex() {
  const { posts, loading } = useBlogPosts();
  return (
    <SiteLayout>
      <SEO
        title="Ressources : experts IA, projets IA et recrutement des talents IA"
        description="Analyses et guides Kistone pour les entreprises et les experts IA : passer un projet IA en production, choisir entre mission freelance, fractional et contract-to-hire, recruter et internaliser les talents IA."
        path={BLOG_PATH}
      />
      <section className="relative isolate mx-auto max-w-ks px-5 pt-12 md:px-8 md:pt-[72px] xl:px-0">
        <BoltWatermark strokeWidth={14} className="-right-24 -top-24 h-[620px] w-auto rotate-[14deg]" />
        <h1 className="max-w-[860px] font-ks-display text-[44px] font-bold leading-[1.02] tracking-[-0.048em] sm:text-[64px]">
          Réussir vos projets <Highlight>IA</Highlight>.
        </h1>
        <p className="mt-5 max-w-[680px] text-lg leading-[1.5] text-ks-soft md:text-xl">
          Passer un projet IA en production, choisir le bon format (mission freelance, fractional, contract-to-hire), recruter et internaliser les talents IA : des repères concrets pour les entreprises et les experts IA.
        </p>
        {loading && posts.length === 0 ? (
          <p className="mt-14 text-ks-subtle">Chargement des articles…</p>
        ) : posts.length === 0 ? (
          <div className="mt-14 rounded-[28px] bg-white p-10 text-center shadow-ks-card">
            <p className="font-ks-display text-[24px] font-semibold">Premiers articles très bientôt.</p>
            <p className="mt-2 text-ks-soft">En attendant, décrivez votre besoin : un premier profil vous est présenté sous 48 h.</p>
            <div className="mt-6"><Cta href={ROUTES.recruit} variant="studio" arrow>Partager un besoin</Cta></div>
          </div>
        ) : (
          <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </ul>
        )}
      </section>
    </SiteLayout>
  );
}
