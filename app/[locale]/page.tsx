import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BeforeAfterSection from "@/components/landing/BeforeAfterSection";
import ProblemsSection from "@/components/landing/ProblemsSection";
import StoryJourneySection from "@/components/landing/StoryJourneySection";
import FeaturesSection from "@/components/landing/FeaturesSection";
// import TimeCalculatorSection from "@/components/landing/TimeCalculatorSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";
import "@/i18n/request";
import PricingSectionWrapper from "@/components/landing/pricingWrapper";

export default function Home() {
  return (
    <div className="min-h-screen relative max-w-screen overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemsSection />
        <BeforeAfterSection />
        <FeaturesSection />
        <StoryJourneySection />
        {/* <TimeCalculatorSection /> */}
        <PricingSectionWrapper />
        <HowItWorksSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
