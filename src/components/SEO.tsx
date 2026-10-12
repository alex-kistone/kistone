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
  // La marque toujours en tête : l'onglet commence par « Kistone », Google affiche la suite.
  const full = title.startsWith("Kistone") ? title : `Kistone · ${title}`;
  const safeTitle = full.length > 65 ? full.slice(0, 64) + "…" : full;
  const safeDesc = description.length > 160 ? description.slice(0, 157) + "…" : description;
  return (
    <Helmet>
      <title>{safeTitle}</title>
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
