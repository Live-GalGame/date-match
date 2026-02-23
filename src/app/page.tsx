import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Footer />
    </main>
  );
}
