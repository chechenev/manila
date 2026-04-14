# Milestone 0 Decision Record

## Purpose

This document captures the proposed decisions for Milestone 0 so implementation can begin with minimal ambiguity once approved.

It is intentionally concise and approval-oriented.

## Proposed Decisions

### 1. Stack

Approved stack for implementation:

- React
- TypeScript
- Vite

Supporting tooling to use unless a better reason appears during implementation:

- React Router
- Zustand
- Zod
- Vitest
- Testing Library
- Recharts
- Playwright

Deployment target:

- Vercel

## 2. Product Hierarchy

The application should be structured around two primary workspaces:

1. Refund Explorer
2. Analytics Dashboard

The Refund Explorer is the default landing view and the primary workflow.

## 3. Production-Ready Scope for This Challenge

For this submission, "production ready" means:

- strong architecture and maintainable folder structure
- deterministic and validated mock data
- explicit domain logic for risk and analytics
- reusable UI foundation
- tested business-critical logic
- polished UX for the main workflow
- accessibility as a required quality bar
- mobile-sized screen usability
- deployment readiness for Vercel
- complete English documentation

It does **not** mean:

- a real backend
- payment gateway integration
- authentication
- persistence beyond local app state

## 4. v1 Scope

### Core scope

- refund explorer with filtering and search
- rich refund detail view
- risk detection and warning explanations
- approve / reject / flag actions in local state
- analytics dashboard with actionable business metrics
- deterministic seeded test data covering all required scenarios

### Included stretch scope if time allows

- batch actions with safety review
- what-if simulation for single refunds and filtered views

## 5. Risk Rule Direction

The risk engine should be rule-based and fully explainable.

### Critical rules

- refund requested on a transaction that is only authorized
- refund requested on a transaction with chargeback already filed
- refund amount exceeds original transaction amount
- duplicate or highly probable duplicate refund request
- ambiguous prior refund outcome that creates duplicate risk

### Warning rules

- customer has 3+ refunds in the past 7 days
- multiple pending requests from same customer in a short time window
- COD refund requires an alternate payout path
- partial refund is unusually close to full value

## 6. Data Direction

The application should use deterministic local data with:

- 300+ transactions
- 100+ refund requests
- 2-3 months of activity
- 4 payment methods
- all required statuses
- all required challenge scenarios

Implementation should include both:

- a generation script
- generated output committed to the repo for a stable demo

## 7. Architecture Direction

Project structure should follow:

```text
src/
  app/
  components/
  data/
  domain/
  features/
  lib/
  styles/
  test/
```

Key rule:

- business logic must not live inline inside large UI components

## 8. Delivery Order

Implementation should proceed in this order:

1. Project foundation
2. Seed data and domain logic
3. Refund explorer
4. Analytics dashboard
5. Batch actions
6. Simulation
7. Hardening and documentation

## 9. Non-Functional Requirements

The following are required, not optional:

- accessibility-conscious implementation
- support for mobile-sized screens
- Playwright end-to-end test coverage for critical flows
- Vercel-compatible deployment setup

## 10. Milestone 0 Approval Standard

Milestone 0 should be considered complete when:

- the plan is accepted
- the repository guidance documents exist
- the execution checklist exists
- there is no disagreement on the implementation order
- we are ready to begin Milestone 1 without revisiting core scope

## 11. Recommended Approval Outcome

Recommended approval:

- approve Milestone 0 as the working baseline
- allow implementation to begin with Milestone 1

If we later need to reduce scope due to time, we should cut stretch features before reducing explorer quality.
