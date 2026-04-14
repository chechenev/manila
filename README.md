# Manila Refund Workbench

Production-oriented `React + TypeScript + Vite` prototype for LuzonMart's refund dispute resolution challenge.

Live demo:

- [manila-navy.vercel.app/explorer](https://manila-navy.vercel.app/explorer)

Submission note:

- If you want, next I can turn this into a short "judge-facing" self-assessment you can paste into the submission.

## What This App Does

This application helps an operations team:

- triage pending refund requests quickly
- understand why a refund is risky
- avoid duplicate or unsafe approvals
- compare refund patterns across payment methods and time
- batch-review selected refunds with safety checks before local approval

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Recharts
- Vitest + Testing Library
- Playwright

Deployment target:

- Vercel

## How To Run

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the app at the local Vite URL printed in the terminal.

## Scripts

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run typecheck
npm run generate:seed
```

## Completed Requirements

### Core

- Refund Explorer with filtering, search, URL-backed state, pagination, and detail drill-down
- Prominent risk indicators with rule explanations
- Approve, reject, and flag actions in local state
- Analytics dashboard with:
  - top-line KPIs
  - refund count trend
  - refund amount trend
  - payment method comparison
  - refund-to-transaction ratio comparison
  - high-risk / high-refund customer view

### Stretch

- Batch selection in the explorer
- Batch review modal with safety preflight
- Exclude flagged items from a batch
- Single-refund what-if simulation
- Filtered-view financial impact summary

### Data

- Deterministic seeded dataset
- 300+ transactions
- 100+ refund requests
- Required payment methods and scenario coverage

## Design Decisions

- Explorer-first UX: the queue is the primary workflow, analytics is secondary
- Transparent risk engine: every flag maps to a named rule and readable explanation
- Shared domain selectors: analytics, queue summaries, and simulation use centralized derived logic
- URL-backed explorer filters: refreshes keep operational context intact
- Modal details instead of right rail: more usable on smaller screens and lower list positions
- Local-only state: chosen intentionally to keep the challenge implementation fast, deterministic, and demo-ready

## Tradeoffs

- No real backend or persistence layer
- Local actions do not survive refresh
- Batch approval is a local demo action, not a real orchestration step
- The seeded dataset and charting code increase the client bundle size
- The analytics and explorer share in-memory data rather than a proper repository abstraction with async loading

## Accessibility And Responsiveness

- Keyboard-reachable primary controls
- Visible focus states
- Skip link to main content
- Mobile-aware layouts for explorer, analytics, modals, and customer tables
- Text labels added for charts and key controls

## Testing

Covered today:

- risk engine rules
- selectors and analytics calculations
- batch safety and simulation helpers
- explorer route interactions
- analytics route rendering
- Playwright smoke flow for filtering and batch review

## Demo Walkthrough

Recommended demo path:

1. Start on `Refund Explorer`, search for `CUS-00004`, and show how risky requests rise to the top.
2. Open a refund detail modal and walk through the risk flags, transaction timeline, and what-if simulation.
3. Select several refunds, open `Bulk Review`, exclude flagged items, and show the preflight batch summary changing live.
4. Move to `Analytics` and use the request-date filter to explain refund spikes, method pressure, and concentrated customer risk.

## Judge-Facing Summary

- Primary workflow is explorer-first: the queue is optimized for triage, decisions, and explanation rather than passive reporting.
- Risk logic is intentionally transparent: duplicate detection, blocking rules, and warnings are surfaced with readable explanations instead of opaque scoring.
- Analytics is grounded in the same selector layer as the explorer, so dashboard and operational views stay consistent.
- Stretch work focuses on workflow safety rather than novelty: batch preflight, exclusions, and what-if simulation all reduce unsafe approvals.
- The implementation is static and deterministic by design, so the demo remains stable, reproducible, and easy to review.

## Seeded Scenarios To Demo

- duplicate refund requests
- refunds against authorized-only transactions
- refunds with chargeback conflicts
- refund amount greater than original transaction amount
- high customer refund velocity
- COD payout warning scenarios

## Vercel Notes

This project is a static frontend and can be deployed to Vercel as a standard Vite application.

Typical deployment flow:

1. Import the repository into Vercel
2. Keep the default build command as `npm run build`
3. Keep the output directory as `dist`

## Known Issues

- The analytics route still carries a relatively heavy charting + seeded-data payload
- The next hardening step should split the seeded dataset away from route bundles and add more granular chart loading

## What I Would Add Next

- Persisted mock backend or API adapter layer
- audit log for operator decisions
- stronger batch confirmation workflow
- CSV export / reconciliation review
- seeded-data loading split from visualization code
- richer empty/loading states for async-ready architecture
