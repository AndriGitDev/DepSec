"use client";

import { FileJson } from "lucide-react";
import { samplePackageJson } from "@/lib/data/samplePackageJson";

interface SampleLoaderProps {
  onLoad: (content: string) => void;
  disabled?: boolean;
}

export function SampleLoader({ onLoad, disabled }: SampleLoaderProps) {
  return (
    <button
      type="button"
      onClick={() => onLoad(samplePackageJson)}
      disabled={disabled}
      className="inline-flex items-center gap-2 font-mono text-xs text-phosphor-dim hover:text-phosphor transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <FileJson className="h-3.5 w-3.5" />
      <span className="border-b border-phosphor-dim/30 group-hover:border-phosphor/50 transition-colors">
        Try with a sample package.json
      </span>
    </button>
  );
}
