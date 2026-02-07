"use client";

import { create } from "zustand";
import type {
  ParsedPackageJson,
  Vulnerability,
  PackageMetadata,
  CompositeScore,
  AnalysisStatus,
} from "@/types";

interface AnalysisState {
  rawJson: string | null;
  parsedPackage: ParsedPackageJson | null;
  vulnerabilities: Record<string, Vulnerability[]>;
  packageMetadata: Record<string, PackageMetadata>;
  downloadCounts: Record<string, number>;
  scores: CompositeScore | null;
  status: AnalysisStatus;
  progress: number;
  error: string | null;

  setRawJson: (json: string) => void;
  setParsedPackage: (pkg: ParsedPackageJson) => void;
  setVulnerabilities: (vulns: Record<string, Vulnerability[]>) => void;
  setPackageMetadata: (meta: Record<string, PackageMetadata>) => void;
  setDownloadCounts: (counts: Record<string, number>) => void;
  setScores: (scores: CompositeScore) => void;
  setStatus: (status: AnalysisStatus) => void;
  setProgress: (progress: number) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  rawJson: null,
  parsedPackage: null,
  vulnerabilities: {},
  packageMetadata: {},
  downloadCounts: {},
  scores: null,
  status: "idle" as AnalysisStatus,
  progress: 0,
  error: null,
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,
  setRawJson: (rawJson) => set({ rawJson }),
  setParsedPackage: (parsedPackage) => set({ parsedPackage }),
  setVulnerabilities: (vulnerabilities) => set({ vulnerabilities }),
  setPackageMetadata: (packageMetadata) => set({ packageMetadata }),
  setDownloadCounts: (downloadCounts) => set({ downloadCounts }),
  setScores: (scores) => set({ scores }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => set(initialState),
}));
