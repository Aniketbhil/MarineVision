"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Radio, RefreshCw, Activity, CheckCircle, Disc, Bell } from "lucide-react";
import { AnalysisModeCard } from "./AnalysisModeCard";

export function AnalysisModeSelector() {
  const router = useRouter();

  const handleManualAnalysisClick = () => {
    router.push("/analysis/upload");
  };

  const manualFeatures = [
    {
      title: "SSS Image Upload",
      description: ".XTF, .JSF, .TIFF, .PNG formats supported",
    },
    {
      title: "AI Detection",
      description: "MarineDebris-YOLOv8 deep neural architecture",
    },
    {
      title: "Confidence Scoring",
      description: "Multi-class bounding box & evidence breakdown",
    },
    {
      title: "Geotagged Coordinates",
      description: "Bathymetric positioning & hydrographic charts",
    },
    {
      title: "Standardized Export",
      description: "Structured JSON / CSV / Archival survey reports",
    },
  ];

  const liveFeatures = [
    {
      title: "Continuous Sonar Stream Ingestion",
      description: "Real-time UDP/RTSP acoustic packet parser",
      icon: <RefreshCw className="w-4 h-4" />,
    },
    {
      title: "Real-time Acoustic Waterfall Detection",
      description: "On-the-fly anomaly segmentation window",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      title: "Active Mission Monitoring",
      description: "Vessel track telemetry synchronization",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      title: "Stream Pause / Resume Buffer",
      description: "Low-latency tactical ring-buffer inspect",
      icon: <Disc className="w-4 h-4" />,
    },
    {
      title: "Real-time Acoustic Operator Alerts",
      description: "Threshold audio-visual warning signals",
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-6 px-4 pb-20 z-10">
      <AnalysisModeCard
        title="Manual Analysis"
        modeLabel="MOD-01"
        description="Upload Side-Scan Sonar imagery and analyze potential underwater anomalies with AI."
        features={manualFeatures}
        ctaText="Start Manual Analysis"
        ctaAction={handleManualAnalysisClick}
        isActive={true}
        headerIcon={<CloudUpload className="w-6 h-6" />}
      />

      <AnalysisModeCard
        title="Live Analysis"
        modeLabel="MOD-02"
        description="Continuously analyze live sonar streams from underwater survey missions."
        features={liveFeatures}
        ctaText="Coming Soon"
        isActive={false}
        headerIcon={<Radio className="w-6 h-6" />}
      />
    </div>
  );
}
