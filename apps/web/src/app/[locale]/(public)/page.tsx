import { FeaturesSection } from './_components/home/features-section'
import { PricingSection } from './_components/home/pricing-section'
import { StorySection } from './_components/home/story-section'
import { HeroSection } from './_components/home/hero-section'
import { FaqSection } from './_components/home/faq-section'
import { HowSection } from './_components/home/how-section'
import { SiteFooter } from './_components/home/site-footer'
import { SiteHeader } from './_components/home/site-header'

export default function Home() {
  return (
    <div className="lynko-home overflow-hidden bg-[#f7f6f1] font-[var(--font-roboto)] text-[#171716]">
      <SiteHeader />

      <main>
        <HeroSection />
        <StorySection />
        <HowSection />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
      </main>

      <SiteFooter />
    </div>
  )
}
