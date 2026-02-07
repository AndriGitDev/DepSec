export const samplePackageJson = JSON.stringify(
  {
    name: "acme-dashboard",
    version: "2.1.0",
    dependencies: {
      // Core framework — modern & well-maintained
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      next: "^14.2.0",

      // HTTP & data fetching
      axios: "^1.6.0",
      "node-fetch": "~2.6.1", // v2 line — has CVE-2022-0235 (data exposure)
      "follow-redirects": "^1.14.0", // has CVE-2023-26159 (SSRF)
      qs: "~6.5.2", // old — has CVE-2022-24999 (prototype pollution)

      // Server
      express: "^4.18.2",
      cors: "^2.8.5",
      helmet: "^7.1.0",
      "body-parser": "^1.20.2",
      morgan: "^1.10.0",
      compression: "^1.7.4",

      // Auth & crypto
      jsonwebtoken: "^9.0.0",
      bcryptjs: "^2.4.3",
      passport: "^0.7.0",

      // Database
      mongoose: "^8.0.0",
      redis: "^4.6.0",

      // Utilities
      lodash: "^4.17.21",
      moment: "^2.29.4", // effectively deprecated
      chalk: "^4.1.2",
      uuid: "^9.0.0",
      dotenv: "^16.3.0",
      zod: "^3.22.0",

      // Hygiene demo — loose version specifiers
      "underscore": "*",
      "request": ">=2.0.0",

      // Packages with known CVEs at these versions
      minimist: "~1.2.5", // CVE-2021-44906 — prototype pollution
      "shell-quote": "~1.7.2", // CVE-2021-42740 — command injection
      "json5": "~2.2.1", // CVE-2022-46175 — prototype pollution
      "word-wrap": "~1.2.3", // CVE-2023-26115 — ReDoS
      "xml2js": "~0.4.23", // CVE-2023-0842 — prototype pollution
      semver: "~7.3.7", // CVE-2022-25883 — ReDoS
      tar: "~6.1.0", // CVE-2021-32803 — path traversal

      // Real-time & messaging
      "socket.io": "^4.7.0",
      ws: "^8.16.0",

      // Niche / low download packages
      "tiny-csrf": "^1.1.0", // small package, low downloads
      "express-slow-down": "^2.0.0", // moderate popularity
    },
    devDependencies: {
      typescript: "^5.3.0",
      "@types/node": "^20.10.0",
      "@types/react": "^18.2.0",
      "@types/express": "^4.17.0",
      "@types/lodash": "^4.14.0",
      eslint: "^8.56.0",
      prettier: "^3.2.0",
      vitest: "^1.2.0",
      "@types/uuid": "^9.0.0",
      "@types/cors": "^2.8.0",
      "@types/morgan": "^1.9.0",
      "@types/compression": "^1.7.0",
      "lint-staged": "^15.2.0",
      husky: "^9.0.0",
    },
  },
  null,
  2
);
