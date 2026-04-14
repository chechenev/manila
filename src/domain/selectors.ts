import type {
  Customer,
  DatasetIndexes,
  PaymentMethod,
  PaymentMethodSummary,
  RefundRequest,
  RefundWorkbenchData,
  Transaction,
} from './refunds.ts'

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
