// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://kistone.fr";
const SUPABASE_URL = "https://uaprzfnyzqetnenyiwto.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcHJ6Zm55enFldG5lbnlpd3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODU3ODcsImV4cCI6MjA5NDc2MTc4N30.f_mAPfZSg3-OKOJNDSyxRCDz_ssNYEtbOTIhzMZNuo0";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/talent", changefreq: "weekly", priority: "0.9" },
  { path: "/pourquoi-kistone", changefreq: "monthly", priority: "0.8" },
  { path: "/realisations", changefreq: "monthly", priority: "0.8" },
  { path: "/open-needs", changefreq: "daily", priority: "0.8" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/product-tour/gotam", changefreq: "monthly", priority: "0.6" },
  { path: "/product-tour/connect", changefreq: "monthly", priority: "0.6" },
  { path: "/product-tour/le-kit", changefreq: "monthly", priority: "0.6" },
  { path: "/product-tour/portail-client", changefreq: "monthly", priority: "0.6" },
  { path: "/pricing", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];


async function fetchBlogEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_articles?select=slug,updated_at,created_at&published=eq.true`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ slug: string; updated_at?: string; created_at?: string }>;
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        path: `/blog/${r.slug}`,
        lastmod: (r.updated_at || r.created_at || "").slice(0, 10) || undefined,
        changefreq: "monthly" as const,
        priority: "0.6",
      }));
  } catch {
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const blog = await fetchBlogEntries();
  const entries = [...staticEntries, ...blog];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
