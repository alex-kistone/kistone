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
import SquadOffer from "@/components/home/SquadOffer";
import HowItWorks from "@/components/home/HowItWorks";
import WhyMarketplace from "@/components/home/WhyMarketplace";
import ModelsTeaser from "@/components/home/ModelsTeaser";
import FreelanceCTA from "@/components/home/FreelanceCTA";
import ResourcesTeaser from "@/components/home/ResourcesTeaser";
import FinalCTA from "@/components/home/FinalCTA";
import "@/site/studio.css";

/** Accueil : la plateforme freelance des experts IA, dans le style de la page /studio. */
export default function Home() {
  return (
    <SiteLayout>
      <SEO
        title="Kistone · Réseau d'experts Data & IA"
        description="Engineers, Product et Chief Data Officers freelance qualifiés : un premier profil en 48 h. Et des Tech Recruiters pour recruter vos talents Data & IA en CDI."
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
        <RoleCatalog />
        <HowItWorks />
        <WhyMarketplace />
        <SquadOffer />
        <ModelsTeaser />
        <FreelanceCTA />
        <ResourcesTeaser />
        <HomeFaq />
        <FinalCTA />
      </div>
    </SiteLayout>
  );
}
