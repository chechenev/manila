export const paymentMethods = [
  'gcash',
  'maya',
  'credit_card',
  'cash_on_delivery',
] as const

export const transactionStatuses = [
  'authorized',
  'captured',
  'settled',
  'refunded',
  'failed',
  'chargeback_filed',
] as const

export const refundRequestStatuses = [
  'pending',
  'approved',
  'rejected',
  'flagged',
] as const

export const refundDestinationTypes = [
  'original_method',
  'store_credit',
  'bank_transfer',
] as const

export const refundReasons = [
  'item_not_received',
  'customer_return',
  'damaged_item',
  'wrong_item',
  'billing_issue',
  'courier_failure',
] as const

export const refundChannels = [
  'support_portal',
  'ops_console',
  'chat',
  'email',
] as const

export const priorAttemptOutcomes = [
  'none',
  'failed',
  'succeeded',
  'timeout',
] as const

export const customerSegments = ['standard', 'vip', 'high_risk'] as const

export const riskSeverities = ['warning', 'critical'] as const

export const riskLevels = ['safe', 'review', 'critical'] as const

export const riskFlagCodes = [
  'original_not_captured',
  'chargeback_exists',
  'amount_exceeds_original',
  'probable_duplicate',
  'ambiguous_prior_refund',
  'customer_refund_velocity',
  'multiple_pending_window',
  'cod_manual_payout',
  'near_full_partial_refund',
] as const

export type PaymentMethod = (typeof paymentMethods)[number]
export type TransactionStatus = (typeof transactionStatuses)[number]
export type RefundRequestStatus = (typeof refundRequestStatuses)[number]
export type RefundDestinationType = (typeof refundDestinationTypes)[number]
export type RefundReason = (typeof refundReasons)[number]
export type RefundChannel = (typeof refundChannels)[number]
export type PriorAttemptOutcome = (typeof priorAttemptOutcomes)[number]
export type CustomerSegment = (typeof customerSegments)[number]
export type RiskSeverity = (typeof riskSeverities)[number]
export type RiskLevel = (typeof riskLevels)[number]
export type RiskFlagCode = (typeof riskFlagCodes)[number]

export type Customer = {
  id: string
  externalId: string
  name: string
  email: string
  segment: CustomerSegment
  createdAt: string
  countryCode: 'PH'
}

export type Transaction = {
  id: string
  orderId: string
  customerId: string
  paymentMethod: PaymentMethod
  amount: number
  currency: 'PHP'
  itemCount: number
  transactionDate: string
  status: TransactionStatus
  capturedAt: string | null
  settledAt: string | null
  chargebackFiledAt: string | null
  refundedAmountTotal: number
  authorizationExpiresAt: string | null
  hasGatewayTimeoutHistory: boolean
}

export type RefundRequest = {
  id: string
  transactionId: string
  customerId: string
  requestedAmount: number
  requestDate: string
  refundDestinationType: RefundDestinationType
  reason: RefundReason
  status: RefundRequestStatus
  submissionChannel: RefundChannel
  priorAttemptOutcome: PriorAttemptOutcome
  duplicateGroupId: string | null
  operatorNote: string | null
  lineItemsReturned: number
}

export type RefundDecision = {
  refundRequestId: string
  decision: 'approve' | 'reject' | 'flag'
  decidedAt: string
  decidedBy: string
}

export type RiskFlag = {
  code: RiskFlagCode
  severity: RiskSeverity
  title: string
  explanation: string
  blocking: boolean
}

export type RefundWorkbenchData = {
  generatedAt: string
  seed: number
  customers: Customer[]
  transactions: Transaction[]
  refundRequests: RefundRequest[]
}

export type DatasetIndexes = {
  customersById: Map<string, Customer>
  transactionsById: Map<string, Transaction>
  refundsById: Map<string, RefundRequest>
  refundsByCustomerId: Map<string, RefundRequest[]>
  refundsByTransactionId: Map<string, RefundRequest[]>
}

export type DuplicateCandidate = {
  requestId: string
  matchedRequestId: string
  reason:
    | 'duplicate_group'
    | 'same_transaction_same_amount'
    | 'same_customer_close_window'
}

export type PaymentMethodSummary = {
  paymentMethod: PaymentMethod
  transactionCount: number
  refundRequestCount: number
  pendingRefundAmount: number
  refundToTransactionRatio: number
}

export type EnrichedRefundRequest = RefundRequest & {
  customer: Customer
  transaction: Transaction
  duplicateCandidateIds: string[]
  riskFlags: RiskFlag[]
  riskLevel: RiskLevel
  customerRefundsLast7Days: number
  purchaseToRequestDays: number
}
