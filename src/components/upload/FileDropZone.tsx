"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileJson, AlertCircle, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileContent {
  packageJson?: string;
  lockfile?: string;
}

interface FileDropZoneProps {
  onFileRead: (content: string, filename: string) => void;
  onFilesRead?: (files: FileContent) => void;
  disabled?: boolean;
  acceptLockfile?: boolean;
}

export function FileDropZone({ 
  onFileRead, 
  onFilesRead,
  disabled,
  acceptLockfile = true 
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    packageJson: boolean;
    lockfile: boolean;
  }>({ packageJson: false, lockfile: false });
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFiles = useRef<FileContent>({});

  const processFile = useCallback(
    (file: File) => {
      const isPackageJson = file.name === "package.json";
      const isLockfile = file.name === "package-lock.json";
      
      if (!isPackageJson && !isLockfile) {
        setError("Please upload package.json or package-lock.json files.");
        return;
      }

      if (isLockfile && !acceptLockfile) {
        setError("Lockfile support not enabled.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          if (isPackageJson) {
            pendingFiles.current.packageJson = content;
            setUploadedFiles(prev => ({ ...prev, packageJson: true }));
            // For backward compatibility
            onFileRead(content, file.name);
          } else if (isLockfile) {
            pendingFiles.current.lockfile = content;
            setUploadedFiles(prev => ({ ...prev, lockfile: true }));
            onFileRead(content, file.name);
          }
          
          // If we have onFilesRead callback and files pending, call it
          if (onFilesRead && (pendingFiles.current.packageJson || pendingFiles.current.lockfile)) {
            onFilesRead(pendingFiles.current);
          }
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };
      reader.readAsText(file);
    },
    [onFileRead, onFilesRead, acceptLockfile]
  );

  // Single file handler (used by legacy code paths)
  const _handleFile = useCallback(
    (file: File) => {
      setError(null);
      processFile(file);
    },
    [processFile]
  );
  void _handleFile; // Available for single-file upload flows

  const handleFiles = useCallback(
    (files: FileList) => {
      setError(null);
      pendingFiles.current = {};
      setUploadedFiles({ packageJson: false, lockfile: false });
      
      for (let i = 0; i < files.length; i++) {
        processFile(files[i]);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
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
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
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
                ? "Drop your files here"
                : "Drop package.json here"}
            </p>
            <p className="font-mono text-xs text-phosphor-dim mt-1">
              {acceptLockfile 
                ? "Optionally include package-lock.json for transitive deps"
                : "or click to browse"}
            </p>
          </div>

          {/* File status indicators */}
          {(uploadedFiles.packageJson || uploadedFiles.lockfile) && (
            <div className="flex items-center gap-4 mt-2">
              {uploadedFiles.packageJson && (
                <div className="flex items-center gap-1.5 text-phosphor font-mono text-xs">
                  <FileJson className="h-3.5 w-3.5" />
                  <span>package.json</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              {uploadedFiles.lockfile && (
                <div className="flex items-center gap-1.5 text-phosphor font-mono text-xs">
                  <Lock className="h-3.5 w-3.5" />
                  <span>package-lock.json</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".json"
            multiple={acceptLockfile}
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload package.json and optionally package-lock.json files"
          />
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-danger font-mono text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {acceptLockfile && (
        <p className="mt-3 font-mono text-[10px] text-phosphor-dim/40 text-center">
          Tip: Upload both files together for full transitive dependency analysis
        </p>
      )}
    </div>
  );
}
