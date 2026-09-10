'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnalysisContextType {
  currentFile: File | null;
  setCurrentFile: (file: File | null) => void;
  latitude?: number;
  setLatitude: (lat?: number) => void;
  longitude?: number;
  setLongitude: (lng?: number) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  return (
    <AnalysisContext.Provider value={{ 
      currentFile, setCurrentFile,
      latitude, setLatitude,
      longitude, setLongitude
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
