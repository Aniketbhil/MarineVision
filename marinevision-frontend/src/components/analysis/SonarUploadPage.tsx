"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Waves } from "lucide-react";
import { SonarUploadDropzone } from "./SonarUploadDropzone";
import { DeploymentCoordinates } from "./DeploymentCoordinates";
import { AnalysisSubmitButton } from "./AnalysisSubmitButton";
import { Coordinates } from "@/types/analysis";
import { analyzeSonarImage } from "@/lib/api/analysis";

export function SonarUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates>({});
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const response = await analyzeSonarImage({ file, coordinates });
      
      // Phase 4 Success Handling:
      // Since there is no Results UI yet, we will just show a success message
      // and preserve the scan_id for future phases.
      const scanId = response.scan_id || "UNKNOWN_SCAN_ID";
      console.log("Analysis Successful. Scan ID:", scanId, response);
      
      // We could store it in localStorage if needed for Phase 5.
      if (typeof window !== "undefined") {
        localStorage.setItem("last_scan_id", scanId);
      }

      setSuccessMessage(`Analysis successfully submitted. Scan ID: ${scanId}`);
      // Clear file after successful upload so it's ready for another
      setFile(null);
      setCoordinates({});
    } catch (err) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("An unexpected error occurred during analysis.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen text-slate-800 font-sans antialiased overflow-x-hidden flex flex-col justify-between selection:bg-cyan-200 selection:text-slate-900" 
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 55%, #e0f2fe 100%)' }}
    >
      {/* Ambient Deep Water Layer */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Caustic Light Overlay */}
        <div className="absolute inset-0 mix-blend-screen" style={{ background: 'radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.4) 60%, rgba(224, 242, 254, 0.6) 100%)', opacity: 0.6 }}></div>
        {/* Soft Marine Sunbeam Radial Highlight */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-250 h-150 bg-white/40 blur-3xl rounded-full"></div>
      </div>

      {/* Minimal Top Navigation Header */}
      <header className="relative z-20 w-full pt-6 pb-2 px-6 sm:px-10 flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-sky-700 transition-colors duration-200 px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/60 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 transform transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
          <span>Back to Mode Selection</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-slate-800">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-700"></span>
            </div>
            <span className="font-bold tracking-tight text-sm text-slate-900">Marine<span className="text-sky-700">Vision</span></span>
          </div>
        </div>
      </header>

      {/* Main Screen Workspace */}
      <main className="relative z-10 w-full grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <section className="w-full bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(2,132,199,0.18)] p-6 sm:p-9 transition-all duration-300 hover:shadow-[0_25px_70px_-12px_rgba(2,132,199,0.24)] max-w-5xl sm:px-10">
          
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/70 border border-sky-200 text-sky-700 text-[11px] font-mono uppercase tracking-widest font-semibold mb-2.5">
              <Waves className="w-3 h-3 text-sky-700 animate-pulse" strokeWidth={2} />
              Acoustic Ingestion Pipeline
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Sonar Analysis / Upload
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
              Upload Side-Scan Sonar (SSS) imagery and set geographic coordinates to detect underwater debris.
            </p>
          </div>

          <div className="space-y-6">
            <SonarUploadDropzone
              selectedFile={file}
              onFileSelect={setFile}
              error={error}
              setError={setError}
            />

            <DeploymentCoordinates
              coordinates={coordinates}
              setCoordinates={setCoordinates}
            />

            {/* API Error / Success Messages */}
            {apiError && (
              <div className="w-full mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center shadow-sm">
                {apiError}
              </div>
            )}
            
            {successMessage && (
              <div className="w-full mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium text-center shadow-sm">
                {successMessage}
              </div>
            )}

            <AnalysisSubmitButton
              onClick={handleSubmit}
              disabled={!file || error !== null}
              isLoading={isLoading}
            />
          </div>
          
        </section>
      </main>

      {/* Minimal Footer Note */}
      <footer className="relative z-10 w-full py-4 px-6 text-center">
        <p className="text-[11px] sm:text-xs text-slate-600/80 font-medium tracking-wide">
          All rights reserved to MarineVision ©2026
        </p>
      </footer>
    </div>
  );
}
