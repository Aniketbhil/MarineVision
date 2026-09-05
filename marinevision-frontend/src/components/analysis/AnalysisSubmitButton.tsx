"use client";

import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export interface AnalysisSubmitButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function AnalysisSubmitButton({
  onClick,
  disabled,
  isLoading,
}: AnalysisSubmitButtonProps) {
  return (
    <div className="pt-2 flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className="w-full sm:w-auto min-w-70 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-sky-600/30 hover:shadow-sky-600/40 active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {isLoading ? (
          <>
            <span>Analyzing...</span>
            <Loader2 className="w-4 h-4 animate-spin ml-2" strokeWidth={2.5} />
          </>
        ) : (
          <>
            <span>Start Analysis</span>
            <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </>
        )}
      </button>
    </div>
  );
}
