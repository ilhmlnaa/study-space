import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureSection } from "@/components/landing/feature-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { RoleSection } from "@/components/landing/role-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
        <HowItWorksSection />
        <RoleSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
