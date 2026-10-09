import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Hero from "@/components/home/Hero";
import BriefDemo from "@/components/home/BriefDemo";
import ProofStrip from "@/components/home/ProofStrip";
import FunctionsGrid from "@/components/home/FunctionsGrid";
import FinalCTA from "@/components/home/FinalCTA";
import LogoTicker from "@/components/home/LogoTicker";
import HowItWorks from "@/components/home/HowItWorks";
import WhyMarketplace from "@/components/home/WhyMarketplace";
import FreelanceCTA from "@/components/home/FreelanceCTA";
import StudioReminder from "@/components/home/StudioReminder";
import ResourcesTeaser from "@/components/home/ResourcesTeaser";

export default function Home() {
  return (
    <SiteLayout>
      <SEO
        title="Kistone · Plateforme Freelance · Fractional Leaders"
        description="Dirigeants et recruteurs freelance pour les entreprises Tech & Digital : RPO, DRH, CFO, COO, CRO, CTO, à temps plein ou quelques jours par semaine."
        path="/"
      />
      <Hero />
      <BriefDemo />
      <LogoTicker />
      <FunctionsGrid />
      <ProofStrip />
      <HowItWorks />
      <WhyMarketplace />
      <FreelanceCTA />
      <StudioReminder />
      <ResourcesTeaser />
      <FinalCTA />
    </SiteLayout>
  );
}
