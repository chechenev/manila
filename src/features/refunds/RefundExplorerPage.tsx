import { Badge } from '../../components/ui/Badge.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import {
  FieldLabel,
  SelectInput,
  TextInput,
} from '../../components/ui/Field.tsx'
import { SectionHeading } from '../../components/ui/SectionHeading.tsx'

const queueMetrics = [
  { label: 'Pending queue', value: '486', tone: 'default' as const },
  { label: 'Critical risk', value: '38', tone: 'critical' as const },
  { label: 'Needs review', value: '91', tone: 'warning' as const },
  { label: 'Exposure', value: '$42,380', tone: 'success' as const },
]

const sampleRequests = [
  {
    id: 'RF-2084',
    customer: 'CUST-11093',
    paymentMethod: 'GCash',
    transactionStatus: 'settled',
    amount: '$84.00',
    requestDate: 'Apr 12',
    risk: 'Critical duplicate signal',
  },
  {
    id: 'RF-2083',
    customer: 'CUST-10217',
    paymentMethod: 'Credit Card',
    transactionStatus: 'chargeback_filed',
    amount: '$210.00',
    requestDate: 'Apr 11',
    risk: 'Chargeback already filed',
  },
  {
    id: 'RF-2078',
    customer: 'CUST-11902',
    paymentMethod: 'Cash on Delivery',
    transactionStatus: 'captured',
    amount: '$16.50',
    requestDate: 'Apr 11',
    risk: 'Alternative payout required',
  },
]

export function RefundExplorerPage() {
  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="Primary Workflow"
        title="Refund Explorer"
        description="Milestone 1 establishes the operational shell, queue framing, and reusable UI primitives that the full explorer will use next."
      />

      <div className="metrics-grid" role="list" aria-label="Queue highlights">
        {queueMetrics.map((metric) => (
          <Card key={metric.label} className="metric-card" role="listitem">
            <p className="metric-card__label">{metric.label}</p>
            <div className="metric-card__value-row">
              <strong className="metric-card__value">{metric.value}</strong>
              <Badge tone={metric.tone}>{metric.label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="page-grid">
        <Card className="foundation-card">
          <SectionHeading
            eyebrow="Foundation State"
            title="Explorer skeleton"
            description="The final queue will land here with sorting, filtering, risk flags, and detail drill-down. For now, this confirms the layout, spacing, and responsive behavior."
          />

          <div className="filter-grid" aria-label="Explorer filter preview">
            <div>
              <FieldLabel
                htmlFor="customer-search"
                label="Customer or transaction"
              />
              <TextInput
                id="customer-search"
                name="customer-search"
                placeholder="Search by customer ID or request ID"
              />
            </div>

            <div>
              <FieldLabel htmlFor="payment-method" label="Payment method" />
              <SelectInput
                defaultValue=""
                id="payment-method"
                name="payment-method"
              >
                <option value="">All methods</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="credit-card">Credit Card</option>
                <option value="cod">Cash on Delivery</option>
              </SelectInput>
            </div>

            <div>
              <FieldLabel
                htmlFor="transaction-status"
                label="Transaction status"
              />
              <SelectInput
                defaultValue=""
                id="transaction-status"
                name="transaction-status"
              >
                <option value="">All statuses</option>
                <option value="authorized">Authorized</option>
                <option value="captured">Captured</option>
                <option value="settled">Settled</option>
                <option value="chargeback-filed">Chargeback filed</option>
              </SelectInput>
            </div>
          </div>

          <div className="button-row">
            <Button>Apply Filters</Button>
            <Button variant="secondary">Reset</Button>
            <Button variant="ghost">Open Bulk Review</Button>
          </div>
        </Card>

        <Card className="foundation-card">
          <SectionHeading
            eyebrow="Preview Data"
            title="Representative queue items"
            description="These placeholder records prove the shell can support dense operational information before the seeded domain data arrives in Milestone 2."
          />

          <ul className="request-list">
            {sampleRequests.map((request) => (
              <li className="request-list__item" key={request.id}>
                <div>
                  <p className="request-list__id">{request.id}</p>
                  <strong>{request.customer}</strong>
                  <p className="request-list__meta">
                    {request.paymentMethod} · {request.transactionStatus}
                  </p>
                </div>
                <div className="request-list__summary">
                  <strong>{request.amount}</strong>
                  <span>{request.requestDate}</span>
                  <Badge
                    tone={
                      request.risk.includes('Critical')
                        ? 'critical'
                        : request.risk.includes('Chargeback')
                          ? 'critical'
                          : 'warning'
                    }
                  >
                    {request.risk}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
