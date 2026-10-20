import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  /** Image de partage (URL absolue ou chemin du site, 1200 × 630) ; à défaut, l'image générale. */
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export const BASE_URL = "https://kistone.fr";
const DEFAULT_IMAGE = "/og/default.png";

/**
 * Balises <head> d'une page : titre « Sujet | Kistone » (le sujet d'abord, Google n'en affiche
 * qu'une soixantaine de caractères), description, URL canonique sur kistone.fr, aperçu de partage
 * (LinkedIn, Slack, X) et données structurées. Titres et descriptions sont écrits à la bonne
 * longueur dans le contenu : jamais tronqués ici.
 */
export default function SEO({ title, description, path, type = "website", image = DEFAULT_IMAGE, jsonLd }: SEOProps) {
  const url = `${BASE_URL}${path}`;
  const full = /kistone/i.test(title) ? title : `${title} | Kistone`;
  const img = image.startsWith("http") ? image : `${BASE_URL}${image}`;
  const ownImage = img.startsWith(`${BASE_URL}/og/`);
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={img} />
      {ownImage ? <meta property="og:image:width" content="1200" /> : null}
      {ownImage ? <meta property="og:image:height" content="630" /> : null}
      <meta property="og:image:alt" content={full} />
      <meta name="twitter:title" content={full} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
