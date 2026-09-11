'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAnalysis } from '@/context/AnalysisContext';
import { getScanReport } from '@/lib/api/analysis';
import { ScanReport, Detection } from '@/types/analysis';

export function SonarReportPage({ scanId }: { scanId: string }) {
  const { currentFile, latitude: contextLat, longitude: contextLng } = useAnalysis();
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
        <div className="text-[#00507d] font-body-md animate-pulse">Loading report data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center gap-4">
        <div className="text-[#dc2626] font-body-md">Error: {error}</div>
        <Link href="/" className="px-4 py-2 bg-[#00507d] text-[#ffffff] rounded">Return to Home</Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center gap-4">
        <div className="text-[#475569] font-body-md">Report not found</div>
        <Link href="/" className="px-4 py-2 bg-[#00507d] text-[#ffffff] rounded">Return to Home</Link>
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

  const handleDownloadProgrammatic = async (format: 'json' | 'csv') => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/report/${scanId}?format=${format}`);
      if (!response.ok) throw new Error(`Failed to fetch ${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MarineVision_Report_${scanId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || (html2canvasModule as unknown as typeof html2canvasModule.default);
      const reportElement = document.getElementById('pdf-report-container');
      if (!reportElement) return;

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Since pdf-report-container is exactly A4 ratio (794x1123), it maps 1:1 perfectly
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MarineVision_Report_${scanId}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };
  const getPdfImageDimensions = () => {
    const maxWidth = 714; // 794 - 40px padding on each side
    const maxHeight = 480;
    const imgRatio = naturalSize.width / naturalSize.height;
    const containerRatio = maxWidth / maxHeight;
    
    if (imgRatio > containerRatio) {
      return { width: maxWidth, height: maxWidth / imgRatio };
    } else {
      return { width: maxHeight * imgRatio, height: maxHeight };
    }
  };

  const pdfImgDims = getPdfImageDimensions();

  return (
    <div id="report-container" className="min-h-screen text-[#131b2e] font-sans antialiased flex flex-col selection:bg-[#cde5ff] selection:text-[#001d32]" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 48%, #e0f2fe 100%)' }}>

      {/* Top Minimal Branding Header */}
      <header className="w-full bg-[#ffffffE6] backdrop-blur-md px-4 sm:px-8 py-2 h-14 sticky top-0 z-50 flex items-center justify-between shadow-sm border-b border-[#c0c7d166]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/marinevision-logo.png" alt="MarineVision" className="h-6 w-auto object-contain" />
          <span className="font-bold tracking-tight text-[#00507d] text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>MarineVision</span>
          <span className="hidden sm:inline-block w-px h-4 bg-[#c0c7d1]"></span>
          <span className="hidden sm:inline-block text-[12px] text-[#40474f] italic font-medium">See Beneath the Surface</span>
        </div>
      </header>

      {/* Main Centered Report Workspace */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 flex flex-col gap-6">

        <div className="mb-2" data-html2canvas-ignore="true">
          <Link href="/analysis/upload?reset=true" className="inline-flex items-center gap-1 text-[#00507d] hover:text-[#0369a1] font-medium transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Upload
          </Link>
        </div>

        <div className="bg-[#ffffffF2] backdrop-blur-md rounded-xl border border-[#cde5ff99] shadow-lg p-8 flex flex-col gap-6">

          {/* 1. Report Workspace Header & Download Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#c0c7d166] gap-3">
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-[28px] font-semibold text-[#00507d] tracking-tight leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>REPORT</h1>
              </div>
              <p className="text-[12px] text-[#40474f] mt-1">Inspection Anomaly Analysis & Acoustic Classification</p>
            </div>

            <div className="flex flex-wrap sm:flex-row sm:items-center gap-2" data-html2canvas-ignore="true">
              <button
                onClick={() => handleDownloadProgrammatic('csv')}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 h-10 bg-white border border-[#c0c7d1] hover:bg-[#eaedff] text-[#131b2e] text-[13px] font-medium rounded transition-all shadow-sm"
              >
                <span>Download CSV</span>
              </button>
              <button
                onClick={() => handleDownloadProgrammatic('json')}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 h-10 bg-white border border-[#c0c7d1] hover:bg-[#eaedff] text-[#131b2e] text-[13px] font-medium rounded transition-all shadow-sm"
              >
                <span>Download JSON</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="inline-flex items-center justify-center gap-1 px-4 py-1.5 h-10 bg-[#00507d] hover:bg-[#0369a1] text-white text-[13px] font-medium rounded transition-all shadow-sm"
              >
                <span>Download Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Sonar Image with Bounding Box */}
            <div className="lg:col-span-7 flex flex-col rounded border border-[#c0c7d1] overflow-hidden bg-white">
              <div className="relative w-full bg-[#0f172a] flex items-center justify-center overflow-hidden min-h-80">
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
                    {primaryDetection && primaryDetection.bounding_box && (
                      <div
                        className="absolute border-2 border-[#fbbf24] bg-[#fbbf2426] rounded-sm flex flex-col justify-between p-1 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                        style={{
                          left: `${(primaryDetection.bounding_box.x / naturalSize.width) * 100}%`,
                          top: `${(primaryDetection.bounding_box.y / naturalSize.height) * 100}%`,
                          width: `${(primaryDetection.bounding_box.width / naturalSize.width) * 100}%`,
                          height: `${(primaryDetection.bounding_box.height / naturalSize.height) * 100}%`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="bg-[#fbbf24] text-[#020617] font-mono text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-wide uppercase truncate max-w-[70%]">
                            {primaryDetection.classification.replace(/-/g, ' ')}
                          </span>
                          <span className="bg-[#020617CC] text-[#fcd34d] border border-[#fbbf2480] font-mono text-[10px] px-1 py-0.5 rounded-sm shrink-0">
                            {getConfidencePercentage(primaryDetection.confidence)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#94a3b8] p-8">
                    <span className="material-symbols-outlined text-[48px] opacity-30 mb-2">image_not_supported</span>
                    <p className="text-sm">Image unavailable</p>
                  </div>
                )}

                {/* Port / Starboard Water Column Technical Dividers */}
                {imageUrl && (
                  <>
                    <div className="absolute inset-0 pointer-events-none flex justify-between px-2 py-1 text-[#ffffff99] font-mono text-[11px] font-bold">
                      <div className="flex items-center gap-1 bg-[#ffffff1a] px-1 rounded backdrop-blur-sm h-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#89f5e7]"></span>
                        <span>PORT WATER COLUMN</span>
                      </div>
                      <div className="flex items-center gap-1 bg-[#ffffff1a] px-1 rounded backdrop-blur-sm h-fit">
                        <span>STARBOARD WATER COLUMN</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#89f5e7]"></span>
                      </div>
                    </div>
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px border-r border-dashed border-[#7dd3fc66] pointer-events-none"></div>
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
                      {primaryDetection ? primaryDetection.classification.replace(/-/g, ' ') : 'NO OBJECT DETECTED'}
                    </h2>
                  </div>
                  {/* Severity Badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border font-mono text-[11px] font-bold uppercase shrink-0
                    ${!primaryDetection ? 'bg-[#f8fafc] border-[#cbd5e1] text-[#64748b]' :
                      primaryDetection.severity.toUpperCase() === 'HIGH' ? 'bg-[#fef2f2] border-[#ef4444] text-[#7f1d1d]' : 'bg-[#fffbeb] border-[#f59e0b] text-[#78350f]'}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${!primaryDetection ? 'bg-[#94a3b8]' : primaryDetection.severity.toUpperCase() === 'HIGH' ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'}`}></span>
                    {primaryDetection ? primaryDetection.severity : 'N/A'}
                  </span>
                </div>

                {/* Confidence Metric */}
                <div className="pt-2 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[11px] font-bold tracking-wider text-[#707881] uppercase">Confidence Score</span>
                    <span className="text-[24px] font-bold text-[#00507d] tracking-tight" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {primaryDetection ? getConfidencePercentage(primaryDetection.confidence) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#e2e7ff] rounded-full overflow-hidden border border-[#c0c7d166]">
                    <div className="h-full bg-[#0369a1] rounded-full" style={{ width: `${primaryDetection ? getConfidencePercentage(primaryDetection.confidence) : 0}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Detection Timestamp */}
              <div className="mt-3 p-2 bg-[#f0f9ff] rounded border border-[#c0c7d166] flex items-center justify-end">
                <div className="flex items-center gap-1 text-[#40474f] text-[12px] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>{new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short', hour12: false }).replace(',', '')} IST</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Explainable Detection Section */}
          <div className="rounded-lg bg-[#f0f9ffB3] border border-[#c0c7d199] p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <h3 className="text-[18px] font-semibold text-[#00507d] tracking-wide uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Why was this detected?</h3>
            </div>
            {primaryDetection?.evidence ? (
              <>
                <p className="text-[12px] text-[#40474f]">
                  Computed directly from the detected image region
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {primaryDetection.evidence.acoustic_contrast_ratio !== undefined && (
                    <div className="flex items-start gap-2 p-2 bg-white rounded border border-[#c0c7d166]">
                      <div>
                        <span className="text-[14px] font-semibold text-[#131b2e] block">Acoustic Contrast</span>
                        <p className="text-[12px] text-[#40474f] font-mono mt-0.5">{primaryDetection.evidence.acoustic_contrast_ratio}x</p>
                      </div>
                    </div>
                  )}
                  {primaryDetection.evidence.elongation_ratio !== undefined && (
                    <div className="flex items-start gap-2 p-2 bg-white rounded border border-[#c0c7d166]">
                      <div>
                        <span className="text-[14px] font-semibold text-[#131b2e] block">Shape Elongation</span>
                        <p className="text-[12px] text-[#40474f] font-mono mt-0.5">{primaryDetection.evidence.elongation_ratio}x</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[14px] text-[#40474f] italic py-2">
                No target-specific evidence available for this scan.
              </p>
            )}
          </div>

          {/* 4. Location Section */}
          {(primaryDetection?.latitude !== undefined || contextLat !== undefined) && (primaryDetection?.longitude !== undefined || contextLng !== undefined) && (
            <div className="rounded-lg bg-white border border-[#c0c7d199] p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1 border-b border-[#c0c7d14D] pb-1">
                <span className="material-symbols-outlined text-[#00507d]">location_on</span>
                <h3 className="text-[18px] font-semibold text-[#00507d] tracking-wide uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Location</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[14px] mt-1">
                <div className="flex flex-col space-y-1 bg-[#f0f9ff80] p-2 rounded border border-[#c0c7d14D]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#707881] uppercase tracking-wider">Latitude</span>
                    <span className="text-[#131b2e] font-semibold">{primaryDetection?.latitude ?? contextLat}° N</span>
                  </div>
                  <div className="flex justify-between items-center text-[#40474f] text-[12px]">
                    <span className="text-[11px] font-bold text-[#c0c7d1] uppercase tracking-wider">Datum</span>
                    <span>WGS84</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-1 bg-[#f0f9ff80] p-2 rounded border border-[#c0c7d14D]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#707881] uppercase tracking-wider">Longitude</span>
                    <span className="text-[#131b2e] font-semibold">{primaryDetection?.longitude ?? contextLng}° E</span>
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

      {/* Hidden A4 Dedicated PDF Container */}
      <div 
        id="pdf-report-container" 
        className="absolute top-[-9999px] left-[-9999px] w-198.5 h-280.75 bg-[#ffffff] flex flex-col p-10 box-border overflow-hidden"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#131b2e' }}
      >
        {/* Branding & Header */}
        <div className="flex flex-col items-center justify-center border-b border-[#c0c7d166] pb-4 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/marinevision-logo.png" alt="MarineVision" className="h-10 w-auto object-contain mb-2" />
          <span className="font-bold tracking-tight text-[#00507d] text-3xl uppercase">MarineVision</span>
        </div>
        
        <h1 className="text-center text-xl font-bold text-[#00507d] tracking-widest mb-4">SONAR ANALYSIS REPORT</h1>

        {/* Dynamic Image Container */}
        <div className="flex items-center justify-center bg-[#0f172a] rounded overflow-hidden mb-6 w-full shrink-0" style={{ height: '480px' }}>
          {imageUrl ? (
            <div 
              className="relative" 
              style={{ width: `${pdfImgDims.width}px`, height: `${pdfImgDims.height}px` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Sonar" className="absolute inset-0 w-full h-full object-contain" />
              {/* Bounding Box Overlay */}
              {primaryDetection && primaryDetection.bounding_box && (
                <div
                  className="absolute border-[3px] border-[#fbbf24] bg-[#fbbf2426] rounded-sm"
                  style={{
                    left: `${(primaryDetection.bounding_box.x / naturalSize.width) * 100}%`,
                    top: `${(primaryDetection.bounding_box.y / naturalSize.height) * 100}%`,
                    width: `${(primaryDetection.bounding_box.width / naturalSize.width) * 100}%`,
                    height: `${(primaryDetection.bounding_box.height / naturalSize.height) * 100}%`,
                  }}
                >
                </div>
              )}
            </div>
          ) : (
            <div className="text-[#94a3b8] text-sm font-sans">Image unavailable</div>
          )}
        </div>

        {/* Report Info */}
        <div className="flex flex-col gap-4 shrink-0 font-sans">
          <div className="bg-[#f8fafc] border border-[#c0c7d166] rounded p-4">
            <h2 className="text-[#00507d] font-bold text-sm border-b border-[#c0c7d166] pb-2 mb-3 tracking-wider">ANALYSIS INFORMATION</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div><span className="font-bold text-[#40474f]">Scan ID:</span> <span className="text-[#131b2e] font-mono">{scanId}</span></div>
              <div><span className="font-bold text-[#40474f]">Identified Target:</span> <span className="text-[#131b2e] uppercase font-mono">{primaryDetection ? primaryDetection.classification.replace(/-/g, ' ') : 'NO OBJECT DETECTED'}</span></div>
              <div><span className="font-bold text-[#40474f]">Confidence:</span> <span className="text-[#131b2e] font-mono">{primaryDetection ? getConfidencePercentage(primaryDetection.confidence) : 0}%</span></div>
              <div><span className="font-bold text-[#40474f]">Severity:</span> <span className={`font-bold font-mono ${!primaryDetection ? 'text-[#64748b]' : primaryDetection.severity.toUpperCase() === 'HIGH' ? 'text-[#dc2626]' : 'text-[#d97706]'}`}>{primaryDetection ? primaryDetection.severity : 'N/A'}</span></div>
              <div><span className="font-bold text-[#40474f]">Latitude:</span> <span className="text-[#131b2e] font-mono">{primaryDetection?.latitude ?? contextLat ?? 'N/A'}</span></div>
              <div><span className="font-bold text-[#40474f]">Longitude:</span> <span className="text-[#131b2e] font-mono">{primaryDetection?.longitude ?? contextLng ?? 'N/A'}</span></div>
            </div>
          </div>

          {primaryDetection && primaryDetection.evidence && (
            <div className="bg-[#f8fafc] border border-[#c0c7d166] rounded p-4">
              <h2 className="text-[#00507d] font-bold text-sm border-b border-[#c0c7d166] pb-2 mb-3 tracking-wider">DETECTION EVIDENCE</h2>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {primaryDetection.evidence.acoustic_contrast_ratio !== undefined && (
                  <div><span className="font-bold text-[#40474f]">Acoustic Contrast:</span> <span className="text-[#131b2e] font-mono">{primaryDetection.evidence.acoustic_contrast_ratio}x</span></div>
                )}
                {primaryDetection.evidence.elongation_ratio !== undefined && (
                  <div><span className="font-bold text-[#40474f]">Elongation Ratio:</span> <span className="text-[#131b2e] font-mono">{primaryDetection.evidence.elongation_ratio}x</span></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto text-center border-t border-[#c0c7d166] pt-4">
          <p className="text-[11px] text-[#40474f] font-sans">MarineVision • AI-Powered Marine Intelligence</p>
        </div>
      </div>
    </div>
  );
}
