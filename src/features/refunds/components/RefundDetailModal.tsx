import { Badge } from '../../../components/ui/Badge.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import type {
  EnrichedRefundRequest,
  SingleRefundSimulationResult,
} from '../../../domain/refunds.ts'
import {
  formatDetailDate,
  formatCurrency,
  paymentMethodLabels,
  riskLabel,
  riskTone,
  statusBadgeTone,
  statusLabel,
  type ActionStatus,
} from '../refundExplorerPresentation.ts'

type RefundDetailModalProps = {
  actionOverride: ActionStatus | undefined
  isBatchSelected: boolean
  onClose: (event?: {
    preventDefault?: () => void
    stopPropagation?: () => void
  }) => void
  onDecision: (decision: ActionStatus) => void
  onToggleBatchSelection: (refundId: string) => void
  refund: EnrichedRefundRequest
  simulation: SingleRefundSimulationResult | null
}

export function RefundDetailModal({
  actionOverride,
  isBatchSelected,
  onClose,
  onDecision,
  onToggleBatchSelection,
  refund,
  simulation,
}: RefundDetailModalProps) {
  return (
    <div className="detail-modal">
      <button
        aria-label="Close refund details"
        className="detail-modal__backdrop"
        onMouseDown={onClose}
        type="button"
      />
      <Card
        aria-label="Refund request details"
        aria-modal="true"
        className="detail-panel detail-panel--modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="detail-panel__header">
          <div>
            <p className="request-list__id">{refund.id}</p>
            <h3 className="detail-panel__title">{refund.customer.name}</h3>
            <p className="detail-panel__subtitle">
              {refund.customer.externalId} · {refund.transaction.orderId} ·{' '}
              {paymentMethodLabels[refund.transaction.paymentMethod]}
            </p>
          </div>
          <div className="detail-panel__header-actions">
            <Badge tone={riskTone(refund.riskLevel)}>
              {riskLabel(refund.riskLevel)}
            </Badge>
            <button
              aria-label="Close refund details"
              className="detail-panel__close"
              onMouseDown={onClose}
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <div
          className={
            refund.riskLevel === 'critical'
              ? 'detail-alert detail-alert--critical'
              : refund.riskLevel === 'review'
                ? 'detail-alert detail-alert--warning'
                : 'detail-alert detail-alert--success'
          }
        >
          <strong>
            {refund.riskLevel === 'critical'
              ? 'Approval should be blocked pending review.'
              : refund.riskLevel === 'review'
                ? 'Manual review recommended before approval.'
                : 'No blocking conditions were detected.'}
          </strong>
          <p>
            {refund.riskFlags[0]?.explanation ??
              'This request currently has no critical or warning signals in the seeded ruleset.'}
          </p>
        </div>

        <div className="detail-grid">
          <div>
            <p className="queue-row__label">Requested refund</p>
            <strong>{formatCurrency(refund.requestedAmount)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Original amount</p>
            <strong>{formatCurrency(refund.transaction.amount)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Refund destination</p>
            <strong>{refund.refundDestinationType.replaceAll('_', ' ')}</strong>
          </div>
          <div>
            <p className="queue-row__label">Reason</p>
            <strong>{refund.reason.replaceAll('_', ' ')}</strong>
          </div>
          <div>
            <p className="queue-row__label">Request date</p>
            <strong>{formatDetailDate(refund.requestDate)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Purchase-to-request delay</p>
            <strong>{refund.purchaseToRequestDays} days</strong>
          </div>
          <div>
            <p className="queue-row__label">Request channel</p>
            <strong>{refund.submissionChannel.replaceAll('_', ' ')}</strong>
          </div>
          <div>
            <p className="queue-row__label">Prior attempt outcome</p>
            <strong>{refund.priorAttemptOutcome.replaceAll('_', ' ')}</strong>
          </div>
          <div>
            <p className="queue-row__label">7-day customer refunds</p>
            <strong>{refund.customerRefundsLast7Days}</strong>
          </div>
          <div>
            <p className="queue-row__label">Duplicate candidates</p>
            <strong>{refund.duplicateCandidateIds.length}</strong>
          </div>
        </div>

        <div className="timeline">
          <h4>Transaction timeline</h4>
          <div className="timeline__items">
            <div className="timeline__item">
              <span className="timeline__label">Purchased</span>
              <strong>
                {formatDetailDate(refund.transaction.transactionDate)}
              </strong>
            </div>
            <div className="timeline__item">
              <span className="timeline__label">Captured</span>
              <strong>{formatDetailDate(refund.transaction.capturedAt)}</strong>
            </div>
            <div className="timeline__item">
              <span className="timeline__label">Settled</span>
              <strong>{formatDetailDate(refund.transaction.settledAt)}</strong>
            </div>
            <div className="timeline__item">
              <span className="timeline__label">Refund requested</span>
              <strong>{formatDetailDate(refund.requestDate)}</strong>
            </div>
            <div className="timeline__item">
              <span className="timeline__label">Chargeback filed</span>
              <strong>
                {formatDetailDate(refund.transaction.chargebackFiledAt)}
              </strong>
            </div>
          </div>
        </div>

        <div className="risk-list">
          <h4>Risk flags and explanations</h4>
          {refund.riskFlags.length > 0 ? (
            <ul className="risk-list__items">
              {refund.riskFlags.map((flag) => (
                <li className="risk-list__item" key={flag.code}>
                  <div className="risk-list__header">
                    <Badge
                      tone={
                        flag.severity === 'critical' ? 'critical' : 'warning'
                      }
                    >
                      {flag.title}
                    </Badge>
                    <span className="risk-list__blocking">
                      {flag.blocking ? 'Blocking' : 'Review'}
                    </span>
                  </div>
                  <p>{flag.explanation}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="risk-list__empty">
              No warnings were triggered for this request under the seeded
              rules.
            </p>
          )}
        </div>

        {simulation ? (
          <div className="risk-list">
            <h4>What if you approve this?</h4>
            <div
              className={
                simulation.state === 'blocked'
                  ? 'detail-alert detail-alert--critical'
                  : simulation.state === 'review'
                    ? 'detail-alert detail-alert--warning'
                    : 'detail-alert detail-alert--success'
              }
            >
              <strong>{simulation.headline}</strong>
              <p>{simulation.summary}</p>
            </div>

            <div className="detail-grid">
              <div>
                <p className="queue-row__label">Duplicate overlaps</p>
                <strong>{simulation.duplicateExposureCount}</strong>
              </div>
              <div>
                <p className="queue-row__label">Blocking reasons</p>
                <strong>{simulation.blockingReasons.length}</strong>
              </div>
              <div>
                <p className="queue-row__label">Review reasons</p>
                <strong>{simulation.reviewReasons.length}</strong>
              </div>
              <div>
                <p className="queue-row__label">Conflicting request IDs</p>
                <strong>
                  {simulation.conflictingRequestIds.length > 0
                    ? simulation.conflictingRequestIds.join(', ')
                    : 'None'}
                </strong>
              </div>
            </div>
          </div>
        ) : null}

        <div className="detail-actions">
          <div className="button-row">
            <Button onClick={() => onDecision('approved')}>
              Approve refund
            </Button>
            <Button onClick={() => onDecision('rejected')} variant="secondary">
              Reject
            </Button>
            <Button onClick={() => onDecision('flagged')} variant="ghost">
              Flag for review
            </Button>
          </div>
          <div className="batch-bar__actions">
            <Button
              aria-label={`${isBatchSelected ? 'Remove' : 'Add'} ${refund.id} ${refund.customer.name} ${isBatchSelected ? 'from' : 'to'} batch`}
              onClick={() => onToggleBatchSelection(refund.id)}
              variant="secondary"
            >
              {isBatchSelected ? 'Remove from batch' : 'Add to batch'}
            </Button>
            {actionOverride ? (
              <Badge tone={statusBadgeTone(actionOverride)}>
                {statusLabel(actionOverride)}
              </Badge>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  )
}
