import React from "react";
import { Radar } from "lucide-react"; // Using Radar as a placeholder for the top-left icon if applicable, or we can use a custom SVG.

export function MarineVisionHeader() {
  return (
    <header className="relative w-full pt-8 px-6 flex items-center justify-center">
      {/* Small square icon/control toward the upper-left */}
      <div className="absolute left-6 top-8 w-10 h-10 rounded-md bg-cyan-800/10 border border-cyan-800/20 flex items-center justify-center text-cyan-900 shadow-sm backdrop-blur-sm cursor-pointer hover:bg-cyan-800/20 transition-colors">
        <Radar className="w-5 h-5 opacity-70" />
      </div>

      {/* MarineVision branding centered near the top */}
      <div className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
        MarineVision
      </div>
    </header>
  );
}
