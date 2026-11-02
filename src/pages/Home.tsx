import SEO from "@/components/SEO";
import HomeFaq from "@/components/home/HomeFaq";
import { HOME_FAQ } from "@/content/home";
import { withIdentity } from "@/lib/structuredData";
import SiteLayout from "@/components/site/SiteLayout";
import Hero from "@/components/home/Hero";
import BriefDemo from "@/components/home/BriefDemo";
import FunctionsGrid from "@/components/home/FunctionsGrid";
import PainSituations from "@/components/home/PainSituations";
import RoleCatalog from "@/components/home/RoleCatalog";
import RpoScope from "@/components/home/RpoScope";
import RpoVsCabinet from "@/components/home/RpoVsCabinet";
import HowItWorks from "@/components/home/HowItWorks";
import WhyMarketplace from "@/components/home/WhyMarketplace";
import FreelanceCTA from "@/components/home/FreelanceCTA";
import ResourcesTeaser from "@/components/home/ResourcesTeaser";
import FinalCTA from "@/components/home/FinalCTA";
import "@/site/studio.css";

/** Accueil : le réseau de freelances RPO, dans le style de la page /studio. */
export default function Home() {
  return (
    <SiteLayout>
      <SEO
        title="Kistone · Réseau de Freelance RPO"
        description="Une communauté de 700+ recruteurs Freelance RPO sélectionnés et qualifiés, spécialisés par métier. Le bon recruteur en 48 h, facturé au jour, sans honoraires au placement."
        path="/"
        jsonLd={withIdentity({
          "@type": "FAQPage",
          mainEntity: HOME_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        })}
      />
      <div className="overflow-x-clip">
        <Hero />
        <FunctionsGrid />
        <PainSituations />
        <BriefDemo />
        <RpoScope />
        <RpoVsCabinet />
        <RoleCatalog />
        <HowItWorks />
        <WhyMarketplace />
        <FreelanceCTA />
        <ResourcesTeaser />
        <HomeFaq />
        <FinalCTA />
      </div>
    </SiteLayout>
  );
}
