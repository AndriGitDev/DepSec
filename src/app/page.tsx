"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  Shield,
  Terminal,
  AlertTriangle,
  Scale,
  Users,
  GitBranch,
} from "lucide-react";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { SampleLoader } from "@/components/upload/SampleLoader";
import { parsePackageJson } from "@/lib/parser/packageJsonParser";
import { useAnalysisStore } from "@/store/analysisStore";

const features = [
  { label: "Vulnerabilities", icon: AlertTriangle },
  { label: "License Risk", icon: Scale },
  { label: "Maintainer Health", icon: Users },
  { label: "Typosquatting", icon: Terminal },
  { label: "Dependency Graph", icon: GitBranch },
];

export default function Home() {
  const router = useRouter();
  const { setRawJson, setParsedPackage, setStatus, setError, status, reset } =
    useAnalysisStore();

  const handleFileContent = useCallback(
    (content: string) => {
      reset();
      setStatus("parsing");
      setRawJson(content);

      try {
        const parsed = parsePackageJson(content);
        setParsedPackage(parsed);
        setStatus("fetching");
        router.push("/results");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file.");
      }
    },
    [reset, setRawJson, setParsedPackage, setStatus, setError, router]
  );

  const isLoading = status === "parsing";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6 cyber-bg">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Terminal prompt */}
        <div className="animate-fade-slide-up font-mono text-[10px] tracking-[2px] text-phosphor-dim/40 mb-6">
          <span className="text-phosphor/60">$</span> depsec --analyze
          <span className="animate-cursor text-phosphor ml-0.5">_</span>
        </div>

        {/* Hero */}
        <div
          className="animate-fade-slide-up-slow mb-8"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          <div className="inline-flex items-center justify-center p-4 border border-phosphor-dim/30 border-glow mb-6">
            <Shield className="h-12 w-12 text-phosphor" />
          </div>

          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-[4px] uppercase text-phosphor glitch-text mb-4"
            data-text="DepSec"
          >
            DepSec
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6 h-6">
            <span className="font-mono text-sm text-phosphor-dim">
              <span className="text-phosphor mr-1">&gt;</span>
              <span className="typing-effect">
                Dependency Security Analyzer
              </span>
            </span>
          </div>
        </div>

        {/* Description */}
        <div
          className="animate-fade-slide-up"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          <p className="font-sans text-base text-phosphor-dim max-w-md mx-auto leading-relaxed mb-8">
            Upload your package.json to analyze vulnerabilities, license risks,
            maintainer health, and get a security score from 0 to 100.
          </p>
        </div>

        {/* Terminal separator */}
        <div
          className="animate-fade-slide-up"
          style={{ animationDelay: "0.7s", opacity: 0 }}
        >
          <div className="flex items-center gap-3 max-w-xl mx-auto mb-8">
            <div className="flex-1 h-px bg-phosphor-dim/20" />
            <span className="font-mono text-[10px] text-phosphor-dim/40 tracking-[2px]">
              SYS.READY
            </span>
            <div className="flex-1 h-px bg-phosphor-dim/20" />
          </div>
        </div>

        {/* Upload */}
        <div
          className="animate-fade-slide-up-slow"
          style={{ animationDelay: "0.9s", opacity: 0 }}
        >
          <FileDropZone onFileRead={handleFileContent} disabled={isLoading} />
        </div>

        {/* Sample */}
        <div
          className="mt-6 animate-fade-slide-up"
          style={{ animationDelay: "1.1s", opacity: 0 }}
        >
          <SampleLoader onLoad={handleFileContent} disabled={isLoading} />
        </div>

        {/* Error */}
        {status === "error" && (
          <div className="mt-6 p-4 border border-danger/50 bg-danger/5 font-mono text-xs text-danger">
            <p>{useAnalysisStore.getState().error}</p>
          </div>
        )}

        {/* Feature tags */}
        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-4 animate-fade-slide-up"
          style={{ animationDelay: "1.4s", opacity: 0 }}
        >
          {features.map((feature) => (
            <span
              key={feature.label}
              className="inline-flex items-center gap-1.5 font-mono text-xs tracking-[1.5px] uppercase text-phosphor-dim/80 border border-phosphor-dim/30 px-3 py-1.5 transition-all duration-300 hover:text-phosphor hover:border-phosphor/50 hover:border-glow"
            >
              <feature.icon className="h-3 w-3" />
              {feature.label}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
