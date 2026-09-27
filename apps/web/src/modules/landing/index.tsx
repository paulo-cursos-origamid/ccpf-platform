import {
  Benefits,
  Domains,
  FAQ,
  Features,
  FinalCta,
  Hero,
  HowItWorks,
  LandingFooter,
  LandingHeader,
  Pricing,
  Problem,
  ProductPreview,
  Spaces,
} from "./components";

/**
 * Composição principal da Landing Page pública do CCPF.
 *
 * Cada seção permanece isolada em seu próprio componente para
 * facilitar evolução visual, responsividade e manutenção.
 */
export function LandingPage() {
  return (
    <main>
      <LandingHeader />
      <Hero />
      <Problem />
      <Features />
      <Spaces />
      <Domains />
      <HowItWorks />
      <ProductPreview />
      <Benefits />
      <Pricing />
      <FAQ />
      <FinalCta />
      <LandingFooter />
    </main>
  );
}
