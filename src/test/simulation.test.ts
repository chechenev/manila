import { describe, expect, it } from 'vitest'
import { refundWorkbenchSeedData } from '../data/loadSeedData.ts'
import { enrichAllRefundRequests } from '../domain/risk.ts'
import {
  buildBatchSafetySummary,
  buildFilteredViewImpact,
  simulateRefundApproval,
} from '../domain/simulation.ts'

const enrichedRefunds = enrichAllRefundRequests(refundWorkbenchSeedData)

describe('batch safety helpers', () => {
  it('marks a batch blocked when included items still have blocking flags', () => {
    const summary = buildBatchSafetySummary(enrichedRefunds.slice(0, 3))

    expect(summary.selectedCount).toBe(3)
    expect(summary.state).toBe('blocked')
    expect(summary.blockingCount).toBeGreaterThan(0)
  })

  it('recalculates included totals when flagged items are excluded', () => {
    const selected = enrichedRefunds.slice(0, 3)
    const excludedIds = selected
      .filter((refund) => refund.riskLevel !== 'safe')
      .map((refund) => refund.id)
    const summary = buildBatchSafetySummary(selected, excludedIds)

    expect(summary.excludedCount).toBe(excludedIds.length)
    expect(summary.includedCount).toBe(selected.length - excludedIds.length)
  })
})

describe('simulation helpers', () => {
  it('summarizes filtered queue exposure by risk level', () => {
    const impact = buildFilteredViewImpact(enrichedRefunds)

    expect(impact.requestCount).toBe(enrichedRefunds.length)
    expect(impact.totalAmount).toBeGreaterThan(0)
    expect(
      impact.criticalAmount + impact.reviewAmount + impact.safeAmount,
    ).toBeCloseTo(impact.totalAmount, 6)
  })

  it('flags overlap risk when approving a duplicate-prone refund', () => {
    const duplicateRefund = enrichedRefunds.find(
      (refund) => refund.duplicateCandidateIds.length > 0,
    )

    expect(duplicateRefund).toBeDefined()

    const simulation = simulateRefundApproval(duplicateRefund!, enrichedRefunds)

    expect(
      simulation.state === 'blocked' || simulation.state === 'review',
    ).toBe(true)
    expect(simulation.duplicateExposureCount).toBeGreaterThan(0)
  })
})
