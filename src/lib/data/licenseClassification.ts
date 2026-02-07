export type LicenseRisk = "permissive" | "weak-copyleft" | "strong-copyleft" | "network-copyleft" | "unknown";

const PERMISSIVE = new Set([
  "MIT",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "Unlicense",
  "0BSD",
  "CC0-1.0",
  "CC-BY-4.0",
  "Zlib",
  "BlueOak-1.0.0",
  "MIT-0",
]);

const WEAK_COPYLEFT = new Set([
  "LGPL-2.1",
  "LGPL-2.1-only",
  "LGPL-2.1-or-later",
  "LGPL-3.0",
  "LGPL-3.0-only",
  "LGPL-3.0-or-later",
  "MPL-2.0",
  "EPL-2.0",
  "EPL-1.0",
  "CDDL-1.0",
  "CDDL-1.1",
]);

const STRONG_COPYLEFT = new Set([
  "GPL-2.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
]);

const NETWORK_COPYLEFT = new Set([
  "AGPL-3.0",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
]);

export function classifyLicense(license: string | null): LicenseRisk {
  if (!license || license === "UNLICENSED" || license === "NONE") {
    return "unknown";
  }

  // Handle SPDX expressions like "MIT OR Apache-2.0"
  const parts = license.split(/\s+OR\s+/i);

  // If any part is permissive, the expression is effectively permissive
  for (const part of parts) {
    const normalized = part.trim().replace(/[()]/g, "");
    if (PERMISSIVE.has(normalized)) return "permissive";
  }

  for (const part of parts) {
    const normalized = part.trim().replace(/[()]/g, "");
    if (WEAK_COPYLEFT.has(normalized)) return "weak-copyleft";
    if (STRONG_COPYLEFT.has(normalized)) return "strong-copyleft";
    if (NETWORK_COPYLEFT.has(normalized)) return "network-copyleft";
  }

  // Check if the raw license string contains known identifiers
  const upper = license.toUpperCase();
  if (upper.includes("MIT") || upper.includes("ISC") || upper.includes("BSD")) {
    return "permissive";
  }
  if (upper.includes("APACHE")) return "permissive";
  if (upper.includes("AGPL")) return "network-copyleft";
  if (upper.includes("GPL")) return "strong-copyleft";
  if (upper.includes("LGPL")) return "weak-copyleft";
  if (upper.includes("MPL")) return "weak-copyleft";

  return "unknown";
}

export function licenseRiskScore(risk: LicenseRisk): number {
  switch (risk) {
    case "permissive": return 100;
    case "weak-copyleft": return 70;
    case "strong-copyleft": return 40;
    case "network-copyleft": return 20;
    case "unknown": return 10;
  }
}
