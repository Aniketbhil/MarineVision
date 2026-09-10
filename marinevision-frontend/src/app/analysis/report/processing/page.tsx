'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/context/AnalysisContext';
import { AnalysisProgressIndicator } from '@/components/analysis/AnalysisProgressIndicator';
import { analyzeSonarImage } from '@/lib/api/analysis';

export default function ProcessingPage() {
  const router = useRouter();
  const { currentFile, latitude, longitude } = useAnalysis();
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiComplete, setIsApiComplete] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentFile) {
      router.push('/analysis/upload');
      return;
    }

    let isMounted = true;
    
    const startAnalysis = async () => {
      try {
        const response = await analyzeSonarImage({ 
          file: currentFile, 
          coordinates: { latitude, longitude } 
        });
        
        if (!isMounted) return;
        
        const returnedScanId = response.scan_id;
        if (!returnedScanId) throw new Error("Backend did not return a valid scan_id");

        setScanId(returnedScanId);
        setIsApiComplete(true);
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error) {
          setApiError(err.message);
        } else {
          setApiError("An unexpected error occurred during analysis.");
        }
        setIsApiComplete(true);
      }
    };

    startAnalysis();

    return () => { isMounted = false; };
  }, [currentFile, latitude, longitude, router]);

  const handleProgressComplete = () => {
    if (!apiError && scanId) {
      router.push(`/analysis/report/${scanId}`);
    } else {
      router.push('/analysis/upload');
    }
  };

  if (!currentFile) return null;

  return (
    <div 
      className="relative min-h-screen text-slate-800 font-sans antialiased overflow-x-hidden flex flex-col justify-center items-center selection:bg-cyan-200 selection:text-slate-900" 
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 55%, #e0f2fe 100%)' }}
    >
      {/* Ambient Deep Water Layer */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 mix-blend-screen" style={{ background: 'radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.4) 60%, rgba(224, 242, 254, 0.6) 100%)', opacity: 0.6 }}></div>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-white/40 blur-3xl rounded-full"></div>
      </div>

      <main className="relative z-10 w-full grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <section className="w-full bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(2,132,199,0.18)] p-6 sm:p-9 max-w-2xl text-center">
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Processing Sonar Data
          </h1>

          <div className="text-left w-full">
            <AnalysisProgressIndicator 
              isApiComplete={isApiComplete}
              error={apiError}
              onComplete={handleProgressComplete}
            />
          </div>

        </section>
      </main>
    </div>
  );
}
