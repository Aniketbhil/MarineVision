import { UnderwaterBackground } from "@/components/landing/UnderwaterBackground";
import { MarineVisionHeader } from "@/components/landing/MarineVisionHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { AnalysisModeSelector } from "@/components/landing/AnalysisModeSelector";
import { MarineVisionFooter } from "@/components/landing/MarineVisionFooter";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col font-sans">
      <UnderwaterBackground />
      <MarineVisionHeader />
      <div className="flex-1 flex flex-col">
        <HeroSection />
        <AnalysisModeSelector />
      </div>
      <MarineVisionFooter />
    </main>
  );
}