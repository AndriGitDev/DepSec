# DepSec

A dependency security analyzer where you upload your package.json file and get a score from 0 to 100 of how well protected your app is.

## Features

- Upload or drag-and-drop your `package.json`
- Comprehensive 0-100 security score across 6 weighted factors:
  - **Known Vulnerabilities** (35%) — checks against OSV database
  - **Dependency Hygiene** (15%) — version pinning, dep count, dev/prod separation
  - **License Risk** (10%) — flags restrictive or unknown licenses
  - **Maintainer Activity** (15%) — last publish date, bus factor
  - **Download Popularity** (10%) — low-download packages flagged
  - **Typosquatting Detection** (15%) — Levenshtein distance checks against popular packages
- Interactive force-directed dependency graph with neon glow rendering
- Sortable/searchable dependency table
- Export report as JSON
- Retro-cyberpunk CRT visual theme

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- shadcn/ui
- Zustand (state management)
- react-force-graph-2d (dependency graph)
- framer-motion (animations)

## Deploy

Deploy to Vercel with zero configuration:

```bash
npx vercel
```
