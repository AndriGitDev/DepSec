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

    const depNames = parsedPackage.dependencies.map((d) => d.name);
    const packages = parsedPackage.dependencies.map((d) => ({
      name: d.name,
      version: resolveVersion(d.versionSpecifier),
    }));

    async function run() {
      try {
        setProgress(5);

        // Fetch all three in parallel
        const [vulnData, metaData, dlData] = await Promise.all([
          fetchVulnerabilities(packages).catch((err) => {
            console.error("Vuln fetch failed:", err);
            return {} as Record<string, never[]>;
          }),
          fetchPackageMetadata(depNames).catch((err) => {
            console.error("Metadata fetch failed:", err);
            return {} as Record<string, never>;
          }),
          fetchDownloadCounts(depNames).catch((err) => {
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
          dlData
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
    vulnerabilities: useAnalysisStore.getState().vulnerabilities,
    packageMetadata: useAnalysisStore.getState().packageMetadata,
    downloadCounts: useAnalysisStore.getState().downloadCounts,
  };
}
