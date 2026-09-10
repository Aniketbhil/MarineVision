'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAnalysis } from '@/context/AnalysisContext';
import { getScanReport } from '@/lib/api/analysis';
import { ScanReport, Detection } from '@/types/analysis';

export function SonarReportPage({ scanId }: { scanId: string }) {
  const { currentFile } = useAnalysis();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      try {
        const data = await getScanReport(scanId);
        if (active) setReport(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load report data');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchReport();
    return () => { active = false; };
  }, [scanId]);

  useEffect(() => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [currentFile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-primary font-body-md animate-pulse">Loading report data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-body-md">Error: {error}</div>
        <Link href="/" className="px-4 py-2 bg-primary text-white rounded">Return to Home</Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center gap-4">
        <div className="text-slate-600 font-body-md">Report not found</div>
        <Link href="/" className="px-4 py-2 bg-primary text-white rounded">Return to Home</Link>
      </div>
    );
  }

  const primaryDetection: Detection | undefined = report.detections?.[0];

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({
      width: e.currentTarget.naturalWidth || 1,
      height: e.currentTarget.naturalHeight || 1,
    });
  };

  const getConfidencePercentage = (conf: number) => {
    // If backend returns 0-1, multiply by 100
    const val = conf <= 1.0 ? conf * 100 : conf;
    return Math.round(val);
  };

  return (
    <div className="min-h-screen text-[#131b2e] font-sans antialiased flex flex-col selection:bg-[#cde5ff] selection:text-[#001d32]" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 48%, #e0f2fe 100%)' }}>
      
      {/* Top Minimal Branding Header */}
      <header className="w-full bg-[#ffffff]/90 backdrop-blur-md px-4 sm:px-8 py-1 h-12 sticky top-0 z-50 flex items-center justify-between shadow-sm border-b border-[#c0c7d1]/40">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight text-[#00507d] uppercase text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>MarineVision</span>
          <span className="hidden sm:inline-block w-px h-4 bg-[#c0c7d1]"></span>
          <span className="hidden sm:inline-block text-[12px] text-[#40474f] italic">See Beneath the Surface</span>
        </div>
      </header>

      {/* Main Centered Report Workspace */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 flex flex-col gap-6">
        
        {/* Unified Cohesive Card Container */}
        <div className="bg-[#ffffff]/95 backdrop-blur-md rounded-xl border border-[#cde5ff]/60 shadow-lg p-5 flex flex-col gap-6">
          
          {/* 1. Report Workspace Header & Download Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#c0c7d1]/40 gap-3">
            <div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#00507d]">assignment</span>
                <h1 className="text-[28px] font-semibold text-[#00507d] tracking-tight leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>REPORT</h1>
              </div>
              <p className="text-[12px] text-[#40474f] mt-1">Inspection Anomaly Analysis & Acoustic Classification</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <a 
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/report/${scanId}?format=csv`}
                download
                className="inline-flex items-center justify-center gap-1 px-2 py-1 h-10 bg-white border border-[#707881] hover:bg-[#eaedff] text-[#131b2e] text-[14px] rounded transition-all"
              >
                <span className="material-symbols-outlined text-[#00507d] text-[18px]">table_view</span>
                <span>Download CSV</span>
              </a>
              <a 
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/report/${scanId}?format=json`}
                download
                className="inline-flex items-center justify-center gap-1 px-2 py-1 h-10 bg-[#00507d] hover:bg-[#0369a1] text-white text-[14px] rounded transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-white text-[18px]">data_object</span>
                <span>Download JSON</span>
              </a>
            </div>
          </div>

          {!primaryDetection ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[48px] mb-3 text-[#00507d] opacity-60">info</span>
              <h2 className="text-[22px] font-bold text-[#131b2e] tracking-wide uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NO TARGET DETECTED</h2>
              <p className="text-[14px] text-[#40474f] mt-1">No marine debris or anomaly was detected in this scan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Sonar Image with Bounding Box */}
              <div className="lg:col-span-7 flex flex-col rounded border border-[#c0c7d1] overflow-hidden bg-white">
                <div className="relative w-full bg-slate-900 flex items-center justify-center overflow-hidden min-h-80">
                  {imageUrl ? (
                    <div className="relative w-full" style={{ aspectRatio: `${naturalSize.width} / ${naturalSize.height}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={imageUrl} 
                        alt="Uploaded Sonar" 
                        onLoad={handleImageLoad}
                        className="absolute inset-0 w-full h-full object-fill opacity-90" 
                      />
                      
                      {/* Bounding Box Overlay */}
                      <div 
                        className="absolute border-2 border-amber-400 bg-amber-400/15 rounded-sm flex flex-col justify-between p-1 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                        style={{
                          left: `${(primaryDetection.bounding_box.x / naturalSize.width) * 100}%`,
                          top: `${(primaryDetection.bounding_box.y / naturalSize.height) * 100}%`,
                          width: `${(primaryDetection.bounding_box.width / naturalSize.width) * 100}%`,
                          height: `${(primaryDetection.bounding_box.height / naturalSize.height) * 100}%`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="bg-amber-400 text-slate-950 font-mono text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-wide uppercase truncate max-w-[70%]">
                            {primaryDetection.classification.replace(/-/g, ' ')}
                          </span>
                          <span className="bg-slate-950/80 text-amber-300 border border-amber-400/50 font-mono text-[10px] px-1 py-0.5 rounded-sm shrink-0">
                            {getConfidencePercentage(primaryDetection.confidence)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                      <span className="material-symbols-outlined text-[48px] opacity-30 mb-2">image_not_supported</span>
                      <p className="text-sm">Image unavailable</p>
                    </div>
                  )}

                  {/* Port / Starboard Water Column Technical Dividers (Optional styling from Stitch, left for visual coherence) */}
                  {imageUrl && (
                    <>
                      <div className="absolute inset-0 pointer-events-none flex justify-between px-2 py-1 text-white/60 font-mono text-[11px] font-bold">
                        <div className="flex items-center gap-1 bg-white/10 px-1 rounded backdrop-blur-sm h-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#89f5e7]"></span>
                          <span>PORT WATER COLUMN</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/10 px-1 rounded backdrop-blur-sm h-fit">
                          <span>STARBOARD WATER COLUMN</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#89f5e7]"></span>
                        </div>
                      </div>
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px border-r border-dashed border-sky-300/40 pointer-events-none"></div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Detection Information */}
              <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="font-mono text-[11px] font-bold tracking-wider text-[#00507d] uppercase">Identified Target</span>
                      <h2 className="text-[28px] font-semibold text-[#131b2e] leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {primaryDetection.classification.replace(/-/g, ' ')}
                      </h2>
                    </div>
                    {/* Severity Badge */}
                    {primaryDetection.severity && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border font-mono text-[11px] font-bold uppercase shrink-0
                        ${primaryDetection.severity.toUpperCase() === 'HIGH' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-amber-50 border-amber-500 text-amber-900'}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${primaryDetection.severity.toUpperCase() === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                        {primaryDetection.severity}
                      </span>
                    )}
                  </div>

                  {/* Confidence Metric */}
                  <div className="pt-2 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[11px] font-bold tracking-wider text-[#707881] uppercase">Confidence Score</span>
                      <span className="text-[24px] font-bold text-[#00507d] tracking-tight" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {getConfidencePercentage(primaryDetection.confidence)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#e2e7ff] rounded-full overflow-hidden border border-[#c0c7d1]/40">
                      <div className="h-full bg-[#0369a1] rounded-full" style={{ width: `${getConfidencePercentage(primaryDetection.confidence)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Detection Timestamp */}
                <div className="mt-3 p-2 bg-[#f0f9ff] rounded border border-[#c0c7d1]/40 flex items-center justify-end">
                  <div className="flex items-center gap-1 text-[#40474f] text-[12px] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>{new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Explainable Detection Section */}
          {primaryDetection?.evidence && (
            <div className="rounded-lg bg-[#f0f9ff]/70 border border-[#c0c7d1]/60 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#00507d]">psychology</span>
                <h3 className="text-[18px] font-semibold text-[#00507d] tracking-wide uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Why was this detected?</h3>
              </div>
              <p className="text-[12px] text-[#40474f]">
                Computed directly from the detected image region
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {primaryDetection.evidence.acoustic_contrast_ratio !== undefined && (
                  <div className="flex items-start gap-2 p-2 bg-white rounded border border-[#c0c7d1]/40">
                    <div>
                      <span className="text-[14px] font-semibold text-[#131b2e] block">Acoustic Contrast</span>
                      <p className="text-[12px] text-[#40474f] font-mono mt-0.5">{primaryDetection.evidence.acoustic_contrast_ratio}x</p>
                    </div>
                  </div>
                )}
                {primaryDetection.evidence.elongation_ratio !== undefined && (
                  <div className="flex items-start gap-2 p-2 bg-white rounded border border-[#c0c7d1]/40">
                    <div>
                      <span className="text-[14px] font-semibold text-[#131b2e] block">Shape Elongation</span>
                      <p className="text-[12px] text-[#40474f] font-mono mt-0.5">{primaryDetection.evidence.elongation_ratio}x</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Location Section */}
          {primaryDetection?.latitude !== undefined && primaryDetection?.longitude !== undefined && (
            <div className="rounded-lg bg-white border border-[#c0c7d1]/60 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1 border-b border-[#c0c7d1]/30 pb-1">
                <span className="material-symbols-outlined text-[#00507d]">location_on</span>
                <h3 className="text-[18px] font-semibold text-[#00507d] tracking-wide uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Location</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[14px] mt-1">
                <div className="flex flex-col space-y-1 bg-[#f0f9ff]/50 p-2 rounded border border-[#c0c7d1]/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#707881] uppercase tracking-wider">Latitude</span>
                    <span className="text-[#131b2e] font-semibold">{primaryDetection.latitude}° N</span>
                  </div>
                  <div className="flex justify-between items-center text-[#40474f] text-[12px]">
                    <span className="text-[11px] font-bold text-[#c0c7d1] uppercase tracking-wider">Datum</span>
                    <span>WGS84</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1 bg-[#f0f9ff]/50 p-2 rounded border border-[#c0c7d1]/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#707881] uppercase tracking-wider">Longitude</span>
                    <span className="text-[#131b2e] font-semibold">{primaryDetection.longitude}° E</span>
                  </div>
                  <div className="flex justify-between items-center text-[#40474f] text-[12px]">
                    <span className="text-[11px] font-bold text-[#c0c7d1] uppercase tracking-wider">CRS</span>
                    <span>EPSG:4326</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Centered Footer */}
      <footer className="w-full py-4 text-center">
        <p className="text-[12px] text-[#40474f]">All rights reserved to MarineVision ©2026</p>
      </footer>

    </div>
  );
}
