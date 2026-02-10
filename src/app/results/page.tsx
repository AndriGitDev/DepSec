"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, FileJson, Shield, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useAnalysisStore } from "@/store/analysisStore";
import { useAnalysis } from "@/hooks/useAnalysis";
import { ScoreGauge } from "@/components/results/ScoreGauge";
import { ScoreBreakdown } from "@/components/results/ScoreBreakdown";
import { DependencyTable } from "@/components/results/DependencyTable";
import { DependencyGraph } from "@/components/graph/DependencyGraph";
import { generateCycloneDXSBOM, downloadSBOM } from "@/lib/export/sbomExport";

export default function ResultsPage() {
  const router = useRouter();
  const store = useAnalysisStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRemediation, setShowRemediation] = useState(false);

  // Kick off analysis
  useAnalysis();

  // Redirect to home if no data
  useEffect(() => {
    if (!store.parsedPackage && store.status === "idle") {
      router.replace("/");
    }
  }, [store.parsedPackage, store.status, router]);

  if (!store.parsedPackage) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="font-mono text-sm text-phosphor-dim">Redirecting...</p>
      </div>
    );
  }

  const isLoading = store.status === "fetching" || store.status === "scoring";
  const isComplete = store.status === "complete";
  const isError = store.status === "error";

  const handleExportJson = () => {
    if (!store.scores) return;
    const report = {
      timestamp: new Date().toISOString(),
      packageName: store.parsedPackage?.name,
      score: store.scores,
      vulnerabilities: store.vulnerabilities,
      metadata: store.packageMetadata,
      downloads: store.downloadCounts,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `depsec-report-${store.parsedPackage?.name || "analysis"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportSbom = () => {
    if (!store.parsedPackage) return;
    const sbom = generateCycloneDXSBOM(
      store.parsedPackage,
      store.vulnerabilities,
      store.packageMetadata
    );
    downloadSBOM(sbom);
    setShowExportMenu(false);
  };

  // Get vulnerabilities with remediation hints
  const vulnsWithRemediation = Object.entries(store.vulnerabilities)
    .flatMap(([pkgName, vulns]) => 
      vulns
        .filter(v => v.fixedVersion || v.remediation?.fixedVersion)
        .map(v => ({
          package: pkgName,
          ...v,
        }))
    );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                store.reset();
                router.push("/");
              }}
              className="p-2 border border-phosphor-dim/20 text-phosphor-dim hover:text-phosphor hover:border-phosphor/30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold tracking-[2px] uppercase text-phosphor text-glow">
                Analysis Results
              </h1>
              {store.parsedPackage.name && (
                <p className="font-mono text-xs text-phosphor-dim mt-0.5">
                  {store.parsedPackage.name}{" "}
                  <span className="text-phosphor-dim/40">
                    ({store.parsedPackage.totalCount} dependencies
                    {store.parsedPackage.hasLockfile && (
                      <> • {store.parsedPackage.directCount} direct, {store.parsedPackage.transitiveCount} transitive</>
                    )}
                    )
                  </span>
                </p>
              )}
            </div>
          </div>

          {isComplete && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 border border-phosphor-dim/30 font-mono text-xs text-phosphor-dim hover:text-phosphor hover:border-phosphor/30 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                {showExportMenu ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-black border border-phosphor-dim/30 shadow-lg z-10">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="w-full flex items-center gap-2 px-4 py-2 font-mono text-xs text-phosphor-dim hover:text-phosphor hover:bg-phosphor/5 transition-colors text-left"
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    Export JSON Report
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSbom}
                    className="w-full flex items-center gap-2 px-4 py-2 font-mono text-xs text-phosphor-dim hover:text-phosphor hover:bg-phosphor/5 transition-colors text-left border-t border-phosphor-dim/10"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Export SBOM (CycloneDX)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 text-phosphor animate-spin" />
            <div className="text-center">
              <p className="font-mono text-sm text-phosphor animate-flicker">
                {store.status === "fetching"
                  ? "Scanning dependencies..."
                  : "Computing scores..."}
              </p>
              <div className="mt-4 w-64 h-1 bg-secondary overflow-hidden mx-auto">
                <div
                  className="h-full bg-phosphor transition-all duration-500"
                  style={{
                    width: `${store.progress}%`,
                    boxShadow: "0 0 8px rgba(0, 255, 65, 0.6)",
                  }}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] text-phosphor-dim/40">
                {store.progress}%
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-6 border border-danger/30 bg-danger/5 max-w-md text-center">
              <p className="font-mono text-sm text-danger mb-4">
                {store.error}
              </p>
              <button
                type="button"
                onClick={() => {
                  store.reset();
                  router.push("/");
                }}
                className="px-4 py-2 border border-danger/30 font-mono text-xs text-danger hover:bg-danger/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {isComplete && store.scores && (
          <div className="space-y-8 animate-fade-slide-up">
            {/* Score gauge */}
            <div className="flex justify-center py-4">
              <ScoreGauge
                score={store.scores.overall}
                grade={store.scores.grade}
              />
            </div>

            {/* Remediation Hints (if any) */}
            {vulnsWithRemediation.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setShowRemediation(!showRemediation)}
                  className="w-full flex items-center justify-between font-display text-sm font-bold tracking-[2px] uppercase text-warning mb-4"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Remediation Available ({vulnsWithRemediation.length} vulnerabilities)
                  </span>
                  {showRemediation ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {showRemediation && (
                  <div className="border border-warning/20 bg-warning/5 p-4 space-y-3">
                    {vulnsWithRemediation.slice(0, 10).map((v, i) => (
                      <div key={`${v.package}-${v.id}-${i}`} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 border ${
                            v.severity === "CRITICAL" ? "text-danger border-danger/30" :
                            v.severity === "HIGH" ? "text-warning border-warning/30" :
                            "text-phosphor-dim border-phosphor-dim/30"
                          }`}>
                            {v.severity}
                          </span>
                          <span className="font-mono text-xs text-phosphor">
                            {v.package}
                          </span>
                          <span className="font-mono text-[10px] text-phosphor-dim">
                            {v.id}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-phosphor-dim/80 pl-4">
                          → Upgrade to <span className="text-phosphor">{v.fixedVersion || v.remediation?.fixedVersion}</span> to fix
                        </p>
                      </div>
                    ))}
                    {vulnsWithRemediation.length > 10 && (
                      <p className="font-mono text-[10px] text-phosphor-dim/40 pt-2">
                        ...and {vulnsWithRemediation.length - 10} more
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Category breakdown */}
            <section>
              <h2 className="font-display text-sm font-bold tracking-[2px] uppercase text-phosphor mb-4">
                Score Breakdown
              </h2>
              <ScoreBreakdown categories={store.scores.categories} />
            </section>

            {/* Dependency graph */}
            <section>
              <h2 className="font-display text-sm font-bold tracking-[2px] uppercase text-phosphor mb-4">
                Dependency Graph
              </h2>
              <DependencyGraph
                parsed={store.parsedPackage}
                vulnerabilities={store.vulnerabilities}
                downloadCounts={store.downloadCounts}
                packageMetadata={store.packageMetadata}
              />
            </section>

            {/* Dependency table */}
            <section>
              <h2 className="font-display text-sm font-bold tracking-[2px] uppercase text-phosphor mb-4">
                All Dependencies
              </h2>
              <DependencyTable
                parsed={store.parsedPackage}
                vulnerabilities={store.vulnerabilities}
                metadata={store.packageMetadata}
                downloadCounts={store.downloadCounts}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
