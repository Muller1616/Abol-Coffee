import { DocumentTitle } from '@/components/DocumentTitle'
import { ContactSection } from '@/features/landing/ContactSection'
import { FaqSection } from '@/features/landing/FaqSection'
import { FeaturesSection } from '@/features/landing/FeaturesSection'
import { FooterSection } from '@/features/landing/FooterSection'
import { HeroSection } from '@/features/landing/HeroSection'
import { HowItWorksSection } from '@/features/landing/HowItWorksSection'
import { Navbar } from '@/features/landing/Navbar'

export function HomePage() {
  return (
    <div className="relative min-h-dvh bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground">
      <DocumentTitle title="Abol Coffee · Restaurant Digital Menu Platform" />

      <Navbar />

      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
        <ContactSection />
      </main>

      <FooterSection />
    </div>
  )
}
