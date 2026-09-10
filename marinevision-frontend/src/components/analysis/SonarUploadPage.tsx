'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/context/AnalysisContext';
import Link from 'next/link';

export function SonarUploadPage() {
  const { currentFile, setCurrentFile, latitude, setLatitude, longitude, setLongitude } = useAnalysis();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentFile) {
      setIsLoading(true);
      router.push('/analysis/report/processing');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError("File size exceeds 100MB limit.");
      } else {
        setError(null);
        setCurrentFile(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError("File size exceeds 100MB limit.");
      } else {
        setError(null);
        setCurrentFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="relative min-h-screen text-slate-800 font-sans antialiased overflow-x-hidden flex flex-col justify-between selection:bg-cyan-200 selection:text-slate-900" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 55%, #e0f2fe 100%)' }}>
      {/* Ambient Deep Water Layer */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 mix-blend-screen" style={{ background: 'radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.4) 60%, rgba(224, 242, 254, 0.6) 100%)', opacity: 0.6 }}></div>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-250 h-150 bg-white/40 blur-3xl rounded-full"></div>
      </div>

      <header className="relative z-20 w-full pt-6 pb-2 px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-sky-700 transition-colors duration-200 px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/60 shadow-sm">
          <svg className="w-3.5 h-3.5 transform transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Back to Mode Selection</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/marinevision-logo.png" alt="MarineVision Logo" className="h-4 w-auto object-contain" />
            <span className="font-bold tracking-tight text-sm text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Marine<span className="text-sky-700">Vision</span></span>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <section className="w-full bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(2,132,199,0.18)] p-6 sm:p-9 transition-all duration-300 hover:shadow-[0_25px_70px_-12px_rgba(2,132,199,0.24)] max-w-5xl sm:px-10">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/70 border border-sky-200 text-sky-700 text-[11px] font-mono uppercase tracking-widest font-semibold mb-2.5">
              <svg className="w-3 h-3 text-sky-700 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              Acoustic Ingestion Pipeline
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Sonar Analysis / Upload
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
              Upload Side-Scan Sonar (SSS) imagery and set geographic coordinates to detect underwater debris.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleStartAnalysis}>
            <div 
              className="group relative rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-600 bg-sky-50/50 hover:bg-sky-50/90 transition-all duration-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-inner py-4"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input accept=".xtf,.jsf,.tiff,.tif,.png,.jpg,.jpeg" className="sr-only" type="file" ref={fileInputRef} onChange={handleFileChange} />
              
              {!currentFile ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-110 group-hover:shadow-lg transition-transform duration-200 mb-3">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
                    Drag and Drop SSS Image
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Drop raw acoustic waterfall or sidescan raster file here
                  </p>
                  <div className="mt-4">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sky-700 font-semibold text-xs uppercase tracking-wider border border-sky-200 shadow-sm hover:border-sky-700 hover:bg-sky-50/60 focus:outline-none focus:ring-2 focus:ring-sky-600 transition-all" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      [ Upload Sonar Image ]
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3 font-mono">
                    Supports .XTF, .JSF, .TIFF, .PNG, .JPG (Max 100MB)
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-mono border border-emerald-300 font-medium mb-3">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span className="truncate max-w-50">{currentFile.name}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrentFile(null); }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold underline"
                  >
                    Remove File
                  </button>
                </>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center font-semibold">{error}</div>
            )}

            <div className="bg-white/80 rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deployment Coordinates</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5 font-mono">Latitude :</label>
                  <div className="relative rounded-xl shadow-sm">
                    <input className="block w-full rounded-xl border border-sky-200 bg-white/95 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:ring-sky-600 transition-colors" placeholder="e.g. 20.593684° N" type="number" step="any" value={latitude || ''} onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : undefined)} />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-mono">LAT</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5 font-mono">Longitude :</label>
                  <div className="relative rounded-xl shadow-sm">
                    <input className="block w-full rounded-xl border border-sky-200 bg-white/95 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:ring-sky-600 transition-colors" placeholder="e.g. 78.962880° E" type="number" step="any" value={longitude || ''} onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : undefined)} />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-mono">LON</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col items-center">
              <button disabled={!currentFile || isLoading} className="w-full sm:w-auto min-w-70 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-sky-600/30 hover:shadow-sky-600/40 active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed" type="submit">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Ingesting Sonar Matrix...</span>
                  </>
                ) : (
                  <>
                    <span>Start Analysis</span>
                    <svg className="w-4 h-4 transform transition-transform hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="relative z-10 w-full py-4 px-6 text-center">
        <p className="text-[11px] sm:text-xs text-slate-600/80 font-medium tracking-wide">
          All rights reserved to MarineVision ©2026
        </p>
      </footer>
    </div>
  );
}
