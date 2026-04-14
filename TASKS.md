# TASKS.md

## Purpose

This file is the execution checklist for the Manila Refund Workbench. It translates the approved plan into milestone-level tasks with clear verification points.

We will use it as the working source of truth during implementation:

- complete one milestone at a time
- verify what is done vs not done
- avoid jumping into stretch work before the core flow is strong

Status markers to use later:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[-]` Deferred / intentionally skipped

## Project-Level Rules

- Do not start a later milestone if the current one is materially incomplete unless we explicitly agree to do so
- Keep all documentation in English
- Keep the app runnable at the end of each milestone when possible
- Treat the refund explorer as the primary product workflow
- Prioritize production-grade structure and clarity over feature count
- Accessibility is required, not optional
- Mobile-sized screen support is required
- End-to-end coverage should use Playwright
- The app should be deployable to Vercel

---

## Milestone 0: Discovery and UX Blueprint

### Objective

Lock the scope, architecture direction, product framing, and implementation order before writing feature code.

### Tasks

- [x] Confirm the stack: React + TypeScript + Vite
- [x] Confirm the product hierarchy: explorer first, analytics second
- [x] Confirm the production-ready interpretation for this challenge
- [x] Confirm the v1 in-scope features
- [x] Confirm the stretch goals and their priority
- [x] Confirm non-functional requirements:
  - accessibility
  - mobile support
  - Playwright E2E
  - Vercel deployment
- [x] Finalize the risk rule list for v1
- [x] Finalize the domain entities and key fields
- [x] Finalize the seeded data requirements and scenario coverage
- [x] Finalize the intended app structure
- [x] Finalize implementation order
- [x] Create repo-level guidance documents
- [x] Ensure no application code has been started before approval

### Deliverables

- `PLAN.md`
- `AGENTS.md`
- `TASKS.md`
- `MILESTONE-0-DECISIONS.md`

### Verification Checklist

- [x] Plan exists and is readable
- [x] Code standards exist and are readable
- [x] Tasks are broken down by milestone
- [x] No app scaffold or feature code exists yet
- [x] New non-functional requirements are documented

### Exit Criteria

- The plan is explicitly approved
- We have a shared understanding of milestone order
- We are ready to begin implementation without major ambiguity

---

## Milestone 1: Project Foundation

### Objective

Create a production-grade frontend foundation that is ready for feature implementation.

### Tasks

- [x] Scaffold a Vite React TypeScript application
- [x] Set up the base folder structure aligned with `PLAN.md` and `AGENTS.md`
- [x] Configure TypeScript strictness and verify the project compiles
- [x] Add linting and formatting setup
- [x] Add test tooling with Vitest and Testing Library
- [x] Add Playwright E2E setup
- [x] Set up a basic routing structure for:
  - Explorer
  - Analytics
- [x] Create the application shell:
  - page layout
  - navigation
  - top-level workspace framing
- [x] Create a base design token system:
  - color tokens
  - spacing tokens
  - typography tokens
  - surface and border tokens
- [x] Add global styles and reset/base styles
- [x] Create a small reusable UI primitive layer:
  - button
  - badge
  - panel/card
  - input
  - select
  - section header
- [x] Verify responsive behavior at core breakpoints
- [x] Verify mobile-sized screen baseline behavior
- [x] Add a placeholder empty shell for both main routes
- [x] Add a README starter with setup instructions placeholder
- [x] Ensure the baseline is compatible with Vercel deployment

### Deliverables

- Running React app
- Base route shell
- Shared design tokens and foundational components
- Test and lint setup

### Verification Checklist

- [x] `npm install` works
- [x] `npm run dev` starts the app
- [x] `npm run build` succeeds
- [x] `npm run test` runs
- [x] Playwright test command runs
- [x] `npm run lint` runs
- [x] Explorer route renders
- [x] Analytics route renders
- [x] Foundation styles are consistent and intentional
- [x] Baseline works for mobile-sized screens
- [x] Vercel deployment assumptions are satisfied

### Exit Criteria

- The repo has a stable frontend foundation
- Future milestone work can focus on product features rather than setup

---

## Milestone 2: Seed Data and Domain Logic

### Objective

Create realistic, deterministic mock data and the domain logic layer that powers risk detection and analytics.

### Tasks

- [x] Define TypeScript domain models for:
  - transaction
  - refund request
  - customer
  - risk flag
  - refund decision/action state
- [x] Add runtime validation schemas for seeded data
- [x] Design the deterministic data generation strategy
- [x] Implement a seed-based data generator script
- [x] Generate 300+ transactions across 2-3 months
- [x] Generate 100+ refund requests linked to transactions
- [x] Ensure payment method distribution includes:
  - GCash
  - Maya
  - Credit Card
  - Cash on Delivery
- [x] Ensure status coverage includes:
  - authorized
  - captured
  - settled
  - refunded
  - failed
  - chargeback_filed
- [x] Seed scenario: duplicate refund requests
- [x] Seed scenario: refunds against authorized-only transactions
- [x] Seed scenario: refunds against chargeback transactions
- [x] Seed scenario: refund amount greater than original amount
- [x] Seed scenario: customers with concentrated refund bursts
- [x] Seed scenario: varied refund sizes from small to large
- [x] Commit generated data output for stable demos
- [x] Implement selectors/helpers for:
  - find transaction by refund request
  - calculate refund age
  - calculate purchase-to-request delay
  - customer refund counts in rolling windows
  - pending exposure totals
  - payment method summaries
- [x] Implement duplicate detection logic
- [x] Implement rule-based risk flagging logic
- [x] Implement overall risk level derivation
- [x] Add unit tests for all rules
- [x] Add unit tests for mixed-scenario cases
- [x] Add unit tests for key selectors

### Deliverables

- Seed generator
- Generated dataset
- Domain types and selectors
- Risk engine with tests

### Verification Checklist

- [x] Data validates successfully
- [x] Seed output is deterministic across runs
- [x] Every required challenge scenario is present
- [x] Risk rules produce expected flags
- [x] Duplicate detection is explainable and test-covered
- [x] Analytics selectors can consume the seeded data cleanly

### Exit Criteria

- The data and domain layer are stable enough to support UI work without major redesign

---

## Milestone 3: Refund Explorer

### Objective

Build the main operational workspace for reviewing and actioning refund requests.

### Tasks

- [ ] Design the explorer information hierarchy
- [ ] Implement a queue header summary with key counts:
  - total pending
  - critical risk count
  - warning count
  - pending refund amount exposure
- [ ] Implement the refund request listing component
- [ ] Decide and implement the primary list format:
  - table
  - card list
  - hybrid responsive behavior
- [ ] Display for each refund request:
  - original transaction amount
  - requested refund amount
  - customer identifier
  - payment method
  - transaction date
  - refund request date
  - transaction status
  - risk level
- [ ] Implement sorting behavior for operational usefulness
- [ ] Implement text search
- [ ] Implement filters for:
  - date range
  - payment method
  - refund amount range
  - customer
  - transaction status
- [ ] Implement filter summary / active chips
- [ ] Implement zero-results state
- [ ] Implement refund selection behavior
- [ ] Implement a details panel or drawer
- [ ] Show full context in the details panel:
  - transaction metadata
  - request metadata
  - historical refund context
  - existing/reflected risk flags
  - rule explanations
- [ ] Add a visual timeline or lifecycle summary if useful
- [ ] Implement action controls:
  - approve
  - reject
  - flag for review
- [ ] Reflect action state in UI
- [ ] Add confirmation or safety messaging for risky items
- [ ] Ensure keyboard and focus behavior are reasonable
- [ ] Ensure the explorer remains usable on mobile-sized screens
- [ ] Add tests for core explorer interactions
- [ ] Add at least one Playwright explorer flow

### Deliverables

- Working refund explorer
- Filtering and search
- Detail panel
- Action workflow in local state

### Verification Checklist

- [ ] User can scan the queue quickly
- [ ] Risky items stand out clearly
- [ ] Search and filters narrow results correctly
- [ ] Selecting an item shows full context
- [ ] Actions update local state predictably
- [ ] The explorer works on realistic seeded data

### Exit Criteria

- A demo user can complete the main refund review workflow confidently

---

## Milestone 4: Analytics Dashboard

### Objective

Build a secondary analytics workspace that helps identify refund trends and business issues.

### Tasks

- [ ] Define the dashboard layout and narrative order
- [ ] Implement top-line KPI cards for:
  - total refund count
  - total refund amount
  - refund-to-transaction ratio
  - average purchase-to-refund-request delay
- [ ] Implement refund volume over time chart
- [ ] Implement refund amount over time chart
- [ ] Implement payment method breakdown visualization
- [ ] Implement refund-to-transaction ratio comparison by payment method
- [ ] Implement a view for high-refund or high-risk customers
- [ ] Add clear labels and explanatory copy for each visualization
- [ ] Ensure charts degrade gracefully on smaller screens
- [ ] Ensure analytics remain readable on mobile-sized screens
- [ ] Ensure dashboard metrics are sourced from shared domain selectors
- [ ] Add tests for analytics selectors and any critical chart mapping logic

### Deliverables

- Analytics route with actionable insights
- Visual comparison of refund behavior across payment methods and time

### Verification Checklist

- [ ] Dashboard answers the "what patterns are hurting us?" question
- [ ] Metrics match the seeded data
- [ ] Charts are readable and not decorative filler
- [ ] Operators can identify suspicious customers and payment-method trends

### Exit Criteria

- The analytics view adds real investigative value beyond the explorer

---

## Milestone 5: Stretch Workflow Safety

### Objective

Add batch tooling and simulation features that strengthen decision confidence without weakening clarity.

### Tasks

- [ ] Implement multi-select behavior in the explorer
- [ ] Add batch action entry point
- [ ] Build a preflight review surface for selected items
- [ ] Summarize the batch:
  - item count
  - total amount
  - critical flags present
  - warnings present
- [ ] Allow excluding flagged items from the batch
- [ ] Prevent or strongly warn on unsafe batch processing
- [ ] Implement single-refund what-if simulation
- [ ] Simulate whether approval would create or worsen duplicate exposure
- [ ] Simulate financial impact for the current filtered view
- [ ] Present simulation results in a simple, understandable format
- [ ] Add tests for batch-safety logic and simulation helpers

### Deliverables

- Batch workflow with safety review
- What-if simulation tooling

### Verification Checklist

- [ ] Batch selection is easy to understand
- [ ] Risky items are surfaced before confirming bulk actions
- [ ] Excluding flagged items works as intended
- [ ] Simulation helps explain impact rather than adding confusion

### Exit Criteria

- Stretch features feel integrated and demo-worthy, not bolted on

---

## Milestone 6: Hardening and Demo Readiness

### Objective

Polish the application, close quality gaps, and prepare the repo for handoff/demo.

### Tasks

- [ ] Review visual consistency across screens
- [ ] Improve spacing, hierarchy, and microcopy where needed
- [ ] Audit empty, edge, and extreme-value states
- [ ] Audit accessibility basics:
  - focus states
  - semantics
  - contrast
  - labels
- [ ] Audit responsiveness on desktop and tablet widths
- [ ] Audit responsiveness on mobile-sized widths
- [ ] Review loading and fallback behavior if any asynchronous patterns exist
- [ ] Clean up dead code and leftover placeholders
- [ ] Tighten comments so they explain only non-obvious logic
- [ ] Complete the README with:
  - how to run
  - completed requirements
  - design decisions
  - tradeoffs
  - what to add next
- [ ] Add a brief walkthrough section with the strongest demo path
- [ ] Verify seeded scenarios are easy to demo intentionally
- [ ] Run final quality checks:
  - install
  - build
  - tests
  - e2e
  - lint
- [ ] Prepare a short final changelog / delivery summary

### Deliverables

- Polished local app
- Final README
- Demo-ready repo

### Verification Checklist

- [ ] App is visually coherent
- [ ] Key workflows are stable
- [ ] Docs are clear and complete
- [ ] Final quality checks pass

### Exit Criteria

- The project is ready for submission and local walkthrough

---

## Cross-Milestone Tracking

These should be monitored throughout the project, not only at the end.

### Engineering Quality

- [ ] No `any` in core domain logic
- [ ] Domain rules are not duplicated in components
- [ ] Seeded data remains deterministic
- [ ] Shared types stay consistent across features
- [ ] Tests cover business-critical logic

### Product Quality

- [ ] Risk explanations remain human-readable
- [ ] Explorer stays faster and more polished than secondary views
- [ ] Analytics remain actionable
- [ ] Stretch features do not compromise clarity

### Documentation Quality

- [ ] Docs are kept current as implementation evolves
- [ ] Setup instructions are accurate
- [ ] Tradeoffs are documented honestly
- [ ] Deployment instructions for Vercel remain accurate

---

## Suggested Working Order

1. Finish and approve Milestone 0
2. Execute Milestone 1 fully
3. Execute Milestone 2 fully
4. Execute Milestone 3 fully
5. Execute Milestone 4 fully
6. Decide whether Milestone 5 is worth the remaining time
7. Finish with Milestone 6

---

## Progress Log

Use this section later to note milestone outcomes, blockers, and scope adjustments.

### Milestone 0

- Status: `[x]`
- Notes:
  - `PLAN.md` created
  - `AGENTS.md` created
  - `TASKS.md` created
  - `MILESTONE-0-DECISIONS.md` created
  - Added Playwright, Vercel, accessibility, and mobile support requirements
  - Milestone 0 approved
  - Ready to begin Milestone 1

### Milestone 1

- Status: `[x]`
- Notes:
  - Vite React TypeScript foundation created
  - Explorer and Analytics routes wired
  - Shared app shell and UI primitives added
  - Design tokens and responsive global styles added
  - Vitest baseline passes
  - Playwright smoke coverage passes on desktop and mobile emulation
  - `build`, `lint`, `test`, `typecheck`, and `dev` workflow verified

### Milestone 2

- Status: `[x]`
- Notes:
  - Deterministic seed generator added with committed JSON output
  - Domain models and Zod schemas added
  - Selectors for exposure, delay, customer velocity, and payment method summaries added
  - Duplicate detection and rule-based risk engine added
  - Seed coverage, selector, and risk tests all pass

### Milestone 3

- Status: `[ ]`
- Notes:

### Milestone 4

- Status: `[ ]`
- Notes:

### Milestone 5

- Status: `[ ]`
- Notes:

### Milestone 6

- Status: `[ ]`
- Notes:
