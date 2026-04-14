import { describe, expect, it } from 'vitest'
import { refundWorkbenchSeedData } from '../data/loadSeedData.ts'
import {
  buildAnalyticsOverview,
  buildCustomerRefundInsights,
  buildDatasetIndexes,
  buildPaymentMethodAnalytics,
  buildPaymentMethodSummaries,
  buildRefundVolumeTrend,
  calculateAveragePurchaseToRefundDelayDays,
  calculatePendingExposureTotal,
  countCustomerRefundRequestsInWindow,
  filterRefundWorkbenchDataByRequestDate,
  findTransactionByRefundRequest,
  getRefundRequestDateBounds,
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

describe('analytics selectors', () => {
  it('builds overview metrics from shared dataset selectors', () => {
    const overview = buildAnalyticsOverview(refundWorkbenchSeedData)

    expect(overview.totalRefundCount).toBe(
      refundWorkbenchSeedData.refundRequests.length,
    )
    expect(overview.totalRefundAmount).toBeGreaterThan(0)
    expect(overview.refundToTransactionRatio).toBeGreaterThan(0)
    expect(overview.averagePurchaseToRefundDelayDays).toBeGreaterThan(0)
  })

  it('groups refund trend points in chronological order', () => {
    const trend = buildRefundVolumeTrend(refundWorkbenchSeedData)

    expect(trend.length).toBeGreaterThan(10)
    expect(trend[0].isoDate <= trend[trend.length - 1].isoDate).toBe(true)
    expect(trend.reduce((total, point) => total + point.refundCount, 0)).toBe(
      refundWorkbenchSeedData.refundRequests.length,
    )
  })

  it('creates payment method and customer insights for analytics ranking', () => {
    const paymentMethodAnalytics = buildPaymentMethodAnalytics(
      refundWorkbenchSeedData,
    )
    const customerInsights = buildCustomerRefundInsights(
      refundWorkbenchSeedData,
      5,
    )

    expect(paymentMethodAnalytics).toHaveLength(4)
    expect(
      paymentMethodAnalytics.every(
        (summary) =>
          summary.refundAmountTotal >= 0 &&
          summary.reviewCount >= summary.criticalRiskCount,
      ),
    ).toBe(true)
    expect(customerInsights).toHaveLength(5)
    expect(customerInsights[0].refundRequestCount).toBeGreaterThanOrEqual(
      customerInsights[1].refundRequestCount,
    )
  })

  it('filters analytics data by request-date window and exposes usable bounds', () => {
    const bounds = getRefundRequestDateBounds(refundWorkbenchSeedData)
    const filtered = filterRefundWorkbenchDataByRequestDate(
      refundWorkbenchSeedData,
      bounds.min,
      bounds.min,
    )

    expect(bounds.min <= bounds.max).toBe(true)
    expect(filtered.refundRequests.length).toBeGreaterThan(0)
    expect(
      filtered.refundRequests.every(
        (refund) => refund.requestDate.slice(0, 10) === bounds.min,
      ),
    ).toBe(true)
  })

  it('keeps analytics ratios scoped to transactions present in the filtered window', () => {
    const bounds = getRefundRequestDateBounds(refundWorkbenchSeedData)
    const filtered = filterRefundWorkbenchDataByRequestDate(
      refundWorkbenchSeedData,
      bounds.min,
      bounds.min,
    )
    const referencedTransactionIds = new Set(
      filtered.refundRequests.map((refund) => refund.transactionId),
    )
    const overview = buildAnalyticsOverview(filtered)
    const paymentMethodAnalytics = buildPaymentMethodAnalytics(filtered)

    expect(filtered.transactions).toHaveLength(referencedTransactionIds.size)
    expect(overview.refundToTransactionRatio).toBe(
      filtered.refundRequests.length / filtered.transactions.length,
    )
    expect(
      paymentMethodAnalytics.every(
        (summary) => summary.refundRequestCount <= summary.transactionCount,
      ),
    ).toBe(true)
  })
})
