import React from "react";
import { BookOpen } from "lucide-react"; // Closest approximation to the icon in the badge

export function HeroSection() {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center mt-12 md:mt-16 px-4">
      {/* Small pill/badge */}
      <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm border border-white/50 rounded-full px-4 py-1.5 mb-6 shadow-sm">
        <BookOpen className="w-4 h-4 text-cyan-600" />
        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-cyan-700 uppercase">
          AI-Powered Marine Intelligence
        </span>
      </div>

      {/* Main heading */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 drop-shadow-sm">
        See Beneath the Surface
      </h1>

      {/* Supporting text */}
      <p className="text-sm md:text-base lg:text-lg text-slate-700 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
        AI-powered Side-Scan Sonar analysis for detecting, derelict fishing gear (Ghost-Net),<br className="hidden md:block" /> Underwater debris, pipelines, and anomalies.
      </p>

      {/* Small section label with horizontal lines */}
      <div className="flex items-center justify-center w-full max-w-md mx-auto mb-8">
        <div className="flex-1 h-px bg-cyan-700/20"></div>
        <span className="px-4 text-[10px] sm:text-xs font-bold tracking-widest text-cyan-800/60 uppercase">
          Choose Your Analysis Mode
        </span>
        <div className="flex-1 h-px bg-cyan-700/20"></div>
      </div>
    </section>
  );
}
