import { BentoGrid } from "@/components/BentoGrid";
import { FooterSection } from "@/components/Footer";

import HeroSection from "@/components/HeroSection";
import { IntegrationSection } from "@/components/IntegrationSection";
import { TestimonialSection } from "@/components/TestimonialSection";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <BentoGrid />
      <IntegrationSection />
      <TestimonialSection />
      <FooterSection />
    </div>
  );
}
