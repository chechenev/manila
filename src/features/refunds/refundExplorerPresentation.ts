import type {
  BatchProcessState,
  PaymentMethod,
  RiskLevel,
  TransactionStatus,
} from '../../domain/refunds.ts'

export type ActionStatus = 'approved' | 'rejected' | 'flagged'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  credit_card: 'Credit Card',
  cash_on_delivery: 'Cash on Delivery',
}

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  authorized: 'Authorized',
  captured: 'Captured',
  settled: 'Settled',
  refunded: 'Refunded',
  failed: 'Failed',
  chargeback_filed: 'Chargeback filed',
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const compactDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const detailDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCompactDate(isoValue: string) {
  return compactDateFormatter.format(new Date(isoValue))
}

export function formatDetailDate(isoValue: string | null) {
  return isoValue ? detailDateFormatter.format(new Date(isoValue)) : 'N/A'
}

export function toInputDate(isoValue: string) {
  return new Date(isoValue).toISOString().slice(0, 10)
}

export function riskTone(level: RiskLevel): 'critical' | 'warning' | 'success' {
  if (level === 'critical') {
    return 'critical'
  }

  if (level === 'review') {
    return 'warning'
  }

  return 'success'
}

export function riskLabel(level: RiskLevel) {
  if (level === 'critical') {
    return 'Critical risk'
  }

  if (level === 'review') {
    return 'Needs review'
  }

  return 'Safe to process'
}

export function statusBadgeTone(status: ActionStatus | 'pending') {
  if (status === 'approved') {
    return 'success' as const
  }

  if (status === 'rejected') {
    return 'critical' as const
  }

  if (status === 'flagged') {
    return 'warning' as const
  }

  return 'default' as const
}

export function statusLabel(status: ActionStatus | 'pending') {
  if (status === 'approved') {
    return 'Approved'
  }

  if (status === 'rejected') {
    return 'Rejected'
  }

  if (status === 'flagged') {
    return 'Flagged'
  }

  return 'Pending'
}

export function batchStateTone(state: BatchProcessState) {
  if (state === 'blocked') {
    return 'critical' as const
  }

  if (state === 'review') {
    return 'warning' as const
  }

  return 'success' as const
}

export function batchStateLabel(state: BatchProcessState) {
  if (state === 'blocked') {
    return 'Blocked'
  }

  if (state === 'review') {
    return 'Needs review'
  }

  return 'Safe batch'
}
