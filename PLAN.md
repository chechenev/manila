# Manila Refund Workbench Plan

## Goal

Build a production-ready local web application for LuzonMart's refund operations team using **React + TypeScript + Vite**. The product should help operators investigate refund requests quickly, reduce duplicate and unsafe refunds, and expose refund patterns through analytics.

This plan intentionally stops before implementation. It defines scope, milestones, architecture direction, UX priorities, and delivery order so we can align before writing code.

## Product Framing

### Primary user

Operations analysts and managers who process 400-600 refund requests per day and need:

- Fast triage of pending refund requests
- Strong visibility into refund risk and duplicate scenarios
- Confidence before approving or rejecting a refund
- Clear aggregate insights into refund trends and operational pain points

### Core product promise

The interface should answer three questions immediately:

1. Which refund requests need attention right now?
2. Which of them are unsafe to process?
3. What refund patterns are hurting the business?

## Success Criteria

The first implementation should satisfy all required acceptance criteria and feel polished enough for a live demo:

- Local app runs reliably with straightforward setup
- Refund explorer is the primary workflow and is usable without explanation
- Risk flags are prominent, understandable, and traceable to rules
- Filters/search are fast and intuitive
- Analytics view explains refund behavior clearly
- Mock data is realistic, deterministic, and covers all challenge scenarios
- Documentation explains scope, tradeoffs, and next steps clearly

## Proposed Scope

### In scope for v1

- Refund Request Explorer as the main workspace
- Drill-down details panel or drawer for selected request
- Risk scoring and warning badges with rule explanations
- Search and filters:
  - Date range
  - Payment method
  - Refund amount range
  - Customer
  - Transaction status
- Actions:
  - Approve
  - Reject
  - Flag for review
- Analytics dashboard with:
  - Refund volume over time
  - Refund amount over time
  - Breakdown by payment method
  - Refund-to-transaction ratio
  - Average time from purchase to refund request
  - High-risk / high-refund customers
- Realistic seeded test data
- Responsive UI for desktop-first operations usage with acceptable tablet support
- Basic batch workflow with safety review before submission
- Lightweight "what-if" simulation for individual refunds and current filtered selection

### Out of scope for v1

- Real payment gateway integrations
- Authentication / multi-user permissions
- Persistent backend or database
- True reconciliation engine or payout orchestration
- Audit exports, CSV import, and external case notes

## Production-Ready Interpretation

For this challenge, "production ready" should mean:

- Clean modular architecture
- Typed domain models and deterministic derived state
- Reusable UI primitives and consistent design system tokens
- Test coverage for risk rules and critical UI logic
- Stable seeded data generation
- Good empty, loading, and edge-case states
- Accessibility-conscious interactions
- Clear documentation and maintainable folder structure

It will not mean full enterprise backend infrastructure, but the codebase should be structured so one can add APIs later without rework.

## Proposed UX Strategy

### Information hierarchy

The app should open on the refund explorer, not the dashboard. The operations team's main task is actioning requests, so the explorer should dominate the product.

### Main layout

- Left/top: high-level queue metrics and active filter summary
- Center: refund request table or card grid optimized for scanning
- Right or slide-over: selected request details with timeline, risk reasons, and action controls

### Visual language

- Strong operational contrast, not generic dashboard styling
- Clear severity states:
  - Critical: potential double loss or invalid refund
  - Warning: suspicious but reviewable
  - Safe: no known blockers
- Use color, icons, labels, and supporting copy together so risk is understandable without relying on color alone

### Key interactions

- Multi-filter queue narrowing without page reload
- Single-click row selection with rich detail context
- Batch selection with preflight warnings
- Simulation panel that answers "what changes if I approve this?"

## Domain Model Direction

### Core entities

- Transaction
- RefundRequest
- Customer
- RefundDecision
- RiskFlag

### Suggested important fields

Transaction:

- id
- customerId
- customerName
- paymentMethod
- transactionAmount
- transactionDate
- status
- capturedAt
- settledAt
- chargebackFiledAt

RefundRequest:

- id
- transactionId
- customerId
- requestedAmount
- requestDate
- refundDestinationType
- reason
- status
- existingRefundsTotal
- duplicateGroupId

RiskFlag:

- code
- severity
- title
- explanation
- blocking

### Derived calculations

- Refund age
- Days from purchase to request
- Historical refund count per customer in rolling 7 days
- Duplicate candidates by transaction/customer/amount/time proximity
- Refund ratio by payment method
- Net exposure of pending queue

## Risk Rules for v1

The initial risk engine should be deterministic and transparent. Every flag in the UI should map to an explicit rule.

### Critical rules

- Original transaction status is `authorized` and never captured
- Transaction already has `chargeback_filed`
- Requested refund amount exceeds original transaction amount
- Confirmed or highly probable duplicate refund request
- Previous refund exists but gateway result is ambiguous / timed out

### Warning rules

- Customer has 3 or more refunds in past 7 days
- Multiple pending requests from same customer in short window
- COD refund requires alternate payout path
- Large partial refund close to full value

### Nice-to-have scoring layer

- Aggregate flags into a visible risk level: Safe / Review / Critical

## Data Plan

### Dataset requirements

- 300+ original transactions across 2-3 months
- 100+ refund requests
- At least 4 payment methods:
  - GCash
  - Maya
  - Credit Card
  - Cash on Delivery
- Full status coverage:
  - authorized
  - captured
  - settled
  - refunded
  - failed
  - chargeback_filed

### Required seeded scenarios

- 3-5 duplicate refund requests
- 2-3 requests against `authorized` transactions
- 2-3 requests against `chargeback_filed` transactions
- 1-2 over-refund attempts
- 1-2 customers with 4+ refunds in a short period
- Small, medium, and high refund amounts

### Data generation approach

- Use a deterministic generator with a fixed seed
- Store generated output as local JSON for stable demos
- Keep a generation script so scenarios can evolve without hand-editing large files

## Technical Direction

### Stack

- React
- TypeScript
- Vite

### Recommended supporting choices

- React Router for two main views: Explorer and Analytics
- Zustand or a small typed local store for queue state and selections
- TanStack Table for explorer ergonomics if needed
- Recharts or Visx for charts
- Zod for runtime validation of mock data
- Vitest + Testing Library for tests
- Playwright for end-to-end coverage

### Deployment target

- Vercel

### Non-functional priorities

- Accessibility is a required quality bar, not a polish item
- Mobile screen support is required alongside desktop-first operations UX

These are recommendations, not final implementation commitments, until plan approval.

## Proposed App Structure

```text
manila-refund-workbench/
  src/
    app/
    components/
    features/
      refunds/
      analytics/
      simulation/
      bulk-actions/
    domain/
    data/
    lib/
    styles/
    test/
  scripts/
  docs/
  public/
```

## Milestones

### Milestone 0: Discovery and UX Blueprint

Deliverables:

- Finalized product scope
- Screen inventory
- Data model definition
- Risk rules definition
- Visual direction and layout plan

Exit criteria:

- We agree on scope and implementation priorities
- No code written yet beyond repo/document scaffolding

### Milestone 1: Project Foundation

Deliverables:

- Vite React TypeScript app scaffold
- Linting, formatting, and test setup
- Playwright setup for E2E testing
- Base design tokens and layout shell
- Initial routing and state structure

Exit criteria:

- App runs locally
- Foundation is ready for feature work
- A Vercel-friendly frontend baseline is in place

### Milestone 2: Seed Data and Domain Logic

Deliverables:

- Deterministic mock data generator
- Static generated dataset committed to repo
- Domain typings and selectors
- Risk detection engine with unit tests

Exit criteria:

- All challenge scenarios are represented in data
- Risk rules pass tests

### Milestone 3: Refund Explorer

Deliverables:

- Queue view with sorting, filtering, and search
- Visual risk indicators
- Selection state and detail panel
- Approve / reject / flag actions in local state

Exit criteria:

- Ops user can inspect and action a refund end-to-end in UI

### Milestone 4: Analytics Dashboard

Deliverables:

- Time-series refund metrics
- Payment method breakdown
- Ratio and delay metrics
- High-refund customer identification

Exit criteria:

- Dashboard surfaces clear business insights tied to mock data

### Milestone 5: Stretch Workflow Safety

Deliverables:

- Batch selection and preflight review
- Exclude flagged items from bulk action
- What-if simulation for single refund and filtered queue impact

Exit criteria:

- Stretch functionality is coherent and demoable

### Milestone 6: Hardening and Demo Readiness

Deliverables:

- QA pass on responsiveness and edge states
- QA pass on accessibility basics
- README
- Brief written walkthrough
- Final polish on visual hierarchy and microcopy

Exit criteria:

- Demo-ready local application with documentation

## Execution Order Recommendation

If time becomes constrained, build in this order:

1. Explorer shell
2. Risk engine
3. Filters and detail panel
4. Analytics dashboard
5. Batch actions
6. Simulation
7. Final polish and docs

This keeps the strongest demo path intact even if stretch scope is reduced.

## Quality Bar

### Engineering

- No untyped data flow
- No duplicated business rules across components
- Clear separation between domain logic and presentation
- Tests around risk rules, selectors, and key user flows
- E2E coverage for critical flows

### UX

- Queue readable at a glance
- Risk states understandable in under 3 seconds
- Important actions always contextualized by transaction details
- Analytics are explanatory, not decorative
- Core views remain usable on mobile-sized screens
- Accessibility is treated as a shipped requirement

### Demo readiness

- Seeded scenarios are easy to show intentionally
- README explains exactly where the strongest examples are
- Interface appears polished enough for stakeholder review

## Risks and Tradeoffs

### Likely risks

- Overbuilding stretch goals at the expense of main explorer polish
- Time lost on charts and styling before queue workflows feel strong
- Mock data becoming unrealistic or too random to explain in demo

### Tradeoff recommendation

Prefer:

- Fewer features with stronger clarity
- Deterministic scenarios over excessive randomization
- Strong detail panel and risk explanations over excessive chart variety

## Definition of Done for Plan Approval

We should approve this plan if we agree on:

- React + TypeScript + Vite stack
- Explorer-first product hierarchy
- Deterministic mock-data approach
- Transparent rule-based risk engine
- Playwright for E2E testing
- Vercel as the deployment target
- Accessibility and mobile support as required quality bars
- Milestone order and stretch-goal priority

Once approved, implementation should begin with project scaffolding and seed-data/domain setup.
