"use client";

import { create } from "zustand";
import type {
  ParsedPackageJson,
  Vulnerability,
  PackageMetadata,
  CompositeScore,
  AnalysisStatus,
} from "@/types";
import type { ParsedLockfile } from "@/lib/parser/lockfileParser";

interface AnalysisState {
  rawJson: string | null;
  rawLockfile: string | null;
  parsedPackage: ParsedPackageJson | null;
  parsedLockfile: ParsedLockfile | null;
  vulnerabilities: Record<string, Vulnerability[]>;
  packageMetadata: Record<string, PackageMetadata>;
  downloadCounts: Record<string, number>;
  scores: CompositeScore | null;
  status: AnalysisStatus;
  progress: number;
  error: string | null;

  setRawJson: (json: string) => void;
  setRawLockfile: (lockfile: string) => void;
  setParsedPackage: (pkg: ParsedPackageJson) => void;
  setParsedLockfile: (lockfile: ParsedLockfile) => void;
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
  rawLockfile: null,
  parsedPackage: null,
  parsedLockfile: null,
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
  setRawLockfile: (rawLockfile) => set({ rawLockfile }),
  setParsedPackage: (parsedPackage) => set({ parsedPackage }),
  setParsedLockfile: (parsedLockfile) => set({ parsedLockfile }),
  setVulnerabilities: (vulnerabilities) => set({ vulnerabilities }),
  setPackageMetadata: (packageMetadata) => set({ packageMetadata }),
  setDownloadCounts: (downloadCounts) => set({ downloadCounts }),
  setScores: (scores) => set({ scores }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => set(initialState),
}));
