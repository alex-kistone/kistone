import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const BASE_URL = "https://kistone.fr";

export default function SEO({ title, description, path, type = "website", image, jsonLd }: SEOProps) {
  const url = `${BASE_URL}${path}`;
  const safeTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const safeDesc = description.length > 160 ? description.slice(0, 157) + "…" : description;
  return (
    <Helmet>
      {/* L'onglet affiche toujours « Kistone » ; le titre de page sert au partage (og/twitter). */}
      <title>Kistone</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      {image ? <meta name="twitter:image" content={image} /> : null}
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
