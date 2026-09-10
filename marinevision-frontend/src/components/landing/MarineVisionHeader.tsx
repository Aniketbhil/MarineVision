import React from "react";

export function MarineVisionHeader() {
  return (
    <header className="relative w-full pt-8 px-6 flex items-center justify-center">
      <div className="absolute left-6 top-6 w-auto h-12 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/marinevision-logo.png" alt="MarineVision Logo" className="h-full w-auto object-contain drop-shadow-sm" />
      </div>

      {/* MarineVision branding centered near the top */}
      <div className="text-3xl md:text-5xl font-bold tracking-tight text-[#00507d] drop-shadow-sm hidden md:block" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        MarineVision
      </div>
    </header>
  );
}
