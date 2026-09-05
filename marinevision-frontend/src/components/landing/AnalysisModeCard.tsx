import React from "react";
import { ArrowRight, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FeatureItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export interface AnalysisModeCardProps {
  title: string;
  modeLabel: string;
  description: string;
  features: FeatureItem[];
  ctaText: string;
  ctaAction?: () => void;
  isActive?: boolean;
  headerIcon: React.ReactNode;
}

export function AnalysisModeCard({
  title,
  modeLabel,
  description,
  features,
  ctaText,
  ctaAction,
  isActive = false,
  headerIcon,
}: AnalysisModeCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col w-full max-w-105 rounded-2xl bg-white/90 backdrop-blur-md border border-white/50 p-6 md:p-8 shadow-xl transition-all duration-300",
        isActive ? "opacity-100" : "opacity-80 hover:opacity-90"
      )}
    >
      {/* Header Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
          isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
        )}
      >
        {headerIcon}
      </div>

      {/* Title & Mode Label */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <span className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 rounded border border-slate-200">
          {modeLabel}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-8 leading-relaxed h-15">
        {description}
      </p>

      {/* Features List */}
      <div className="flex-1 flex flex-col space-y-5 mb-8">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start">
            <div className="mt-0.5 mr-3 shrink-0">
              {isActive ? (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600">
                  <Check className="w-3 h-3 stroke-3" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-5 h-5 text-slate-400">
                  {feature.icon || <Check className="w-4 h-4" />}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                {feature.title}
              </h4>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 leading-snug">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      {isActive ? (
        <Button
          onClick={ctaAction}
          className="w-full bg-[#035b9c] hover:bg-[#024a80] text-white py-6 rounded-xl font-semibold shadow-md transition-all group"
        >
          {ctaText}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      ) : (
        <Button
          disabled
          className="w-full bg-slate-100/80 text-slate-400 py-6 rounded-xl font-semibold shadow-sm border border-slate-200 cursor-not-allowed"
        >
          <Lock className="w-4 h-4 mr-2 opacity-50" />
          {ctaText}
        </Button>
      )}
    </div>
  );
}
