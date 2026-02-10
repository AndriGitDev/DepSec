export const samplePackageJson = JSON.stringify(
  {
    name: "acme-dashboard",
    version: "2.1.0",
    description: "Internal dashboard for ACME Corp",
    dependencies: {
      // === GOOD PACKAGES (for contrast) ===
      express: "^4.18.2",
      lodash: "^4.17.21",
      zod: "^3.22.0",
      
      // === CRITICAL VULNERABILITIES ===
      // CVE-2021-44906 - Prototype Pollution (CRITICAL)
      minimist: "1.2.5",
      // CVE-2021-42740 - Command Injection (CRITICAL)
      "shell-quote": "1.7.2",
      // CVE-2022-46175 - Prototype Pollution (HIGH)
      json5: "2.2.1",
      // CVE-2021-32803 - Path Traversal (HIGH)
      tar: "6.1.0",
      // CVE-2022-24999 - Prototype Pollution (HIGH)
      qs: "6.5.2",
      // CVE-2023-26159 - SSRF (MEDIUM)
      "follow-redirects": "1.14.0",
      // CVE-2022-0235 - Sensitive Data Exposure
      "node-fetch": "2.6.1",
      
      // === TYPOSQUAT CANDIDATES ===
      // Similar to "lodash" - suspicious!
      "lodahs": "^1.0.0",
      // Similar to "express"
      "expresss": "^1.0.0",
      
      // === ABANDONED / UNMAINTAINED ===
      // Last published 2020, single maintainer
      "request": "^2.88.2",
      // Deprecated, use date-fns instead
      moment: "^2.29.4",
      
      // === POOR VERSION HYGIENE ===
      // Wildcard - accepts ANY version
      underscore: "*",
      // Range too loose
      async: ">=2.0.0",
      // Git dependency - unverified
      "some-internal-lib": "github:acme/internal-lib#main",
      
      // === LICENSE ISSUES ===
      // GPL-3.0 (copyleft - may conflict with proprietary code)
      "readline-sync": "^1.4.10",
    },
    devDependencies: {
      typescript: "^5.3.0",
      "@types/node": "^20.10.0",
      "@types/express": "^4.17.0",
      eslint: "^8.56.0",
      prettier: "^3.2.0",
      vitest: "^1.2.0",
    },
  },
  null,
  2
);
