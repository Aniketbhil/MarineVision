'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { get, set } from 'idb-keyval';

interface AnalysisContextType {
  currentFile: File | null;
  setCurrentFile: (file: File | null) => void;
  latitude?: number;
  setLatitude: (lat?: number) => void;
  longitude?: number;
  setLongitude: (lng?: number) => void;
  isHydrated: boolean;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [currentFile, setCurrentFileState] = useState<File | null>(null);
  const [latitude, setLatitudeState] = useState<number | undefined>(undefined);
  const [longitude, setLongitudeState] = useState<number | undefined>(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function hydrate() {
      try {
        const file = await get('marinevision_current_file');
        const lat = await get('marinevision_latitude');
        const lng = await get('marinevision_longitude');
        if (file) setCurrentFileState(file);
        if (lat !== undefined) setLatitudeState(lat);
        if (lng !== undefined) setLongitudeState(lng);
      } catch (err) {
        console.error("Failed to hydrate AnalysisContext from IndexedDB", err);
      } finally {
        setIsHydrated(true);
      }
    }
    hydrate();
  }, []);

  const setCurrentFile = useCallback((file: File | null) => {
    setCurrentFileState(file);
    if (file) set('marinevision_current_file', file).catch(console.error);
    else set('marinevision_current_file', null).catch(console.error);
  }, []);

  const setLatitude = useCallback((lat?: number) => {
    setLatitudeState(lat);
    set('marinevision_latitude', lat).catch(console.error);
  }, []);

  const setLongitude = useCallback((lng?: number) => {
    setLongitudeState(lng);
    set('marinevision_longitude', lng).catch(console.error);
  }, []);

  return (
    <AnalysisContext.Provider value={{ 
      currentFile, setCurrentFile,
      latitude, setLatitude,
      longitude, setLongitude,
      isHydrated
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
