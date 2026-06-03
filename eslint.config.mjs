import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**", // CLI scripts use CommonJS
      "src/cli/**", // TypeScript CLI (separate build)
    ],
  },
];

export default eslintConfig;
