# DepSec 🛡️

**DepSec** is a comprehensive dependency security analyzer for Node.js projects. Upload your `package.json` file and receive a detailed security assessment with a score from 0 to 100, helping you understand and improve your project's dependency security posture.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## Features

### Security Analysis
- **Multi-Factor Security Scoring** — Holistic security assessment across 6 weighted dimensions
- **Real-time Vulnerability Detection** — Checks against the OSV (Open Source Vulnerabilities) database
- **Typosquatting Protection** — Detects potential package name confusion attacks
- **License Risk Assessment** — Identifies restrictive or unknown licenses
- **Maintainer Health Checks** — Evaluates package maintenance activity and bus factor
- **Dependency Hygiene Analysis** — Assesses version pinning practices and dependency structure

### Visualization & UX
- **Interactive Dependency Graph** — Force-directed network visualization with neon glow effects
- **Sortable Dependency Table** — Search, sort, and filter your dependencies
- **Real-time Progress Tracking** — Watch the analysis progress with live status updates
- **Export Functionality** — Download comprehensive JSON reports
- **Retro-Cyberpunk Theme** — Distinctive CRT-style aesthetic with scanline effects

### User Experience
- **Drag-and-Drop Upload** — Simple file upload interface
- **Sample Data Loader** — Try it out with pre-loaded demo data
- **Responsive Design** — Works seamlessly on desktop and mobile devices

## How It Works

DepSec analyzes your project's dependencies through a multi-stage process that combines data from multiple sources to produce a comprehensive security assessment.

### Overview

```
┌──────────────┐
│ Upload       │
│ package.json │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Parse & Validate │ ← Zod schema validation
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Parallel Data Collection            │
│ ┌─────────────────────────────────┐ │
│ │ • OSV API (vulnerabilities)     │ │
│ │ • NPM Registry (metadata)       │ │
│ │ • NPM Downloads (popularity)    │ │
│ └─────────────────────────────────┘ │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Multi-Dimensional Scoring Engine     │
│ ┌────────────────────────────────┐   │
│ │ 1. Vulnerability Score (35%)   │   │
│ │ 2. Hygiene Score (15%)         │   │
│ │ 3. License Score (10%)         │   │
│ │ 4. Maintainer Score (15%)      │   │
│ │ 5. Popularity Score (10%)      │   │
│ │ 6. Typosquatting Score (15%)   │   │
│ └────────────────────────────────┘   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Aggregate & Display  │
│ • Overall Score      │
│ • Category Breakdown │
│ • Per-Package Issues │
│ • Visual Graph       │
└──────────────────────┘
```

### Detailed Process

#### 1. **File Upload & Parsing**
When you upload a `package.json` file:
- The file is validated (max 1MB, must be valid JSON)
- A Zod schema validates the package.json structure
- Dependencies are extracted from both `dependencies` and `devDependencies`
- Package versions are normalized and semver is used for range resolution

#### 2. **Data Collection Phase**
DepSec makes parallel API calls to gather comprehensive data:

**OSV API (Open Source Vulnerabilities)**
- Queries the OSV database for known security vulnerabilities
- Retrieves CVE details, CVSS scores, and severity levels
- Handles batched requests for efficiency
- Supports concurrency-limited detailed fetching

**NPM Registry API**
- Fetches package metadata including:
  - License information
  - Maintainer/contributor count
  - Last publish date
  - Repository information
- Implements 5-minute caching to reduce API load

**NPM Downloads API**
- Retrieves monthly download statistics
- Helps identify suspiciously unpopular packages
- Handles scoped packages correctly

#### 3. **Scoring Engine**
The core of DepSec is its weighted multi-dimensional scoring system:

##### **Known Vulnerabilities (35% weight)**
- Most critical factor in the security score
- Analyzes CVSS v3 scores from OSV database
- Categorizes vulnerabilities by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Calculates impact based on:
  - Number of vulnerabilities
  - Severity distribution
  - Whether vulnerabilities are in direct or transitive dependencies

##### **Dependency Hygiene (15% weight)**
- **Version Pinning**: Exact versions (`1.2.3`) score higher than ranges (`^1.2.3` or `~1.2.3`)
- **Dependency Count**: Penalizes excessive dependencies (bloat risk)
- **Dev vs Prod Separation**: Checks if dev dependencies are properly separated

##### **License Risk (10% weight)**
- Identifies restrictive licenses (GPL, AGPL, SSPL, etc.)
- Flags unknown or missing licenses
- Considers commercial compatibility
- Uses a comprehensive license classification system

##### **Maintainer Activity (15% weight)**
- **Last Publish Date**: Recent updates indicate active maintenance
- **Bus Factor**: Multiple maintainers reduce single-point-of-failure risk
- Flags packages that haven't been updated in years

##### **Download Popularity (10% weight)**
- Compares package popularity against expected baselines
- Flags suspiciously unpopular packages (< 1000 downloads/month)
- Popular packages generally have more scrutiny and faster security responses

##### **Typosquatting Detection (15% weight)**
- Uses Levenshtein distance algorithm to detect package names similar to ~1,500 popular packages
- Catches common typosquatting attacks like:
  - Character substitution (`lodash` → `1odash`)
  - Character omission (`express` → `expres`)
  - Character addition (`react` → `reactt`)
- Helps prevent supply chain attacks via malicious packages with similar names

#### 4. **Score Aggregation**
- Each category produces a 0-100 score with detailed per-package feedback
- Scores are weighted according to their security impact
- Final score = Σ(category_score × weight)
- Letter grades assigned: A+ (90-100), A (80-89), B (70-79), C (60-69), D (50-59), F (<50)

#### 5. **Results Display**
- **Score Gauge**: Animated arc showing overall security score
- **Category Breakdown**: Visual cards for each scoring dimension
- **Dependency Table**: Sortable table with per-package details and issues
- **Dependency Graph**: Interactive force-directed graph showing dependency relationships
- **Export**: JSON report with complete analysis data

### Architecture

**Frontend**: Next.js 15 with React Server Components and Client Components
- Server Components for initial rendering and SEO
- Client Components for interactivity (graph, tables, animations)

**State Management**: Zustand for global analysis state
- Centralized store for analysis data
- Reactive updates throughout the UI

**API Layer**: Next.js API routes acting as backend
- Rate limiting to prevent abuse
- Error handling and data validation
- Caching strategies to reduce external API calls

**External Dependencies**:
- No backend database required
- All analysis happens in-memory
- Relies on public APIs (OSV, NPM Registry, NPM Downloads)

## Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DepSec.git
cd DepSec

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
# Create an optimized production build
npm run build

# Start the production server
npm start
```

## Project Structure

```
DepSec/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # Backend API routes
│   │   │   ├── vulnerabilities/  # OSV vulnerability lookup
│   │   │   ├── package-metadata/ # NPM registry metadata
│   │   │   └── download-counts/  # NPM download stats
│   │   ├── results/              # Analysis results page
│   │   ├── page.tsx              # Home page (upload UI)
│   │   └── layout.tsx            # Root layout
│   │
│   ├── components/               # React components
│   │   ├── graph/                # Dependency visualization
│   │   ├── results/              # Results display components
│   │   ├── upload/               # File upload components
│   │   ├── layout/               # Layout components
│   │   └── ui/                   # shadcn/ui base components
│   │
│   ├── hooks/
│   │   └── useAnalysis.ts        # Main analysis orchestration
│   │
│   ├── lib/
│   │   ├── api/                  # External API clients
│   │   ├── data/                 # Static data (licenses, popular packages)
│   │   ├── parser/               # Package.json parsing and validation
│   │   ├── scoring/              # Scoring engine (6 scorers)
│   │   └── utils/                # Utility functions and rate limiting
│   │
│   ├── store/
│   │   └── analysisStore.ts      # Zustand state management
│   │
│   └── types/
│       └── index.ts              # TypeScript type definitions
│
├── public/                       # Static assets
└── package.json                  # Project dependencies
```

## Tech Stack

### Core Framework
- **Next.js 15** — React framework with App Router
- **React 19** — UI library
- **TypeScript** — Type safety and better DX

### Styling
- **Tailwind CSS v4** — Utility-first CSS framework
- **shadcn/ui** — High-quality React component library
- **framer-motion** — Animation library

### State Management & Data
- **Zustand** — Lightweight state management
- **Zod** — Schema validation
- **@tanstack/react-table** — Powerful table functionality
- **@tanstack/react-virtual** — Virtual scrolling for performance

### Visualization
- **react-force-graph-2d** — Interactive dependency graph
- **lucide-react** — Icon library

### Utilities
- **semver** — Semantic versioning
- **fastest-levenshtein** — String similarity for typosquatting detection

### External APIs
- **OSV API** — Open Source Vulnerabilities database
- **NPM Registry API** — Package metadata
- **NPM Downloads API** — Download statistics

## API Endpoints

### `POST /api/vulnerabilities`
Fetches vulnerability data from the OSV database.

**Request Body:**
```json
{
  "packages": [
    { "name": "lodash", "version": "4.17.20" }
  ]
}
```

**Response:**
```json
{
  "vulnerabilities": {
    "lodash": [
      {
        "id": "GHSA-...",
        "summary": "...",
        "severity": "HIGH",
        "cvss_score": 7.5
      }
    ]
  }
}
```

### `POST /api/package-metadata`
Retrieves package metadata from NPM registry.

**Request Body:**
```json
{
  "packages": ["lodash", "express"]
}
```

**Response:**
```json
{
  "metadata": {
    "lodash": {
      "license": "MIT",
      "maintainerCount": 5,
      "lastPublish": "2023-01-15T..."
    }
  }
}
```

### `POST /api/download-counts`
Gets download statistics from NPM.

**Request Body:**
```json
{
  "packages": ["lodash", "express"]
}
```

**Response:**
```json
{
  "downloads": {
    "lodash": 50000000,
    "express": 30000000
  }
}
```

## Configuration

### Rate Limiting
API routes implement IP-based rate limiting to prevent abuse. Configure in `/src/lib/utils/rateLimiter.ts`:
- Default: 100 requests per 15 minutes per IP
- Can be adjusted based on deployment environment

### Scoring Weights
Adjust scoring weights in `/src/lib/scoring/weights.ts`:
```typescript
export const SCORE_WEIGHTS = {
  vulnerabilities: 0.35,
  hygiene: 0.15,
  licenses: 0.10,
  maintainers: 0.15,
  popularity: 0.10,
  typosquatting: 0.15,
}
```

## Deployment

### Vercel (Recommended)
Deploy with zero configuration:

```bash
npx vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Docker
```bash
# Build the Docker image
docker build -t depsec .

# Run the container
docker run -p 3000:3000 depsec
```

### Environment Variables
No environment variables are required for basic functionality. All external APIs used are public and don't require authentication.

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add TypeScript types for all new code
- Test your changes thoroughly
- Update documentation as needed

## Roadmap

- [ ] Support for other package managers (pip, cargo, maven, etc.)
- [ ] Historical score tracking and trends
- [ ] CI/CD integration (GitHub Actions, GitLab CI)
- [ ] Custom scoring weight configuration
- [ ] Dependency update recommendations
- [ ] SBOM (Software Bill of Materials) export
- [ ] Private package registry support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Open Source Vulnerabilities (OSV)](https://osv.dev/) for vulnerability data
- [NPM Registry](https://www.npmjs.com/) for package metadata
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- The open-source community for inspiration and tools

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

---

Built with ❤️ for the open-source community
