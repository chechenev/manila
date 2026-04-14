# Manila Refund Workbench

Production-oriented React + TypeScript + Vite prototype for the LuzonMart refund dispute resolution challenge.

## Status

Milestone 5 is complete.

Current foundation includes:

- Vite + React + TypeScript scaffold
- route shell for Explorer and Analytics
- reusable UI primitives and design tokens
- deterministic seed-data generator and committed JSON dataset
- domain models, schemas, selectors, and risk engine
- interactive Refund Explorer with filtering, URL state, pagination, detail drill-down, and local actions
- analytics dashboard with KPI cards, refund trend charts, payment-method comparisons, and high-risk customer insights
- batch-safe explorer workflow with multi-select, preflight batch review, exclusions for flagged items, and what-if simulation
- strict TypeScript configuration
- ESLint setup
- Vitest baseline
- Playwright baseline
- accessibility-aware and mobile-aware layout foundation
- Vercel-friendly static frontend structure

## Getting Started

```bash
npm install
npm run dev
```

## Available Scripts

```bash
npm run build
npm run generate:seed
npm run lint
npm run test
npm run test:e2e
```

## Notes

- Milestone 6 will focus on hardening, final polish, delivery walkthrough, and demo readiness.
- The current build still warns about a large client bundle because seeded data and charting code ship together in the demo bundle.
