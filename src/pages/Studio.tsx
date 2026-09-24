import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import BookingCard from "@/components/studio/BookingCard";
import CaseStudies from "@/components/studio/CaseStudies";
import FAQ from "@/components/studio/FAQ";
import Hero from "@/components/studio/Hero";
import KeyFigures from "@/components/studio/KeyFigures";
import LogoTicker from "@/components/studio/LogoTicker";
import MethodSteps from "@/components/studio/MethodSteps";
import Pricing from "@/components/studio/Pricing";
import ProductTicker from "@/components/studio/ProductTicker";
import Testimonials from "@/components/studio/Testimonials";
import WhyBento from "@/components/studio/WhyBento";
import { STUDIO_SEO } from "@/content/studio";
import "@/site/studio.css";

/** Landing du studio : outils RH sur mesure livrés en 30 jours. */
export default function Studio() {
  return (
    <SiteLayout>
      <SEO title={STUDIO_SEO.title} description={STUDIO_SEO.description} path="/studio" />
      <div className="overflow-x-clip">
        <Hero />
        <ProductTicker />
        <KeyFigures />
        <LogoTicker />
        <MethodSteps />
        <CaseStudies />
        <WhyBento />
        <Pricing />
        <BookingCard />
        <Testimonials />
        <FAQ />
      </div>
    </SiteLayout>
  );
}
