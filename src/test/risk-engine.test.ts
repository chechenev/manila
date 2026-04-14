import { describe, expect, it } from 'vitest'
import type { RefundWorkbenchData } from '../domain/refunds.ts'
import {
  deriveRiskLevel,
  enrichAllRefundRequests,
  evaluateRiskFlags,
} from '../domain/risk.ts'
import { buildDatasetIndexes } from '../domain/selectors.ts'

const baseData: RefundWorkbenchData = {
  generatedAt: '2026-04-14T16:00:00.000Z',
  seed: 1,
  customers: [
    {
      id: 'CUS-00001',
      externalId: 'LM-CUS-00001',
      name: 'Ana Reyes',
      email: 'ana@example.test',
      segment: 'standard',
      createdAt: '2025-01-01T00:00:00.000Z',
      countryCode: 'PH',
    },
  ],
  transactions: [
    {
      id: 'TXN-00001',
      orderId: 'ORD-00001',
      customerId: 'CUS-00001',
      paymentMethod: 'credit_card',
      amount: 1000,
      currency: 'PHP',
      itemCount: 2,
      transactionDate: '2026-04-01T00:00:00.000Z',
      status: 'settled',
      capturedAt: '2026-04-01T03:00:00.000Z',
      settledAt: '2026-04-03T03:00:00.000Z',
      chargebackFiledAt: null,
      refundedAmountTotal: 0,
      authorizationExpiresAt: null,
      hasGatewayTimeoutHistory: false,
    },
  ],
  refundRequests: [],
}

function withScenario(data: Partial<RefundWorkbenchData>): RefundWorkbenchData {
  return {
    ...baseData,
    ...data,
  }
}

describe('risk engine', () => {
  it('flags authorization-only refunds as critical', () => {
    const scenario = withScenario({
      transactions: [
        {
          ...baseData.transactions[0],
          status: 'authorized',
          capturedAt: null,
          settledAt: null,
        },
      ],
      refundRequests: [
        {
          id: 'RF-1',
          transactionId: 'TXN-00001',
          customerId: 'CUS-00001',
          requestedAmount: 300,
          requestDate: '2026-04-02T00:00:00.000Z',
          refundDestinationType: 'original_method',
          reason: 'billing_issue',
          status: 'pending',
          submissionChannel: 'support_portal',
          priorAttemptOutcome: 'none',
          duplicateGroupId: null,
          operatorNote: null,
          lineItemsReturned: 1,
        },
      ],
    })

    const flags = evaluateRiskFlags(
      buildDatasetIndexes(scenario),
      scenario.refundRequests[0],
    )
    expect(flags.map((flag) => flag.code)).toContain('original_not_captured')
    expect(deriveRiskLevel(flags)).toBe('critical')
  })

  it('flags duplicate refund requests', () => {
    const scenario = withScenario({
      refundRequests: [
        {
          id: 'RF-1',
          transactionId: 'TXN-00001',
          customerId: 'CUS-00001',
          requestedAmount: 300,
          requestDate: '2026-04-02T00:00:00.000Z',
          refundDestinationType: 'original_method',
          reason: 'billing_issue',
          status: 'pending',
          submissionChannel: 'support_portal',
          priorAttemptOutcome: 'none',
          duplicateGroupId: 'DUP-1',
          operatorNote: null,
          lineItemsReturned: 1,
        },
        {
          id: 'RF-2',
          transactionId: 'TXN-00001',
          customerId: 'CUS-00001',
          requestedAmount: 300,
          requestDate: '2026-04-02T06:00:00.000Z',
          refundDestinationType: 'original_method',
          reason: 'billing_issue',
          status: 'pending',
          submissionChannel: 'email',
          priorAttemptOutcome: 'none',
          duplicateGroupId: 'DUP-1',
          operatorNote: null,
          lineItemsReturned: 1,
        },
      ],
    })

    const flags = evaluateRiskFlags(
      buildDatasetIndexes(scenario),
      scenario.refundRequests[0],
    )
    expect(flags.map((flag) => flag.code)).toContain('probable_duplicate')
  })

  it('enriches generated requests with risk metadata', () => {
    const scenario = withScenario({
      transactions: [
        {
          ...baseData.transactions[0],
          paymentMethod: 'cash_on_delivery',
        },
      ],
      refundRequests: [
        {
          id: 'RF-1',
          transactionId: 'TXN-00001',
          customerId: 'CUS-00001',
          requestedAmount: 920,
          requestDate: '2026-04-03T00:00:00.000Z',
          refundDestinationType: 'bank_transfer',
          reason: 'customer_return',
          status: 'pending',
          submissionChannel: 'support_portal',
          priorAttemptOutcome: 'timeout',
          duplicateGroupId: null,
          operatorNote: null,
          lineItemsReturned: 2,
        },
      ],
    })

    const [enriched] = enrichAllRefundRequests(scenario)

    expect(enriched.riskLevel).toBe('critical')
    expect(enriched.riskFlags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining([
        'ambiguous_prior_refund',
        'cod_manual_payout',
        'near_full_partial_refund',
      ]),
    )
    expect(enriched.purchaseToRequestDays).toBe(2)
  })
})
