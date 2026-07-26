import { DocumentTitle } from '@/components/DocumentTitle'
import { ContactSection } from '@/features/landing/ContactSection'
import { FaqSection } from '@/features/landing/FaqSection'
import { FeaturesSection } from '@/features/landing/FeaturesSection'
import { FooterSection } from '@/features/landing/FooterSection'
import { HeroSection } from '@/features/landing/HeroSection'
import { HowItWorksSection } from '@/features/landing/HowItWorksSection'
import { Navbar } from '@/features/landing/Navbar'
import { PreviewSection } from '@/features/landing/PreviewSection'
import { TrustSection } from '@/features/landing/TrustSection'

export function HomePage() {
  return (
    <div className="relative min-h-dvh bg-background text-foreground antialiased selection:bg-amber-400 selection:text-slate-950">
      <DocumentTitle title="Abol Coffee · Restaurant Digital Menu Platform for Business Owners" />

      {/* 1. Navigation Bar */}
      <Navbar />

      {/* Main Landing Page Flow */}
      <main>
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Why Restaurant Owners Choose This System */}
        <TrustSection />

        {/* 4. Core Features */}
        <FeaturesSection />

        {/* 5. How It Works */}
        <HowItWorksSection />

        {/* 6. Live Menu Preview */}
        <PreviewSection />

        {/* 7. Frequently Asked Questions */}
        <FaqSection />

        {/* 8. Final Call To Action */}
        <ContactSection />
      </main>

      {/* 9. Footer */}
      <FooterSection />
    </div>
  )
}
