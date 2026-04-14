# Milestone 5 Prep

## Purpose

This document prepares the implementation of **Milestone 5: Stretch Workflow Safety** without changing runtime code.

The goal is to make the next coding pass fast, predictable, and safe while another agent reviews the current application state.

## Milestone Goal

Add batch tooling and simulation features that strengthen decision confidence without weakening clarity.

The stretch work should feel like a natural extension of the existing Refund Explorer rather than a second disconnected workflow.

## Product Constraints

- The current Refund Explorer remains the primary workflow.
- Batch actions must not hide or downgrade risk information.
- Simulation must explain impact clearly instead of introducing opaque logic.
- Mobile behavior must remain usable even if the primary batch flow is desktop-first.
- No backend should be introduced for this milestone.

## Proposed Scope

### In scope

- Multi-select on refund requests in the explorer
- Batch review entry point for selected requests
- Preflight batch summary with:
  - item count
  - total requested amount
  - critical risk count
  - warning count
  - excluded item count
- Ability to exclude risky items from the batch review
- Strong warning or soft block for unsafe batch processing
- Single-refund simulation inside the refund detail modal
- Filter-view simulation for current explorer results
- Clear financial impact summary for current filtered selection

### Out of scope

- Real execution against gateways
- Persistent queue mutations
- Background jobs
- True reconciliation engine behavior
- Export/report generation

## UX Direction

### Explorer multi-select

The queue row should support an explicit selection control rather than relying on row-click only.

Recommended interaction:

- Row click opens the existing detail modal
- Checkbox or selection affordance toggles inclusion in batch review
- A sticky or visually anchored selection bar appears when at least one item is selected

### Batch review surface

Recommended format:

- Modal or large drawer
- Summary panel first
- Included / excluded sections second
- Final action area last

The preflight review should answer:

1. How many items are in scope?
2. What total amount is at risk?
3. Which items are unsafe?
4. What will be skipped if we exclude flagged items?

### Simulation

Recommended placement:

- In the existing refund detail modal for single-refund what-if
- In the explorer controls area or selection bar for filtered-view financial impact

The simulation should answer:

- Would approving this request worsen duplicate exposure?
- Would it overlap with another pending request for the same customer or transaction?
- How much requested value is represented by the current filtered view?
- How much of that exposure is currently flagged as critical?

## Proposed Information Architecture

### Explorer additions

- Selection checkbox per queue row
- Selection state badge or counter near the queue controls
- `Open Bulk Review` becomes a real action and is disabled when nothing is selected

### Batch review modal sections

- Batch summary
- Blocking items
- Review-only items
- Safe items
- Excluded items
- Final action buttons

### Detail modal additions

- New simulation card below risk flags
- Short explanatory copy
- One compact outcome summary instead of a long diagnostic dump

## State Model Proposal

### Local UI state

Use local feature state in the explorer page unless shared cross-route state becomes necessary.

Suggested state:

```ts
type BatchSelectionState = Record<string, boolean>

type BatchExclusionState = Record<string, boolean>

type BatchReviewState = {
  isOpen: boolean
}
```

### Derived state

Selectors should compute:

- selected refund requests
- included refund requests
- excluded refund requests
- batch totals
- grouped risk counts
- simulation results

Avoid storing derived totals in component state.

## Domain Additions

### New types

Suggested additions in `src/domain/refunds.ts`:

- `BatchSafetySummary`
- `BatchReviewItem`
- `BatchSimulationResult`
- `SingleRefundSimulationResult`

### New selector helpers

Suggested additions in `src/domain/selectors.ts` or a new `src/domain/batch.ts`:

- `buildBatchSafetySummary(enrichedRefunds)`
- `groupBatchItemsBySafety(enrichedRefunds)`
- `calculateFilteredViewExposure(enrichedRefunds)`

### New simulation helpers

Suggested new module:

- `src/domain/simulation.ts`

Suggested functions:

- `simulateRefundApproval(refund, context)`
- `simulateBatchApproval(refunds, context)`
- `buildFilteredViewImpact(refunds)`

## Safety Rules

### Batch preflight behavior

Critical items should not silently flow through the batch.

Recommended rule set:

- If any selected item has blocking flags, show a strong warning state
- Allow proceeding only if the operator explicitly excludes blocking items
- If only warning-level items remain, allow proceed with review copy
- If all remaining items are safe, show a clean confirmation state

### Simulation rule outputs

Single-refund simulation should report:

- duplicate exposure risk
- chargeback conflict risk
- invalid capture/refundability risk
- resulting requested amount exposure

Filtered-view simulation should report:

- total pending requests in view
- total requested amount in view
- total critical exposure in view
- total warning exposure in view

## Component Plan

Recommended additions:

- `src/features/refunds/components/RefundSelectionCheckbox.tsx`
- `src/features/refunds/components/BatchActionBar.tsx`
- `src/features/refunds/components/BatchReviewModal.tsx`
- `src/features/refunds/components/BatchSummaryCard.tsx`
- `src/features/refunds/components/SimulationCard.tsx`

The explorer page should orchestrate these pieces, not own all rendering inline.

## Implementation Order

### Slice 1

- Add selection state
- Add checkbox UI
- Add selected-count action bar

### Slice 2

- Add batch summary selectors
- Wire `Open Bulk Review`
- Render preflight modal with grouped items

### Slice 3

- Add exclusion controls for flagged items
- Recompute summary live as exclusions change
- Add final action messaging

### Slice 4

- Add single-refund simulation card
- Add filtered-view impact summary
- Add copy and empty states

### Slice 5

- Add tests and final polish

## Testing Plan

### Domain tests

- batch summary totals
- excluded item recalculation
- blocking vs warning grouping
- single-refund simulation outputs
- filtered-view impact outputs

### Component tests

- row selection toggles correctly
- action bar appears only when selection exists
- batch modal opens with selected items
- excluding flagged items updates totals
- simulation renders expected summary

### E2E test candidate

- select several refunds
- open batch review
- exclude critical items
- verify updated totals and warnings

## Known Risks

- Batch state can become difficult to reason about if selection and exclusion are mixed inline in the explorer component
- The existing explorer file is already substantial, so new UI should be split into focused subcomponents
- The client bundle is already large, so avoid introducing unnecessary charting or duplicated data transforms in this milestone

## Definition of Done

Milestone 5 is ready to implement when:

- component boundaries are agreed
- state shape is agreed
- safety rules are explicit
- simulation scope is limited to understandable outputs
- tests are defined before the coding pass starts
