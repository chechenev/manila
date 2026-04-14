# AGENTS.md

## Purpose

This document defines the engineering standards for the **Manila Refund Workbench** project. It exists to keep implementation consistent, production-oriented, and easy to extend under time pressure.

All implementation, refactoring, and documentation work in this repository should follow these rules unless a later approved decision explicitly overrides them.

## Product Context

We are building a local demo application for LuzonMart's refund operations workflow. The goal is not a generic dashboard. The product should feel like a focused operational tool that helps users:

- identify safe vs risky refund requests quickly
- understand why a request is risky
- investigate transaction/refund context without leaving the screen
- detect refund patterns and operational failure modes

The interface should prioritize clarity, speed, and decision confidence over visual novelty for its own sake.

## Approved Stack

Frontend stack:

- React
- TypeScript
- Vite

Preferred supporting libraries:

- React Router for navigation
- Zustand for local app state if a shared store is needed
- Zod for runtime schema validation
- Vitest and Testing Library for tests
- Playwright for end-to-end tests
- Recharts or Visx for analytics visualizations

Deployment target:

- Vercel

Do not introduce a backend, database, or external API dependency for v1 unless explicitly approved.

## Architecture Principles

### 1. Keep domain logic out of presentation components

Business rules such as risk flagging, duplicate detection, refund summaries, and analytics calculations must live in domain- or feature-level logic, not inline inside UI components.

### 2. Prefer deterministic data flow

Mock data should be seed-based and reproducible. Derived values should come from selectors, pure functions, or well-bounded hooks.

### 3. Build for replacement of mock data later

Even though v1 uses local data, the code structure should make it straightforward to replace mock repositories with real API clients later.

### 4. Keep components focused

Components should have a single main responsibility:

- layout
- display
- interaction handling
- domain computation

Avoid "god components" that fetch, transform, calculate, and render everything.

### 5. Make risk logic transparent

Every risk flag shown in the UI must map to a named rule with a human-readable explanation. No opaque scoring logic without explanation.

## Recommended Project Shape

```text
src/
  app/
  components/
  data/
  domain/
  features/
    refunds/
    analytics/
    bulk-actions/
    simulation/
  lib/
  styles/
  test/
scripts/
docs/
```

Guidelines:

- `app/`: application shell, providers, routing
- `components/`: reusable presentational building blocks
- `data/`: seeded data, schemas, loaders
- `domain/`: shared types, rules, selectors, formatters
- `features/`: feature-specific UI and state
- `lib/`: utilities that are not business-domain specific
- `styles/`: tokens, global CSS, theme layers

## TypeScript Rules

- Use strict TypeScript settings
- Prefer explicit domain types over loose inferred object shapes
- Avoid `any`
- Use discriminated unions for status-driven state where useful
- Keep enums lightweight; union literals are preferred unless interoperability requires otherwise
- Validate mock JSON with Zod or equivalent runtime checks before use

## State Management Rules

- Keep most UI state local when possible
- Use a shared store only for cross-screen or cross-feature state
- Do not store easily derived values redundantly
- Prefer pure selectors for filtering, grouping, risk summaries, and dashboard metrics
- Action state changes should be explicit and testable

## Data Rules

- Seed data must cover all challenge scenarios
- The generator must be deterministic
- Generated output should be committed for stable demos
- Avoid giant hand-maintained JSON files when a script can generate them cleanly
- Use realistic identifiers, timestamps, payment methods, amounts, and statuses

## Risk Engine Rules

Risk logic is a core product feature and must meet a higher quality bar.

- Each rule must have:
  - stable rule code
  - severity
  - title
  - operator-facing explanation
- Duplicate detection should be understandable, not magical
- Critical flags must be visually distinct from warnings
- Blocking conditions should be separable from informational signals
- Tests must cover every rule and at least one mixed-risk scenario

## UI and UX Standards

### General

- Desktop-first, with required support for mobile-sized screens
- Strong information hierarchy
- The refund explorer is the primary workflow
- Analytics should support operational insight, not decorate the page

### Visual language

- Avoid generic template dashboards
- Use clear spacing, contrast, and hierarchy
- Define CSS variables/tokens for colors, spacing, typography, radius, shadows
- Risk states must be recognizable through more than color alone
- Use concise operational microcopy

### Interaction

- Important actions must be near the relevant context
- Filters should feel fast and reversible
- Selection state should always be obvious
- Batch operations must include a safety review step
- Empty, no-results, and edge states should still feel intentional

### Accessibility

- Respect semantic HTML where practical
- Ensure keyboard reachability for key actions
- Maintain sufficient color contrast
- Use visible focus states
- Provide text labels for badges, icons, and chart meaning where needed

## Styling Rules

- Prefer a small, coherent design system over ad hoc styling
- Keep styles token-driven
- Avoid large one-off inline style objects unless there is a strong reason
- Organize CSS so feature styles are discoverable and maintainable
- Do not add motion gratuitously; use it only to support understanding

## React Rules

- Prefer functional components
- Keep hooks predictable and focused
- Do not introduce memoization by default; add it only when profiling or render patterns justify it
- Avoid deeply nested prop drilling when a focused context/store is more appropriate
- Keep derived lists and dashboard series computed in selectors or helper functions where possible

## Testing Standards

Minimum required coverage areas:

- risk rule evaluation
- duplicate detection
- filtering/search logic
- critical summary/analytics selectors
- at least one core explorer interaction flow
- critical end-to-end flows with Playwright

Testing guidance:

- Prefer unit tests for domain logic
- Use component/integration tests for high-value user flows
- Use Playwright for cross-screen user journeys and regression coverage
- Do not over-test implementation details
- Mock data in tests should be small, readable, and scenario-specific

## Performance Standards

- Filtering and selection should feel immediate on the seeded dataset
- Avoid unnecessary recomputation in render paths
- Keep chart data transformations centralized
- Do not prematurely optimize, but do avoid obviously expensive repeated calculations inside large lists
- Keep the app compatible with Vercel deployment constraints for a static/frontend-hosted build

## Documentation Standards

All project documentation must be written in English.

Required documentation:

- `README.md` with setup, scope, decisions, tradeoffs, and next steps
- clear explanation of completed requirements
- brief walkthrough for the strongest demo flows
- comments only where they clarify non-obvious logic

Documentation should explain why decisions were made, not just what files exist.

## Code Style

- Prefer readability over cleverness
- Keep functions small and name them by behavior
- Avoid deeply nested conditionals when guard clauses improve clarity
- Keep naming consistent across transactions, refunds, flags, and decisions
- Co-locate related files when it improves maintainability
- Do not leave dead code, placeholder TODO clutter, or unused abstractions

## Git and Delivery Discipline

- Make changes intentionally and keep scope coherent
- Do not revert user changes without approval
- Do not introduce unrelated refactors while implementing feature work
- Keep the repo runnable at meaningful checkpoints
- Favor incremental, reviewable progress over large opaque drops

## Definition of Quality for This Repo

An implementation is considered acceptable only if it is:

- coherent in architecture
- realistic in domain behavior
- polished enough for a stakeholder demo
- safe in its refund decision UX
- documented clearly
- maintainable by another engineer after handoff

## When in Doubt

Prefer:

- explicitness over magic
- deterministic behavior over randomness
- a smaller polished scope over a larger unfinished scope
- operational clarity over decorative complexity
