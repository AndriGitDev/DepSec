"use client";

import { useEffect, useRef } from "react";
import { useAnalysisStore } from "@/store/analysisStore";
import { fetchVulnerabilities } from "@/lib/api/osvClient";
import { fetchPackageMetadata } from "@/lib/api/npmRegistryClient";
import { fetchDownloadCounts } from "@/lib/api/npmDownloadsClient";
import { computeScore } from "@/lib/scoring/engine";
import * as semver from "semver";

function resolveVersion(specifier: string): string {
  try {
    const min = semver.minVersion(specifier);
    if (min) return min.version;
  } catch {
    // ignore
  }
  // Fallback: strip leading ^~>=< characters
  return specifier.replace(/^[\^~>=<\s]+/, "").split(/\s/)[0] || "0.0.0";
}

export function useAnalysis() {
  const {
    parsedPackage,
    parsedLockfile,
    status,
    setVulnerabilities,
    setPackageMetadata,
    setDownloadCounts,
    setScores,
    setStatus,
    setProgress,
    setError,
  } = useAnalysisStore();

  const hasRun = useRef(false);

  useEffect(() => {
    if (status !== "fetching" || !parsedPackage || hasRun.current) return;
    hasRun.current = true;

    // Build package list for vulnerability scanning
    // If we have lockfile data, use resolved versions; otherwise use parsed specifiers
    const packages = parsedPackage.dependencies.map((d) => ({
      name: d.name,
      version: d.resolvedVersion || resolveVersion(d.versionSpecifier),
      depth: d.depth ?? 0,
      isDirect: d.isDirect ?? true,
    }));

    // Get all unique dependency names for metadata/download fetching
    const allDepNames = parsedPackage.dependencies.map((d) => d.name);
    
    // Direct dependencies for higher-priority scanning
    // (Reserved for future use in enhanced scanning)
    const _directDepNames = parsedPackage.dependencies
      .filter(d => d.isDirect !== false)
      .map(d => d.name);
    void _directDepNames; // Suppress unused warning

    async function run() {
      try {
        setProgress(5);

        // Fetch all three in parallel
        const [vulnData, metaData, dlData] = await Promise.all([
          fetchVulnerabilities(packages).catch((err) => {
            console.error("Vuln fetch failed:", err);
            return {} as Record<string, never[]>;
          }),
          fetchPackageMetadata(allDepNames).catch((err) => {
            console.error("Metadata fetch failed:", err);
            return {} as Record<string, never>;
          }),
          fetchDownloadCounts(allDepNames).catch((err) => {
            console.error("Downloads fetch failed:", err);
            return {} as Record<string, number>;
          }),
        ]);

        setProgress(60);
        setVulnerabilities(vulnData);
        setPackageMetadata(metaData);
        setDownloadCounts(dlData);

        setProgress(80);
        setStatus("scoring");

        const scores = computeScore(
          parsedPackage!,
          vulnData,
          metaData,
          dlData,
          parsedLockfile
        );

        setScores(scores);
        setProgress(100);
        setStatus("complete");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Analysis failed unexpectedly."
        );
      }
    }

    run();
  }, [
    status,
    parsedPackage,
    parsedLockfile,
    setVulnerabilities,
    setPackageMetadata,
    setDownloadCounts,
    setScores,
    setStatus,
    setProgress,
    setError,
  ]);

  return {
    status: useAnalysisStore.getState().status,
    progress: useAnalysisStore.getState().progress,
    scores: useAnalysisStore.getState().scores,
    parsedPackage: useAnalysisStore.getState().parsedPackage,
    parsedLockfile: useAnalysisStore.getState().parsedLockfile,
    vulnerabilities: useAnalysisStore.getState().vulnerabilities,
    packageMetadata: useAnalysisStore.getState().packageMetadata,
    downloadCounts: useAnalysisStore.getState().downloadCounts,
  };
}
