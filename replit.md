# Ink Coverage Estimator - Sterling Carter Technology Distributors

## Overview

A professional web application for print shops and mass printing centers that analyzes ink coverage in documents and calculates cost per page. Supports PDF, EPS, and image formats with CMYK or Color+Black modes.

## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query v5
- **Routing**: Wouter
- **Build**: Vite

### Backend
- **Runtime**: Node.js + Express.js + TypeScript
- **File Processing**: Multer (50MB limit)
- **Storage**: In-memory (MemStorage)

## Analysis Engine

### Primary Method (PDFs): Ghostscript `inkcov` device
Reads CMYK ink coverage **directly from the PDF's color specifications** without going through RGB conversion. This is what professional tools like EPS Fill use.

Output format: `C  M  Y  K  CMYK OK` (values 0.0–1.0 per page)

### Fallback Method (images + PDF fallback): ImageMagick RGB formula
Renders each page to RGB with a white background, then calculates CMYK:
- `C = (1 - mean_R) × 100`
- `M = (1 - mean_G) × 100`
- `Y = (1 - mean_B) × 100`
- `K = (1 - mean_max(R,G,B)) × 100`

This is consistent with the documentation formula: `C = 255-R, M = 255-G, Y = 255-B, K = min(C,M,Y)`.

Critical: Always render PDFs with `-background white -alpha remove` to ensure white paper background.

## Features

### Analysis Modes
1. **CMYK Mode** — Separate Cyan, Magenta, Yellow, Black channels
2. **Color + Black Mode** — Combined color cartridge (CMY average) + black

### Cost Estimator
Formula from documentation:
```
effective_yield = rated_yield × (5 / actual_coverage)
cost_per_page = price / effective_yield
adjusted_cost = base_cost × (1 + waste%)
```

Displays:
- Base cost per page
- Adjusted cost (with waste factor)
- Variation range (±8%)
- Per-cartridge breakdown

### Results Display
- Coverage bars with percentages per channel
- Page-by-page breakdown table
- Summary statistics (total ink load)

## API Endpoints

- `POST /api/documents/upload` — Upload file (PDF, PNG, JPG, TIFF, EPS)
- `POST /api/documents/:id/analyze` — Start analysis (`{ mode: "cmyk" | "color_black" }`)
- `GET /api/analyses/:id` — Poll for results
- `POST /api/estimate` — Calculate cost per page

## Key Files

- `server/analysis-engine.ts` — Core CMYK analysis logic
- `server/routes.ts` — API routes + cost calculation
- `shared/schema.ts` — Types and database schema
- `client/src/components/file-upload.tsx` — Upload UI + mode selection
- `client/src/components/analysis-results.tsx` — Results + cost estimator
- `client/src/pages/home.tsx` — Main page

## Deployment

- Port 5000 (Express serves frontend + API)
- Max file size: 50MB
- Node.js 20, PostgreSQL 16 available

## User Preferences

- Simple, everyday language
- No mock/placeholder data
