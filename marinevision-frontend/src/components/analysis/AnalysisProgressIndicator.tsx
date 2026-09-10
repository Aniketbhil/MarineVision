'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, UploadCloud, Cpu, ScanSearch, FileSignature } from 'lucide-react';

const STAGES = [
  { id: 'uploading', label: 'Uploading...', icon: UploadCloud },
  { id: 'preprocessing', label: 'Preprocessing...', icon: Loader2 },
  { id: 'ai_detection', label: 'AI Detection...', icon: Cpu },
  { id: 'evidence', label: 'Evidence Analysis...', icon: ScanSearch },
  { id: 'report', label: 'Generating Report...', icon: FileSignature },
];

interface AnalysisProgressIndicatorProps {
  isApiComplete: boolean;
  onComplete: () => void;
  error: string | null;
}

export function AnalysisProgressIndicator({ isApiComplete, onComplete, error }: AnalysisProgressIndicatorProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (error) return; // Stop advancing if error

    const advanceStage = () => {
      setCurrentStageIndex((prev) => {
        // If API is complete, we can rush to the end
        if (isApiComplete) {
           if (prev < STAGES.length - 1) {
              return prev + 1;
           }
           return prev; // We're at the end
        }

        // If API is NOT complete, don't pass stage 3 (Evidence Analysis)
        if (prev < 3) {
          return prev + 1;
        }
        return prev;
      });
    };

    const timer = setInterval(advanceStage, 1200);

    return () => clearInterval(timer);
  }, [isApiComplete, error]);

  useEffect(() => {
    // If API is complete AND we are on the final stage, trigger completion after a short delay
    if (isApiComplete && currentStageIndex === STAGES.length - 1 && !error) {
      const completionTimer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(completionTimer);
    }
  }, [isApiComplete, currentStageIndex, error, onComplete]);

  return (
    <div className="w-full max-w-md mx-auto bg-white/60 backdrop-blur-md rounded-2xl border border-sky-100 p-6 shadow-sm">
      <h3 className="text-slate-800 font-semibold mb-4 text-center">Processing Sonar Data</h3>
      
      <div className="space-y-4">
        {STAGES.map((stage, index) => {
          const isComplete = index < currentStageIndex || (index === STAGES.length - 1 && isApiComplete);
          const isActive = index === currentStageIndex && !error && !isComplete;
          const isPending = index > currentStageIndex;
          
          const Icon = isComplete ? CheckCircle2 : stage.icon;

          return (
            <div key={stage.id} className={`flex items-center gap-3 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full 
                ${isComplete ? 'bg-emerald-100 text-emerald-600' : ''}
                ${isActive ? 'bg-sky-100 text-sky-600 ring-2 ring-sky-200' : ''}
                ${isPending ? 'bg-slate-100 text-slate-400' : ''}
                ${error && isActive ? 'bg-red-100 text-red-600' : ''}
              `}>
                <Icon className={`w-4 h-4 ${isActive && !error ? 'animate-spin' : ''}`} />
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-sky-900' : 'text-slate-600'} ${error && isActive ? 'text-red-600' : ''}`}>
                {error && isActive ? 'Analysis Failed' : stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
