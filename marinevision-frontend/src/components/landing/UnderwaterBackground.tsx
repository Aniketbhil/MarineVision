import React from "react";

export function UnderwaterBackground() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden bg-linear-to-b from-[#bdeeff] to-[#79e5e3]">
      {/* Submarine graphic in the background (left side) */}
      <div className="absolute bottom-[20%] left-[5%] opacity-40 pointer-events-none mix-blend-multiply w-50 md:w-75">
        <svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" fill="#3b9da8">
          <g transform="translate(20, 20)">
            {/* Main hull */}
            <rect x="50" y="30" width="250" height="50" rx="25" />
            
            {/* Conning tower */}
            <path d="M 120 30 L 140 10 L 170 10 L 190 30 Z" />
            
            {/* Periscope/antenna */}
            <rect x="150" y="0" width="4" height="15" />
            <rect x="160" y="-5" width="2" height="20" />
            
            {/* Tail */}
            <path d="M 50 55 L 20 30 L 20 80 Z" />
            
            {/* Propeller/rudder cross */}
            <rect x="10" y="45" width="20" height="20" />
            
            {/* Front dome (sonar) */}
            <path d="M 300 30 A 25 25 0 0 1 300 80 L 290 80 L 290 30 Z" opacity="0.8" />
            
            {/* Window */}
            <circle cx="270" cy="55" r="8" fill="#1b5a63" />
            <circle cx="230" cy="55" r="8" fill="#1b5a63" />
            <circle cx="190" cy="55" r="8" fill="#1b5a63" />
          </g>
        </svg>
      </div>

      {/* Ocean floor / Wave silhouette */}
      <div className="absolute bottom-0 w-full h-auto opacity-30 pointer-events-none">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[20vh] fill-[#3b9da8]">
          <path d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,165.3C960,160,1056,192,1152,192C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
      
      {/* Additional subtle wave overlay for depth */}
      <div className="absolute bottom-0 w-full h-auto opacity-20 pointer-events-none">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[15vh] fill-[#1d6b75]">
          <path d="M0,128L60,149.3C120,171,240,213,360,208C480,203,600,149,720,144C840,139,960,181,1080,192C1200,203,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
}
