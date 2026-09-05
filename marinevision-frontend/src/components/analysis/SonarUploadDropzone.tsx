"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xtf", ".jsf", ".tiff", ".png", ".jpg", ".jpeg"];

export interface SonarUploadDropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export function SonarUploadDropzone({
  selectedFile,
  onFileSelect,
  error,
  setError,
}: SonarUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return false;
    }

    // Validate extension
    const fileName = file.name.toLowerCase();
    const isValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!isValidExtension) {
      setError(
        "Invalid file type. Supported formats: .XTF, .JSF, .TIFF, .PNG, .JPG"
      );
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    } else if (!file) {
      // User cancelled picker
    }
    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering click on dropzone
    onFileSelect(null);
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full" id="dropzone">
      <div
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative rounded-2xl border-2 border-dashed transition-all duration-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-inner py-4",
          isDragging
            ? "border-sky-700 bg-sky-100/70 scale-[1.01]"
            : error
            ? "border-red-400 bg-red-50/50 hover:bg-red-50"
            : selectedFile
            ? "border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/50"
            : "border-sky-300 hover:border-sky-600 bg-sky-50/50 hover:bg-sky-50/90"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".xtf,.jsf,.tiff,.png,.jpg,.jpeg"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
              <FileIcon className="w-7 h-7" strokeWidth={1.8} />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 transition-colors max-w-62.5 md:max-w-md truncate px-4">
              {selectedFile.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-6">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-medium z-10 h-8 text-xs rounded-xl"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Remove File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-110 group-hover:shadow-lg transition-transform duration-200 mb-3">
              <Upload className="w-7 h-7" strokeWidth={1.8} />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
              Drag and Drop SSS Image
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Drop raw acoustic waterfall or sidescan raster file here
            </p>
            
            <div className="mt-4">
              <button 
                type="button" 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sky-700 font-semibold text-xs uppercase tracking-wider border border-sky-200 shadow-sm hover:border-sky-700 hover:bg-sky-50/60 focus:outline-none focus:ring-2 focus:ring-sky-600 transition-all pointer-events-none"
              >
                <Upload className="w-4 h-4 text-sky-600" strokeWidth={2} />
                [ Upload Sonar Image ]
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-3 font-mono">
              Supports .XTF, .JSF, .TIFF, .PNG, .JPG (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center justify-center">
          {error}
        </div>
      )}
    </div>
  );
}
