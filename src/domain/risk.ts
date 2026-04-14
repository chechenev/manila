import type {
  DatasetIndexes,
  DuplicateCandidate,
  EnrichedRefundRequest,
  RefundRequest,
  RefundWorkbenchData,
  RiskFlag,
  RiskLevel,
} from './refunds.ts'
import {
  buildDatasetIndexes,
  calculatePurchaseToRequestDelayDays,
  countCustomerRefundRequestsInWindow,
  countPendingCustomerRefundsInWindow,
  getCustomerById,
  getTransactionById,
} from './selectors.ts'

function isSameDayWindow(
  leftIso: string,
  rightIso: string,
  hours: number,
): boolean {
  const difference =
    Math.abs(new Date(leftIso).getTime() - new Date(rightIso).getTime()) /
    (60 * 60 * 1000)

  return difference <= hours
}

export function detectDuplicateCandidates(
  indexes: DatasetIndexes,
  refundRequest: RefundRequest,
): DuplicateCandidate[] {
  const transactionMatches =
    indexes.refundsByTransactionId.get(refundRequest.transactionId) ?? []
  const customerMatches =
    indexes.refundsByCustomerId.get(refundRequest.customerId) ?? []
  const candidates: DuplicateCandidate[] = []

  for (const related of transactionMatches) {
    if (related.id === refundRequest.id) {
      continue
    }

    if (
      refundRequest.duplicateGroupId &&
      related.duplicateGroupId === refundRequest.duplicateGroupId
    ) {
      candidates.push({
        requestId: refundRequest.id,
        matchedRequestId: related.id,
        reason: 'duplicate_group',
      })
      continue
    }

    if (
      Math.abs(related.requestedAmount - refundRequest.requestedAmount) <
        0.01 &&
      isSameDayWindow(related.requestDate, refundRequest.requestDate, 72)
    ) {
      candidates.push({
        requestId: refundRequest.id,
        matchedRequestId: related.id,
        reason: 'same_transaction_same_amount',
      })
    }
  }

  for (const related of customerMatches) {
    if (related.id === refundRequest.id) {
      continue
    }

    if (
      related.transactionId !== refundRequest.transactionId &&
      related.status === 'pending' &&
      refundRequest.status === 'pending' &&
      isSameDayWindow(related.requestDate, refundRequest.requestDate, 24) &&
      Math.abs(related.requestedAmount - refundRequest.requestedAmount) <= 100
    ) {
      candidates.push({
        requestId: refundRequest.id,
        matchedRequestId: related.id,
        reason: 'same_customer_close_window',
      })
    }
  }

  return candidates.filter(
    (candidate, index, collection) =>
      collection.findIndex(
        (entry) =>
          entry.matchedRequestId === candidate.matchedRequestId &&
          entry.reason === candidate.reason,
      ) === index,
  )
}

export function evaluateRiskFlags(
  indexes: DatasetIndexes,
  refundRequest: RefundRequest,
): RiskFlag[] {
  const transaction = getTransactionById(indexes, refundRequest.transactionId)
  const duplicateCandidates = detectDuplicateCandidates(indexes, refundRequest)
  const customerRefundsLast7Days = countCustomerRefundRequestsInWindow(
    indexes,
    refundRequest.customerId,
    refundRequest.requestDate,
    7,
    refundRequest.id,
  )
  const pendingWindowCount = countPendingCustomerRefundsInWindow(
    indexes,
    refundRequest.customerId,
    refundRequest.requestDate,
    3,
    refundRequest.id,
  )

  const flags: RiskFlag[] = []

  if (transaction.status === 'authorized' && !transaction.capturedAt) {
    flags.push({
      code: 'original_not_captured',
      severity: 'critical',
      title: 'Original payment was never captured',
      explanation:
        'This request is tied to an authorization-only transaction, so there may be no collected funds to reverse.',
      blocking: true,
    })
  }

  if (
    transaction.status === 'chargeback_filed' ||
    transaction.chargebackFiledAt
  ) {
    flags.push({
      code: 'chargeback_exists',
      severity: 'critical',
      title: 'Chargeback already filed',
      explanation:
        'The transaction is already in dispute with the issuer, so refunding it now can create double-loss exposure.',
      blocking: true,
    })
  }

  if (refundRequest.requestedAmount > transaction.amount) {
    flags.push({
      code: 'amount_exceeds_original',
      severity: 'critical',
      title: 'Refund exceeds original amount',
      explanation:
        'The requested refund is larger than the original transaction amount and should not be approved as-is.',
      blocking: true,
    })
  }

  if (duplicateCandidates.length > 0) {
    flags.push({
      code: 'probable_duplicate',
      severity: 'critical',
      title: 'Potential duplicate refund request',
      explanation:
        'Another refund request overlaps by transaction, amount, or submission window and should be reconciled first.',
      blocking: true,
    })
  }

  if (
    refundRequest.priorAttemptOutcome === 'timeout' ||
    transaction.hasGatewayTimeoutHistory
  ) {
    flags.push({
      code: 'ambiguous_prior_refund',
      severity: 'critical',
      title: 'Prior refund attempt had an ambiguous outcome',
      explanation:
        'A timeout or uncertain gateway response means the refund may already have been processed externally.',
      blocking: true,
    })
  }

  if (customerRefundsLast7Days >= 3) {
    flags.push({
      code: 'customer_refund_velocity',
      severity: 'warning',
      title: 'High refund velocity for this customer',
      explanation:
        'This customer already has at least three refund requests in the last seven days.',
      blocking: false,
    })
  }

  if (pendingWindowCount >= 2) {
    flags.push({
      code: 'multiple_pending_window',
      severity: 'warning',
      title: 'Multiple pending requests in a short window',
      explanation:
        'The customer has several open refund requests close together in time, which increases review risk.',
      blocking: false,
    })
  }

  if (transaction.paymentMethod === 'cash_on_delivery') {
    flags.push({
      code: 'cod_manual_payout',
      severity: 'warning',
      title: 'COD requires alternate payout handling',
      explanation:
        'Cash on delivery refunds cannot return through the original tender and need a bank or wallet payout path.',
      blocking: false,
    })
  }

  if (
    refundRequest.requestedAmount < transaction.amount &&
    refundRequest.requestedAmount / transaction.amount >= 0.85
  ) {
    flags.push({
      code: 'near_full_partial_refund',
      severity: 'warning',
      title: 'Partial refund is close to full value',
      explanation:
        'This partial refund is close to the full captured amount and may need line-item verification.',
      blocking: false,
    })
  }

  return flags
}

export function deriveRiskLevel(riskFlags: RiskFlag[]): RiskLevel {
  if (riskFlags.some((flag) => flag.severity === 'critical')) {
    return 'critical'
  }

  if (riskFlags.length > 0) {
    return 'review'
  }

  return 'safe'
}

export function enrichRefundRequest(
  indexes: DatasetIndexes,
  refundRequest: RefundRequest,
): EnrichedRefundRequest {
  const transaction = getTransactionById(indexes, refundRequest.transactionId)
  const customer = getCustomerById(indexes, refundRequest.customerId)
  const duplicateCandidateIds = detectDuplicateCandidates(
    indexes,
    refundRequest,
  ).map((candidate) => candidate.matchedRequestId)
  const riskFlags = evaluateRiskFlags(indexes, refundRequest)

  return {
    ...refundRequest,
    customer,
    transaction,
    duplicateCandidateIds,
    riskFlags,
    riskLevel: deriveRiskLevel(riskFlags),
    customerRefundsLast7Days: countCustomerRefundRequestsInWindow(
      indexes,
      refundRequest.customerId,
      refundRequest.requestDate,
      7,
      refundRequest.id,
    ),
    purchaseToRequestDays: calculatePurchaseToRequestDelayDays(
      transaction,
      refundRequest,
    ),
  }
}

export function enrichAllRefundRequests(
  data: RefundWorkbenchData,
): EnrichedRefundRequest[] {
  const indexes = buildDatasetIndexes(data)
  return data.refundRequests.map((refundRequest) =>
    enrichRefundRequest(indexes, refundRequest),
  )
}
