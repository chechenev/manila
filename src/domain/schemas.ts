import { z } from 'zod'
import {
  customerSegments,
  paymentMethods,
  priorAttemptOutcomes,
  refundChannels,
  refundDestinationTypes,
  refundReasons,
  refundRequestStatuses,
  transactionStatuses,
} from './refunds.ts'

export const customerSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  name: z.string(),
  email: z.email(),
  segment: z.enum(customerSegments),
  createdAt: z.iso.datetime(),
  countryCode: z.literal('PH'),
})

export const transactionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  paymentMethod: z.enum(paymentMethods),
  amount: z.number().positive(),
  currency: z.literal('PHP'),
  itemCount: z.number().int().positive(),
  transactionDate: z.iso.datetime(),
  status: z.enum(transactionStatuses),
  capturedAt: z.string().datetime().nullable(),
  settledAt: z.string().datetime().nullable(),
  chargebackFiledAt: z.string().datetime().nullable(),
  refundedAmountTotal: z.number().min(0),
  authorizationExpiresAt: z.string().datetime().nullable(),
  hasGatewayTimeoutHistory: z.boolean(),
})

export const refundRequestSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  customerId: z.string(),
  requestedAmount: z.number().positive(),
  requestDate: z.iso.datetime(),
  refundDestinationType: z.enum(refundDestinationTypes),
  reason: z.enum(refundReasons),
  status: z.enum(refundRequestStatuses),
  submissionChannel: z.enum(refundChannels),
  priorAttemptOutcome: z.enum(priorAttemptOutcomes),
  duplicateGroupId: z.string().nullable(),
  operatorNote: z.string().nullable(),
  lineItemsReturned: z.number().int().positive(),
})

export const refundWorkbenchDataSchema = z.object({
  generatedAt: z.iso.datetime(),
  seed: z.number().int(),
  customers: z.array(customerSchema).min(1),
  transactions: z.array(transactionSchema).min(1),
  refundRequests: z.array(refundRequestSchema).min(1),
})

export type RefundWorkbenchDataInput = z.infer<typeof refundWorkbenchDataSchema>
