import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Hero from "@/components/home/Hero";
import MarketplacePreview from "@/components/home/MarketplacePreview";
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
        title="Kistone · Partenaire RH augmenté"
        description="Des recruteurs RPO freelance vérifiés pour recruter vite, et un studio IA qui construit vos outils RH sur mesure."
        path="/"
      />
      <Hero />
      <MarketplacePreview />
      <LogoTicker />
      <HowItWorks />
      <WhyMarketplace />
      <FreelanceCTA />
      <StudioReminder />
      <ResourcesTeaser />
    </SiteLayout>
  );
}
