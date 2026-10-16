import SEO from "@/components/SEO";
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
import StudioReminder from "@/components/home/StudioReminder";
import ResourcesTeaser from "@/components/home/ResourcesTeaser";
import FinalCTA from "@/components/home/FinalCTA";
import "@/site/studio.css";

/** Accueil : la plateforme freelance des experts IA, dans le style de la page /studio. */
export default function Home() {
  return (
    <SiteLayout>
      <SEO
        title="Kistone · Plateforme freelance des experts IA"
        description="AI Engineers, AI Product Managers et AI Leaders freelance, sélectionnés et qualifiés : un premier profil en 48 h, en mission, en fractional ou en contract-to-hire. Et des Tech recruiters pour internaliser vos talents IA."
        path="/"
      />
      <div className="overflow-x-clip">
        <Hero />
        <PainSituations />
        <BriefDemo />
        <FunctionsGrid />
        <RoleCatalog />
        <HowItWorks />
        <WhyMarketplace />
        <SquadOffer />
        <ModelsTeaser />
        <FreelanceCTA />
        <StudioReminder />
        <ResourcesTeaser />
        <FinalCTA />
      </div>
    </SiteLayout>
  );
}
