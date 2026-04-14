import { describe, expect, it } from 'vitest'
import { refundWorkbenchSeedData } from '../data/loadSeedData.ts'
import {
  buildDatasetIndexes,
  buildPaymentMethodSummaries,
  calculateAveragePurchaseToRefundDelayDays,
  calculatePendingExposureTotal,
  countCustomerRefundRequestsInWindow,
  findTransactionByRefundRequest,
} from '../domain/selectors.ts'

describe('seed data selectors', () => {
  it('resolves related transactions for refund requests', () => {
    const indexes = buildDatasetIndexes(refundWorkbenchSeedData)
    const refundRequest = refundWorkbenchSeedData.refundRequests[0]

    expect(findTransactionByRefundRequest(indexes, refundRequest).id).toBe(
      refundRequest.transactionId,
    )
  })

  it('calculates pending exposure and payment summaries', () => {
    const pendingExposure = calculatePendingExposureTotal(
      refundWorkbenchSeedData,
    )
    const paymentMethodSummaries = buildPaymentMethodSummaries(
      refundWorkbenchSeedData,
    )

    expect(pendingExposure).toBeGreaterThan(0)
    expect(paymentMethodSummaries).toHaveLength(4)
    expect(
      paymentMethodSummaries.every((summary) => summary.transactionCount > 0),
    ).toBe(true)
  })

  it('counts customer refund velocity in a rolling window', () => {
    const indexes = buildDatasetIndexes(refundWorkbenchSeedData)
    const maxWindowCount = refundWorkbenchSeedData.refundRequests.reduce(
      (highestCount, refundRequest) =>
        Math.max(
          highestCount,
          countCustomerRefundRequestsInWindow(
            indexes,
            refundRequest.customerId,
            refundRequest.requestDate,
            7,
          ),
        ),
      0,
    )

    expect(maxWindowCount).toBeGreaterThanOrEqual(4)
  })
})

describe('delay metrics', () => {
  it('produces a reasonable average delay metric', () => {
    expect(
      calculateAveragePurchaseToRefundDelayDays(refundWorkbenchSeedData),
    ).toBeGreaterThan(0)
  })
})
