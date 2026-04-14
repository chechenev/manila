import { describe, expect, it } from 'vitest'
import { refundWorkbenchSeedData } from '../data/loadSeedData.ts'
import { enrichAllRefundRequests } from '../domain/risk.ts'

describe('refund seed data coverage', () => {
  it('contains the required baseline volume', () => {
    expect(refundWorkbenchSeedData.transactions.length).toBeGreaterThanOrEqual(
      300,
    )
    expect(
      refundWorkbenchSeedData.refundRequests.length,
    ).toBeGreaterThanOrEqual(100)
    expect(refundWorkbenchSeedData.customers.length).toBeGreaterThanOrEqual(100)
  })

  it('covers all required payment methods and transaction statuses', () => {
    const paymentMethods = new Set(
      refundWorkbenchSeedData.transactions.map(
        (transaction) => transaction.paymentMethod,
      ),
    )
    const statuses = new Set(
      refundWorkbenchSeedData.transactions.map(
        (transaction) => transaction.status,
      ),
    )

    expect(paymentMethods).toEqual(
      new Set(['gcash', 'maya', 'credit_card', 'cash_on_delivery']),
    )
    expect(statuses).toEqual(
      new Set([
        'authorized',
        'captured',
        'settled',
        'refunded',
        'failed',
        'chargeback_filed',
      ]),
    )
  })

  it('includes the requested challenge scenarios', () => {
    const enriched = enrichAllRefundRequests(refundWorkbenchSeedData)

    expect(
      refundWorkbenchSeedData.refundRequests.filter(
        (refund) => refund.duplicateGroupId,
      ).length,
    ).toBeGreaterThanOrEqual(6)
    expect(
      enriched.filter((refund) =>
        refund.riskFlags.some((flag) => flag.code === 'original_not_captured'),
      ).length,
    ).toBeGreaterThanOrEqual(2)
    expect(
      enriched.filter((refund) =>
        refund.riskFlags.some((flag) => flag.code === 'chargeback_exists'),
      ).length,
    ).toBeGreaterThanOrEqual(2)
    expect(
      enriched.filter((refund) =>
        refund.riskFlags.some(
          (flag) => flag.code === 'amount_exceeds_original',
        ),
      ).length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      enriched.filter((refund) =>
        refund.riskFlags.some(
          (flag) => flag.code === 'customer_refund_velocity',
        ),
      ).length,
    ).toBeGreaterThanOrEqual(4)
  })
})
