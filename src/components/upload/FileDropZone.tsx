"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileJson, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFileRead: (content: string) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFileRead, disabled }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith(".json")) {
        setError("Please upload a .json file.");
        return;
      }

      if (file.size > 1024 * 1024) {
        setError("File too large. Maximum size is 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          onFileRead(content);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };
      reader.readAsText(file);
    },
    [onFileRead]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        {/* HUD corner brackets */}
        <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-phosphor pointer-events-none" />
        <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-phosphor pointer-events-none" />
        <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-phosphor pointer-events-none" />
        <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-phosphor pointer-events-none" />

        <button
          type="button"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={disabled}
          className={cn(
            "relative w-full border-2 border-dashed p-12 transition-all duration-300 cursor-pointer group",
            "flex flex-col items-center gap-4",
            isDragOver
              ? "border-phosphor bg-phosphor/5 border-glow-strong"
              : "border-phosphor-dim/50 hover:border-phosphor/70 hover:bg-phosphor/[0.02] animate-pulse-glow",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div
            className={cn(
              "p-4 border border-phosphor-dim/30 transition-all",
              isDragOver
                ? "border-phosphor border-glow text-phosphor"
                : "text-phosphor-dim group-hover:text-phosphor group-hover:border-phosphor/50"
            )}
          >
            {isDragOver ? (
              <FileJson className="h-8 w-8" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
          </div>

          <div className="text-center">
            <p className="font-mono text-sm text-phosphor">
              {isDragOver
                ? "Drop your file here"
                : "Drop your package.json here"}
            </p>
            <p className="font-mono text-xs text-phosphor-dim mt-1">
              or click to browse
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".json"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload package.json file"
          />
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-danger font-mono text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
