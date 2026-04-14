import { Badge } from '../../components/ui/Badge.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { SectionHeading } from '../../components/ui/SectionHeading.tsx'

const analyticCards = [
  {
    title: 'Refund volume trend',
    description:
      'Time-series charts will show daily request count and amount so operations can spot spikes after campaigns, delivery failures, or gateway instability.',
  },
  {
    title: 'Payment method comparison',
    description:
      'GCash, Maya, cards, and COD will be compared on refund rate, risk exposure, and average decision delay.',
  },
  {
    title: 'High-risk customers',
    description:
      'A ranked view will surface customers with concentrated refund activity or repeat chargeback-adjacent behavior.',
  },
]

export function AnalyticsPage() {
  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="Secondary Workflow"
        title="Analytics Dashboard"
        description="Milestone 1 sets up the layout and visual language for the dashboard so Milestone 4 can plug in real metrics and charts without reworking the shell."
      />

      <Card className="analytics-hero">
        <div>
          <p className="analytics-hero__eyebrow">Foundation Check</p>
          <h3>Analytics route is wired and ready for shared selectors.</h3>
          <p>
            The production dashboard will focus on refund volume, method-level
            patterns, refund-to-transaction ratios, and customers creating
            unusual risk.
          </p>
        </div>

        <div
          className="analytics-hero__badges"
          aria-label="Analytics readiness"
        >
          <Badge tone="success">Route Ready</Badge>
          <Badge tone="warning">Data Pending</Badge>
          <Badge>Responsive Layout</Badge>
        </div>
      </Card>

      <div className="analytics-grid">
        {analyticCards.map((card) => (
          <Card key={card.title} className="analytics-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
