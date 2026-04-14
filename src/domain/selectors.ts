import type {
  AnalyticsOverview,
  Customer,
  CustomerRefundInsight,
  DatasetIndexes,
  PaymentMethod,
  PaymentMethodAnalytics,
  PaymentMethodSummary,
  RefundRequest,
  RefundTrendPoint,
  RefundWorkbenchData,
  Transaction,
} from './refunds.ts'
import { enrichAllRefundRequests } from './risk.ts'

const dayMs = 24 * 60 * 60 * 1000

export function buildDatasetIndexes(data: RefundWorkbenchData): DatasetIndexes {
  const customersById = new Map(
    data.customers.map((customer) => [customer.id, customer]),
  )
  const transactionsById = new Map(
    data.transactions.map((transaction) => [transaction.id, transaction]),
  )
  const refundsById = new Map(
    data.refundRequests.map((refund) => [refund.id, refund]),
  )

  const refundsByCustomerId = new Map<string, RefundRequest[]>()
  const refundsByTransactionId = new Map<string, RefundRequest[]>()

  for (const refund of data.refundRequests) {
    refundsByCustomerId.set(refund.customerId, [
      ...(refundsByCustomerId.get(refund.customerId) ?? []),
      refund,
    ])
    refundsByTransactionId.set(refund.transactionId, [
      ...(refundsByTransactionId.get(refund.transactionId) ?? []),
      refund,
    ])
  }

  for (const refunds of refundsByCustomerId.values()) {
    refunds.sort((left, right) =>
      left.requestDate.localeCompare(right.requestDate),
    )
  }

  for (const refunds of refundsByTransactionId.values()) {
    refunds.sort((left, right) =>
      left.requestDate.localeCompare(right.requestDate),
    )
  }

  return {
    customersById,
    transactionsById,
    refundsById,
    refundsByCustomerId,
    refundsByTransactionId,
  }
}

export function getCustomerById(
  indexes: DatasetIndexes,
  customerId: string,
): Customer {
  const customer = indexes.customersById.get(customerId)

  if (!customer) {
    throw new Error(`Customer ${customerId} was not found in dataset indexes.`)
  }

  return customer
}

export function getTransactionById(
  indexes: DatasetIndexes,
  transactionId: string,
): Transaction {
  const transaction = indexes.transactionsById.get(transactionId)

  if (!transaction) {
    throw new Error(
      `Transaction ${transactionId} was not found in dataset indexes.`,
    )
  }

  return transaction
}

export function findTransactionByRefundRequest(
  indexes: DatasetIndexes,
  refundRequest: RefundRequest,
): Transaction {
  return getTransactionById(indexes, refundRequest.transactionId)
}

export function differenceInCalendarDays(
  startIso: string,
  endIso: string,
): number {
  const start = new Date(startIso)
  const end = new Date(endIso)

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / dayMs))
}

export function calculatePurchaseToRequestDelayDays(
  transaction: Transaction,
  refundRequest: RefundRequest,
): number {
  return differenceInCalendarDays(
    transaction.transactionDate,
    refundRequest.requestDate,
  )
}

export function countCustomerRefundRequestsInWindow(
  indexes: DatasetIndexes,
  customerId: string,
  anchorIso: string,
  windowDays: number,
  excludeRequestId?: string,
): number {
  const anchorTime = new Date(anchorIso).getTime()
  const windowStart = anchorTime - windowDays * dayMs

  return (indexes.refundsByCustomerId.get(customerId) ?? []).filter(
    (refund) => {
      if (excludeRequestId && refund.id === excludeRequestId) {
        return false
      }

      const requestTime = new Date(refund.requestDate).getTime()
      return requestTime >= windowStart && requestTime <= anchorTime
    },
  ).length
}

export function countPendingCustomerRefundsInWindow(
  indexes: DatasetIndexes,
  customerId: string,
  anchorIso: string,
  windowDays: number,
  excludeRequestId?: string,
): number {
  const anchorTime = new Date(anchorIso).getTime()
  const windowStart = anchorTime - windowDays * dayMs

  return (indexes.refundsByCustomerId.get(customerId) ?? []).filter(
    (refund) => {
      if (excludeRequestId && refund.id === excludeRequestId) {
        return false
      }

      if (refund.status !== 'pending') {
        return false
      }

      const requestTime = new Date(refund.requestDate).getTime()
      return requestTime >= windowStart && requestTime <= anchorTime
    },
  ).length
}

export function calculatePendingExposureTotal(
  data: RefundWorkbenchData,
): number {
  return data.refundRequests
    .filter((refund) => refund.status === 'pending')
    .reduce((total, refund) => total + refund.requestedAmount, 0)
}

export function buildPaymentMethodSummaries(
  data: RefundWorkbenchData,
): PaymentMethodSummary[] {
  const transactionCounts = new Map<PaymentMethod, number>()
  const refundCounts = new Map<PaymentMethod, number>()
  const pendingAmounts = new Map<PaymentMethod, number>()
  const indexes = buildDatasetIndexes(data)

  for (const transaction of data.transactions) {
    transactionCounts.set(
      transaction.paymentMethod,
      (transactionCounts.get(transaction.paymentMethod) ?? 0) + 1,
    )
  }

  for (const refund of data.refundRequests) {
    const transaction = getTransactionById(indexes, refund.transactionId)
    refundCounts.set(
      transaction.paymentMethod,
      (refundCounts.get(transaction.paymentMethod) ?? 0) + 1,
    )

    if (refund.status === 'pending') {
      pendingAmounts.set(
        transaction.paymentMethod,
        (pendingAmounts.get(transaction.paymentMethod) ?? 0) +
          refund.requestedAmount,
      )
    }
  }

  return [...transactionCounts.entries()].map(
    ([paymentMethod, transactionCount]) => {
      const refundRequestCount = refundCounts.get(paymentMethod) ?? 0
      const pendingRefundAmount = pendingAmounts.get(paymentMethod) ?? 0

      return {
        paymentMethod,
        transactionCount,
        refundRequestCount,
        pendingRefundAmount,
        refundToTransactionRatio:
          transactionCount === 0 ? 0 : refundRequestCount / transactionCount,
      }
    },
  )
}

export function calculateAveragePurchaseToRefundDelayDays(
  data: RefundWorkbenchData,
): number {
  const indexes = buildDatasetIndexes(data)
  const delays = data.refundRequests.map((refund) =>
    calculatePurchaseToRequestDelayDays(
      getTransactionById(indexes, refund.transactionId),
      refund,
    ),
  )

  if (delays.length === 0) {
    return 0
  }

  return delays.reduce((total, delay) => total + delay, 0) / delays.length
}

function isWithinDateRange(
  isoValue: string,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  const dateValue = isoValue.slice(0, 10)

  if (dateFrom && dateValue < dateFrom) {
    return false
  }

  if (dateTo && dateValue > dateTo) {
    return false
  }

  return true
}

export function getRefundRequestDateBounds(data: RefundWorkbenchData): {
  min: string
  max: string
} {
  const sortedDates = data.refundRequests
    .map((refund) => refund.requestDate.slice(0, 10))
    .sort((left, right) => left.localeCompare(right))

  return {
    min: sortedDates[0] ?? '',
    max: sortedDates[sortedDates.length - 1] ?? '',
  }
}

export function filterRefundWorkbenchDataByRequestDate(
  data: RefundWorkbenchData,
  dateFrom?: string,
  dateTo?: string,
): RefundWorkbenchData {
  if (!dateFrom && !dateTo) {
    return data
  }

  const filteredRefundRequests = data.refundRequests.filter((refund) =>
    isWithinDateRange(refund.requestDate, dateFrom, dateTo),
  )
  const transactionIds = new Set(
    filteredRefundRequests.map((refund) => refund.transactionId),
  )
  const customerIds = new Set(
    filteredRefundRequests.map((refund) => refund.customerId),
  )

  return {
    ...data,
    customers: data.customers.filter((customer) =>
      customerIds.has(customer.id),
    ),
    transactions: data.transactions.filter((transaction) =>
      transactionIds.has(transaction.id),
    ),
    refundRequests: filteredRefundRequests,
  }
}

export function buildAnalyticsOverview(
  data: RefundWorkbenchData,
): AnalyticsOverview {
  const totalRefundCount = data.refundRequests.length
  const totalRefundAmount = data.refundRequests.reduce(
    (total, refund) => total + refund.requestedAmount,
    0,
  )

  return {
    totalRefundCount,
    totalRefundAmount,
    refundToTransactionRatio:
      data.transactions.length === 0
        ? 0
        : totalRefundCount / data.transactions.length,
    averagePurchaseToRefundDelayDays:
      calculateAveragePurchaseToRefundDelayDays(data),
  }
}

export function buildRefundVolumeTrend(
  data: RefundWorkbenchData,
): RefundTrendPoint[] {
  const buckets = new Map<string, RefundTrendPoint>()

  for (const refund of data.refundRequests) {
    const isoDate = refund.requestDate.slice(0, 10)
    const existing = buckets.get(isoDate)

    if (existing) {
      existing.refundCount += 1
      existing.refundAmount += refund.requestedAmount
      continue
    }

    buckets.set(isoDate, {
      isoDate,
      label: isoDate,
      refundCount: 1,
      refundAmount: refund.requestedAmount,
    })
  }

  return [...buckets.values()].sort((left, right) =>
    left.isoDate.localeCompare(right.isoDate),
  )
}

export function buildPaymentMethodAnalytics(
  data: RefundWorkbenchData,
): PaymentMethodAnalytics[] {
  const summaries = buildPaymentMethodSummaries(data)
  const indexes = buildDatasetIndexes(data)
  const analyticsByMethod = new Map<
    PaymentMethod,
    {
      refundAmountTotal: number
      criticalRiskCount: number
      reviewCount: number
    }
  >()

  for (const refund of enrichAllRefundRequests(data)) {
    const paymentMethod = getTransactionById(
      indexes,
      refund.transactionId,
    ).paymentMethod
    const entry = analyticsByMethod.get(paymentMethod) ?? {
      refundAmountTotal: 0,
      criticalRiskCount: 0,
      reviewCount: 0,
    }

    entry.refundAmountTotal += refund.requestedAmount
    if (refund.riskLevel === 'critical') {
      entry.criticalRiskCount += 1
    }
    if (refund.riskLevel !== 'safe') {
      entry.reviewCount += 1
    }

    analyticsByMethod.set(paymentMethod, entry)
  }

  return summaries.map((summary) => {
    const analytics = analyticsByMethod.get(summary.paymentMethod) ?? {
      refundAmountTotal: 0,
      criticalRiskCount: 0,
      reviewCount: 0,
    }

    return {
      ...summary,
      refundAmountTotal: analytics.refundAmountTotal,
      criticalRiskCount: analytics.criticalRiskCount,
      reviewCount: analytics.reviewCount,
    }
  })
}

export function buildCustomerRefundInsights(
  data: RefundWorkbenchData,
  limit = 8,
): CustomerRefundInsight[] {
  const grouped = new Map<string, CustomerRefundInsight>()

  for (const refund of enrichAllRefundRequests(data)) {
    const existing = grouped.get(refund.customer.id)

    if (existing) {
      existing.refundRequestCount += 1
      existing.totalRequestedAmount += refund.requestedAmount
      existing.latestRequestDate =
        existing.latestRequestDate > refund.requestDate
          ? existing.latestRequestDate
          : refund.requestDate
      if (refund.riskLevel === 'critical') {
        existing.criticalRiskCount += 1
      }
      if (refund.riskLevel !== 'safe') {
        existing.reviewCount += 1
      }
      continue
    }

    grouped.set(refund.customer.id, {
      customerId: refund.customer.id,
      customerName: refund.customer.name,
      customerExternalId: refund.customer.externalId,
      segment: refund.customer.segment,
      refundRequestCount: 1,
      totalRequestedAmount: refund.requestedAmount,
      criticalRiskCount: refund.riskLevel === 'critical' ? 1 : 0,
      reviewCount: refund.riskLevel !== 'safe' ? 1 : 0,
      latestRequestDate: refund.requestDate,
    })
  }

  return [...grouped.values()]
    .sort((left, right) => {
      if (right.criticalRiskCount !== left.criticalRiskCount) {
        return right.criticalRiskCount - left.criticalRiskCount
      }

      if (right.refundRequestCount !== left.refundRequestCount) {
        return right.refundRequestCount - left.refundRequestCount
      }

      if (right.totalRequestedAmount !== left.totalRequestedAmount) {
        return right.totalRequestedAmount - left.totalRequestedAmount
      }

      return right.latestRequestDate.localeCompare(left.latestRequestDate)
    })
    .slice(0, limit)
}
