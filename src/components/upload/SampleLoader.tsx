"use client";

import { FileJson, GitBranch } from "lucide-react";
import { samplePackageJson } from "@/lib/data/samplePackageJson";
import { sampleLockfile } from "@/lib/data/sampleLockfile";

interface SampleLoaderProps {
  onLoad: (content: string) => void;
  onLoadWithLockfile?: (packageJson: string, lockfile: string) => void;
  disabled?: boolean;
}

export function SampleLoader({ onLoad, onLoadWithLockfile, disabled }: SampleLoaderProps) {
  const handleFullDemo = () => {
    if (onLoadWithLockfile) {
      onLoadWithLockfile(samplePackageJson, sampleLockfile);
    } else {
      onLoad(samplePackageJson);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onLoad(samplePackageJson)}
        disabled={disabled}
        className="inline-flex items-center gap-2 font-mono text-xs text-phosphor-dim hover:text-phosphor transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <FileJson className="h-3.5 w-3.5" />
        <span className="border-b border-phosphor-dim/30 group-hover:border-phosphor/50 transition-colors">
          Try sample package.json
        </span>
      </button>
      
      {onLoadWithLockfile && (
        <>
          <span className="text-phosphor-dim/30 text-xs">or</span>
          <button
            type="button"
            onClick={handleFullDemo}
            disabled={disabled}
            className="inline-flex items-center gap-2 font-mono text-xs text-phosphor hover:text-phosphor-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span className="border-b border-phosphor/50 group-hover:border-phosphor transition-colors">
              Full demo with transitive deps
            </span>
          </button>
        </>
      )}
    </div>
  );
}
