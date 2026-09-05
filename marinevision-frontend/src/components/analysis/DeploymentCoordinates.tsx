"use client";

import React from "react";
import { Coordinates } from "@/types/analysis";

export interface DeploymentCoordinatesProps {
  coordinates: Coordinates;
  setCoordinates: (coords: Coordinates) => void;
}

export function DeploymentCoordinates({
  coordinates,
  setCoordinates,
}: DeploymentCoordinatesProps) {
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCoordinates({
      ...coordinates,
      latitude: val ? parseFloat(val) : undefined,
    });
  };

  const handleLonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCoordinates({
      ...coordinates,
      longitude: val ? parseFloat(val) : undefined,
    });
  };

  return (
    <div className="bg-white/80 rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-sm w-full mb-8" data-purpose="coordinate-inputs">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Deployment Coordinates
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Latitude */}
        <div>
          <label htmlFor="latitude" className="block text-xs font-medium text-slate-700 mb-1.5 font-mono">
            Latitude :
          </label>
          <div className="relative rounded-xl shadow-sm">
            <input
              id="latitude"
              type="number"
              step="any"
              placeholder="e.g. 20.593684° N"
              value={coordinates.latitude ?? ""}
              onChange={handleLatChange}
              className="block w-full rounded-xl border border-sky-200 bg-white/95 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-mono">
              LAT
            </div>
          </div>
        </div>

        {/* Longitude */}
        <div>
          <label htmlFor="longitude" className="block text-xs font-medium text-slate-700 mb-1.5 font-mono">
            Longitude :
          </label>
          <div className="relative rounded-xl shadow-sm">
            <input
              id="longitude"
              type="number"
              step="any"
              placeholder="e.g. 78.962880° E"
              value={coordinates.longitude ?? ""}
              onChange={handleLonChange}
              className="block w-full rounded-xl border border-sky-200 bg-white/95 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-mono">
              LON
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
