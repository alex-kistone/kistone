/**
 * Données structurées (schema.org) qui décrivent Kistone et son fondateur, partagées par les
 * pages. Elles relient l'entité « Kistone » à son site, son logo, son fondateur et ses profils
 * officiels : c'est ce que lisent Google et les moteurs IA pour savoir qui parle.
 */
import { BASE_URL } from "@/components/SEO";

/**
 * Profils officiels : page LinkedIn de Kistone et profil LinkedIn d'Alexandre (fournis par Alex le
 * 2026-10-20). Liste vide : la propriété sameAs n'est pas publiée.
 */
export const KISTONE_PROFILES: string[] = ["https://www.linkedin.com/company/kistone-ai/"];
export const FOUNDER_PROFILES: string[] = ["https://www.linkedin.com/in/alexguego/"];

const ORG_ID = `${BASE_URL}/#organization`;
const FOUNDER_ID = `${BASE_URL}/#founder`;
const sameAs = (urls: string[]) => (urls.length ? { sameAs: urls } : {});

/** Référence courte vers l'organisation (auteur ou éditeur d'une page). */
export const ORG_REF = { "@id": ORG_ID };
/** Référence courte vers le fondateur (auteur des articles). */
export const FOUNDER_REF = { "@id": FOUNDER_ID };

export const founder = {
  "@type": "Person",
  "@id": FOUNDER_ID,
  name: "Alexandre Guégo",
  jobTitle: "Fondateur",
  image: `${BASE_URL}/team/alexandre-guego.jpg`,
  url: `${BASE_URL}/pourquoi-kistone`,
  worksFor: ORG_REF,
  ...sameAs(FOUNDER_PROFILES),
};

export const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Kistone",
  url: BASE_URL,
  logo: `${BASE_URL}/logos/logo-full-black.png`,
  description:
    "Réseau freelance d'experts IA : AI Engineers, AI Product et AI Leaders en mission, en fractional ou en contract-to-hire, et des Tech Recruiters (RPO) pour recruter les talents IA en CDI.",
  areaServed: { "@type": "Country", name: "France" },
  knowsAbout: ["Intelligence artificielle", "AI Engineer", "AI Product Manager", "Head of AI", "Chief AI Officer", "Fractional CTO", "Freelance", "RPO", "Recrutement tech"],
  founder: FOUNDER_REF,
  ...sameAs(KISTONE_PROFILES),
};

export const website = {
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: "Kistone",
  url: BASE_URL,
  inLanguage: "fr-FR",
  publisher: ORG_REF,
};

/** Bloc complet à poser sur une page : organisation, site et fondateur, plus d'autres nœuds. */
export const withIdentity = (...nodes: Record<string, unknown>[]) => ({
  "@context": "https://schema.org",
  "@graph": [organization, website, founder, ...nodes],
});

/** Auteur et éditeur des articles et du comparatif (nœuds complets, lisibles seuls). */
export const ARTICLE_AUTHOR = { "@type": "Person", name: founder.name, jobTitle: "Fondateur de Kistone", url: founder.url, ...sameAs(FOUNDER_PROFILES) };
export const ARTICLE_PUBLISHER = { "@type": "Organization", name: "Kistone", url: BASE_URL, logo: { "@type": "ImageObject", url: organization.logo } };
