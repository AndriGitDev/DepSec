# DepSec 🛡️

**DepSec** is a comprehensive dependency security analyzer for Node.js projects. Upload your `package.json` file and receive a detailed security assessment with a score from 0 to 100, helping you understand and improve your project's dependency security posture.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## Features

### Security Analysis
- **Multi-Factor Security Scoring** — Holistic security assessment across 6 weighted dimensions
- **Real-time Vulnerability Detection** — Checks against the OSV (Open Source Vulnerabilities) database
- **Transitive Dependency Analysis** — Upload `package-lock.json` to scan the entire dependency tree
- **Remediation Hints** — Actionable upgrade recommendations for each vulnerability
- **Typosquatting Protection** — Detects potential package name confusion attacks
- **License Risk Assessment** — Identifies restrictive or unknown licenses
- **Maintainer Health Checks** — Evaluates package maintenance activity and bus factor
- **Dependency Hygiene Analysis** — Assesses version pinning practices and dependency structure

### Visualization & UX
- **Interactive Dependency Graph** — Force-directed network visualization with neon glow effects
- **Sortable Dependency Table** — Search, sort, and filter by direct/transitive dependencies
- **Real-time Progress Tracking** — Watch the analysis progress with live status updates
- **Export Functionality** — Download JSON reports or CycloneDX SBOM files
- **Retro-Cyberpunk Theme** — Distinctive CRT-style aesthetic with scanline effects

### CI/CD Integration
- **CLI Mode** — Run from command line with JSON output and exit codes
- **GitHub Action** — Ready-to-use action for automated security checks
- **SBOM Export** — Generate CycloneDX 1.5 compliant Software Bill of Materials

## Quick Start

### Web UI
1. Visit the DepSec web interface
2. Drag and drop your `package.json` (and optionally `package-lock.json`)
3. View your security score and detailed analysis

### CLI Mode

```bash
# Analyze a package.json
npx depsec package.json

# CI mode with threshold
npx depsec --ci package.json --fail-under 70

# Include lockfile for transitive deps
npx depsec package.json --lock package-lock.json --json

# Generate SBOM
npx depsec package.json --sbom > sbom.cdx.json
```

### GitHub Action

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  depsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run DepSec Security Scan
        uses: AndriGitDev/DepSec/.github/actions/depsec@main
        with:
          package-path: 'package.json'
          lock-path: 'package-lock.json'
          threshold: 70
```

#### Action Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `package-path` | Path to package.json | `package.json` |
| `lock-path` | Path to package-lock.json (optional) | `''` |
| `threshold` | Minimum score to pass (0-100) | `0` |
| `fail-on-vulnerability` | Fail if any vulnerabilities found | `false` |
| `output-format` | Output format: json, sbom, summary | `summary` |

#### Action Outputs

| Output | Description |
|--------|-------------|
| `score` | Security score (0-100) |
| `grade` | Letter grade (A+, A, B, C, D, F) |
| `vulnerabilities-total` | Total vulnerabilities found |
| `vulnerabilities-critical` | Critical severity count |
| `vulnerabilities-high` | High severity count |
| `dependencies-total` | Total dependencies analyzed |
| `dependencies-direct` | Direct dependencies |
| `dependencies-transitive` | Transitive dependencies |
| `result-json` | Full results in JSON format |

## How It Works

### Analysis Pipeline

```
┌──────────────────┐   ┌────────────────────┐
│ package.json     │   │ package-lock.json  │  (optional)
└────────┬─────────┘   └──────────┬─────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────┐
│ Parse & Build Dependency Tree               │
│ • Direct dependencies from package.json     │
│ • Transitive deps from lockfile (if present)│
│ • Depth tracking (0=direct, 1+=transitive)  │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ Parallel Data Collection                    │
│ • OSV API → Vulnerabilities + Fix Versions  │
│ • NPM Registry → Metadata, Licenses         │
│ • NPM Downloads → Popularity Stats          │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ Weighted Scoring Engine                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Vulnerabilities (35%) ← depth-weighted  │ │
│ │ Hygiene (15%) + lockfile bonus          │ │
│ │ Licenses (10%) ← depth-weighted         │ │
│ │ Maintainers (15%) ← depth-weighted      │ │
│ │ Popularity (10%) ← depth-weighted       │ │
│ │ Typosquatting (15%) ← depth-weighted    │ │
│ └─────────────────────────────────────────┘ │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ Output                                      │
│ • Score (0-100) with letter grade           │
│ • Remediation hints for vulnerabilities     │
│ • Interactive dependency graph              │
│ • Exportable reports (JSON, SBOM)           │
└─────────────────────────────────────────────┘
```

### Transitive Dependency Analysis

When you include a `package-lock.json`, DepSec:
- Parses the full dependency tree (lockfile v2/v3 supported)
- Identifies direct vs transitive dependencies with depth levels
- Scans **all** dependencies for vulnerabilities (not just direct)
- Applies weighted scoring: direct deps (1.0x), depth 1 (0.7x), depth 2+ (0.4x)

This means critical vulnerabilities in direct dependencies are weighted more heavily than the same vulnerability buried deep in transitive deps.

### Scoring Categories

| Category | Weight | What It Measures |
|----------|--------|------------------|
| Vulnerabilities | 35% | Known CVEs from OSV database |
| Hygiene | 15% | Version pinning, dep count, lockfile |
| Licenses | 10% | Copyleft/restrictive licenses |
| Maintainers | 15% | Publish activity, bus factor |
| Popularity | 10% | Download counts (social proof) |
| Typosquatting | 15% | Package name similarity attacks |

### Remediation Hints

For each vulnerability, DepSec extracts:
- **Fixed Version**: The version that patches the issue
- **Affected Range**: Which versions are vulnerable
- **Upgrade Path**: For transitive deps, shows which direct dependency to update

Example output:
```
🔴 CRITICAL lodash CVE-2021-23337
   → Upgrade to 4.17.21 or later to fix
```

## SBOM Export

DepSec can generate a CycloneDX 1.5 compliant Software Bill of Materials:

```bash
# CLI
npx depsec package.json --sbom > sbom.cdx.json

# Or via web UI: Click "Export" → "Export SBOM (CycloneDX)"
```

The SBOM includes:
- All components with versions and PURLs
- License information
- Dependency relationships
- Mapped vulnerabilities with severity ratings

## Installation

### Prerequisites
- Node.js 18.x or later
- npm or yarn package manager

### Local Development

```bash
# Clone the repository
git clone https://github.com/AndriGitDev/DepSec.git
cd DepSec

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
DepSec/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # Backend API routes
│   │   │   ├── vulnerabilities/  # OSV lookup + remediation
│   │   │   ├── package-metadata/ # NPM registry
│   │   │   └── download-counts/  # NPM downloads
│   │   ├── results/              # Analysis results page
│   │   └── page.tsx              # Home (upload UI)
│   │
│   ├── components/               # React components
│   │   ├── graph/                # Dependency graph
│   │   ├── results/              # Results display
│   │   └── upload/               # File upload
│   │
│   ├── lib/
│   │   ├── parser/               # package.json + lockfile parsing
│   │   ├── scoring/              # Weighted scoring engine
│   │   ├── export/               # SBOM generation
│   │   └── api/                  # External API clients
│   │
│   ├── store/                    # Zustand state
│   └── cli/                      # CLI implementation
│
├── scripts/
│   └── cli.js                    # Standalone CLI script
│
└── .github/
    └── actions/
        └── depsec/               # GitHub Action
            └── action.yml
```

## Configuration

### Scoring Weights
Adjust in `/src/lib/scoring/weights.ts`:

```typescript
export const WEIGHTS = {
  vulnerabilities: 0.35,
  hygiene: 0.15,
  license: 0.10,
  maintainer: 0.15,
  popularity: 0.10,
  typosquat: 0.15,
}
```

### Depth Weights
Adjust transitive dependency weights in `/src/lib/parser/lockfileParser.ts`:

```typescript
export function getDepthWeight(depth: number): number {
  if (depth === 0) return 1.0;   // Direct dependency
  if (depth === 1) return 0.7;   // First-level transitive
  return 0.4;                     // Deeper transitive
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## Roadmap

- [x] Lockfile support (package-lock.json)
- [x] Transitive dependency analysis
- [x] CLI mode with JSON output
- [x] GitHub Action
- [x] SBOM export (CycloneDX)
- [x] Remediation hints
- [ ] yarn.lock / pnpm-lock.yaml support
- [ ] Other ecosystems (pip, cargo, maven)
- [ ] Historical tracking
- [ ] Dependency update PRs

## License

MIT License - see LICENSE file.

## Acknowledgments

- [Open Source Vulnerabilities (OSV)](https://osv.dev/)
- [NPM Registry](https://www.npmjs.com/)
- [CycloneDX](https://cyclonedx.org/)
- [shadcn/ui](https://ui.shadcn.com/)

---

Built with ❤️ for the open-source community
