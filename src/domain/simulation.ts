import type {
  BatchProcessState,
  BatchSafetySummary,
  EnrichedRefundRequest,
  FilteredViewImpact,
  SingleRefundSimulationResult,
} from './refunds.ts'

function hasBlockingFlags(refund: EnrichedRefundRequest) {
  return refund.riskFlags.some((flag) => flag.blocking)
}

export function buildBatchSafetySummary(
  selectedRefunds: EnrichedRefundRequest[],
  excludedRefundIds: string[] = [],
): BatchSafetySummary {
  const excludedIdSet = new Set(excludedRefundIds)
  const includedRefunds = selectedRefunds.filter(
    (refund) => !excludedIdSet.has(refund.id),
  )
  const excludedRefunds = selectedRefunds.filter((refund) =>
    excludedIdSet.has(refund.id),
  )
  const criticalCount = includedRefunds.filter(
    (refund) => refund.riskLevel === 'critical',
  ).length
  const reviewCount = includedRefunds.filter(
    (refund) => refund.riskLevel === 'review',
  ).length
  const safeCount = includedRefunds.filter(
    (refund) => refund.riskLevel === 'safe',
  ).length
  const blockingCount = includedRefunds.filter(hasBlockingFlags).length
  const state: BatchProcessState =
    blockingCount > 0 ? 'blocked' : reviewCount > 0 ? 'review' : 'safe'

  return {
    selectedCount: selectedRefunds.length,
    includedCount: includedRefunds.length,
    excludedCount: excludedRefunds.length,
    selectedAmount: selectedRefunds.reduce(
      (total, refund) => total + refund.requestedAmount,
      0,
    ),
    includedAmount: includedRefunds.reduce(
      (total, refund) => total + refund.requestedAmount,
      0,
    ),
    excludedAmount: excludedRefunds.reduce(
      (total, refund) => total + refund.requestedAmount,
      0,
    ),
    safeCount,
    reviewCount,
    criticalCount,
    blockingCount,
    state,
  }
}

export function buildFilteredViewImpact(
  refunds: EnrichedRefundRequest[],
): FilteredViewImpact {
  return refunds.reduce<FilteredViewImpact>(
    (summary, refund) => {
      summary.requestCount += 1
      summary.totalAmount += refund.requestedAmount

      if (refund.riskLevel === 'critical') {
        summary.criticalCount += 1
        summary.criticalAmount += refund.requestedAmount
        return summary
      }

      if (refund.riskLevel === 'review') {
        summary.reviewCount += 1
        summary.reviewAmount += refund.requestedAmount
        return summary
      }

      summary.safeCount += 1
      summary.safeAmount += refund.requestedAmount
      return summary
    },
    {
      requestCount: 0,
      totalAmount: 0,
      criticalCount: 0,
      criticalAmount: 0,
      reviewCount: 0,
      reviewAmount: 0,
      safeCount: 0,
      safeAmount: 0,
    },
  )
}

export function simulateRefundApproval(
  refund: EnrichedRefundRequest,
  queueContext: EnrichedRefundRequest[],
): SingleRefundSimulationResult {
  const conflictingRefunds = queueContext.filter(
    (candidate) =>
      candidate.id !== refund.id &&
      (refund.duplicateCandidateIds.includes(candidate.id) ||
        candidate.duplicateCandidateIds.includes(refund.id)),
  )
  const blockingReasons = refund.riskFlags
    .filter((flag) => flag.blocking)
    .map((flag) => flag.title)
  const reviewReasons = refund.riskFlags
    .filter((flag) => !flag.blocking)
    .map((flag) => flag.title)
  const duplicateExposureCount = conflictingRefunds.length
  const state: BatchProcessState =
    blockingReasons.length > 0
      ? 'blocked'
      : reviewReasons.length > 0 || duplicateExposureCount > 0
        ? 'review'
        : 'safe'

  if (state === 'blocked') {
    return {
      state,
      headline: 'Approval should stay blocked.',
      summary:
        'This refund is already carrying blocking conditions and should not be approved until those conflicts are resolved.',
      duplicateExposureCount,
      blockingReasons,
      reviewReasons,
      conflictingRequestIds: conflictingRefunds.map(
        (candidate) => candidate.id,
      ),
    }
  }

  if (state === 'review') {
    return {
      state,
      headline: 'Approval is possible, but review risk remains.',
      summary:
        duplicateExposureCount > 0
          ? 'Approving this request would leave overlapping refund candidates unresolved in the queue.'
          : 'There are non-blocking warnings on this request, so an operator should confirm context before proceeding.',
      duplicateExposureCount,
      blockingReasons,
      reviewReasons,
      conflictingRequestIds: conflictingRefunds.map(
        (candidate) => candidate.id,
      ),
    }
  }

  return {
    state,
    headline: 'Approval is unlikely to create new queue conflicts.',
    summary:
      'No blocking rules or duplicate overlaps were detected in the current pending queue for this request.',
    duplicateExposureCount,
    blockingReasons,
    reviewReasons,
    conflictingRequestIds: [],
  }
}
