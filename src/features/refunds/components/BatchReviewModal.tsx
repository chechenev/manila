import { Badge } from '../../../components/ui/Badge.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import type {
  BatchSafetySummary,
  EnrichedRefundRequest,
} from '../../../domain/refunds.ts'
import {
  batchStateLabel,
  batchStateTone,
  formatCurrency,
} from '../refundExplorerPresentation.ts'

type BatchAlert = {
  description: string
  title: string
}

type BatchReviewModalProps = {
  batchAlert: BatchAlert
  batchSummary: BatchSafetySummary
  blockingBatchRefunds: EnrichedRefundRequest[]
  excludedBatchRefunds: EnrichedRefundRequest[]
  onApprove: () => void
  onClearBatch: () => void
  onClose: (event?: {
    preventDefault?: () => void
    stopPropagation?: () => void
  }) => void
  onExcludeFlagged: () => void
  onFlag: () => void
  onIncludeAll: () => void
  onToggleExcluded: (refundId: string) => void
  reviewBatchRefunds: EnrichedRefundRequest[]
  safeBatchRefunds: EnrichedRefundRequest[]
}

function RefundBatchSection({
  refunds,
  title,
  tone,
  emptyCopy,
  actionLabel,
  onToggleExcluded,
}: {
  actionLabel: string
  emptyCopy: string
  onToggleExcluded: (refundId: string) => void
  refunds: EnrichedRefundRequest[]
  title: string
  tone: 'critical' | 'warning' | 'success'
}) {
  return (
    <div className="batch-review-section">
      <div className="risk-list__header">
        <h5>{title}</h5>
        <Badge tone={tone}>{refunds.length}</Badge>
      </div>
      {refunds.length > 0 ? (
        <ul className="risk-list__items">
          {refunds.map((refund) => (
            <li className="risk-list__item" key={refund.id}>
              <div className="batch-review-item">
                <div>
                  <p className="request-list__id">{refund.id}</p>
                  <strong>{refund.customer.name}</strong>
                  <p>{formatCurrency(refund.requestedAmount)}</p>
                </div>
                <Button
                  onClick={() => onToggleExcluded(refund.id)}
                  variant={tone === 'success' ? 'ghost' : 'secondary'}
                >
                  {actionLabel}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="risk-list__empty">{emptyCopy}</p>
      )}
    </div>
  )
}

export function BatchReviewModal({
  batchAlert,
  batchSummary,
  blockingBatchRefunds,
  excludedBatchRefunds,
  onApprove,
  onClearBatch,
  onClose,
  onExcludeFlagged,
  onFlag,
  onIncludeAll,
  onToggleExcluded,
  reviewBatchRefunds,
  safeBatchRefunds,
}: BatchReviewModalProps) {
  return (
    <div className="detail-modal">
      <button
        aria-label="Close batch review"
        className="detail-modal__backdrop"
        onMouseDown={onClose}
        type="button"
      />
      <Card
        aria-label="Batch refund review"
        aria-modal="true"
        className="detail-panel detail-panel--modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="detail-panel__header">
          <div>
            <p className="request-list__id">Batch safety review</p>
            <h3 className="detail-panel__title">
              Preflight the selected refund batch
            </h3>
            <p className="detail-panel__subtitle">
              Review selected items, exclude flagged requests, and only approve
              what is safe to move forward.
            </p>
          </div>
          <div className="detail-panel__header-actions">
            <Badge tone={batchStateTone(batchSummary.state)}>
              {batchStateLabel(batchSummary.state)}
            </Badge>
            <button
              aria-label="Close batch review"
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
            batchSummary.state === 'blocked'
              ? 'detail-alert detail-alert--critical'
              : batchSummary.state === 'review'
                ? 'detail-alert detail-alert--warning'
                : 'detail-alert detail-alert--success'
          }
        >
          <strong>{batchAlert.title}</strong>
          <p>{batchAlert.description}</p>
        </div>

        <div className="detail-grid">
          <div>
            <p className="queue-row__label">Selected requests</p>
            <strong>{batchSummary.selectedCount}</strong>
          </div>
          <div>
            <p className="queue-row__label">Included amount</p>
            <strong>{formatCurrency(batchSummary.includedAmount)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Excluded amount</p>
            <strong>{formatCurrency(batchSummary.excludedAmount)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Blocking requests</p>
            <strong>{batchSummary.blockingCount}</strong>
          </div>
          <div>
            <p className="queue-row__label">Critical requests</p>
            <strong>{batchSummary.criticalCount}</strong>
          </div>
          <div>
            <p className="queue-row__label">Review requests</p>
            <strong>{batchSummary.reviewCount}</strong>
          </div>
          <div>
            <p className="queue-row__label">Safe requests</p>
            <strong>{batchSummary.safeCount}</strong>
          </div>
          <div>
            <p className="queue-row__label">Excluded requests</p>
            <strong>{batchSummary.excludedCount}</strong>
          </div>
        </div>

        <div className="batch-tools">
          <div className="button-row">
            <Button onClick={onExcludeFlagged} variant="secondary">
              Exclude flagged items
            </Button>
            <Button onClick={onIncludeAll} variant="ghost">
              Include all selected
            </Button>
            <Button onClick={onClearBatch} variant="ghost">
              Clear batch
            </Button>
          </div>
        </div>

        <div className="risk-list">
          <h4>Included items</h4>
          <div className="batch-review-sections">
            <RefundBatchSection
              actionLabel="Exclude"
              emptyCopy="No blocking items remain in the included set."
              onToggleExcluded={onToggleExcluded}
              refunds={blockingBatchRefunds}
              title="Blocking items"
              tone="critical"
            />
            <RefundBatchSection
              actionLabel="Exclude"
              emptyCopy="No review-only items remain in the included set."
              onToggleExcluded={onToggleExcluded}
              refunds={reviewBatchRefunds}
              title="Review items"
              tone="warning"
            />
            <RefundBatchSection
              actionLabel="Exclude"
              emptyCopy="No safe items are currently included."
              onToggleExcluded={onToggleExcluded}
              refunds={safeBatchRefunds}
              title="Safe items"
              tone="success"
            />
          </div>
        </div>

        {excludedBatchRefunds.length > 0 ? (
          <div className="risk-list">
            <h4>Excluded items</h4>
            <ul className="risk-list__items">
              {excludedBatchRefunds.map((refund) => (
                <li className="risk-list__item" key={refund.id}>
                  <div className="batch-review-item">
                    <div>
                      <p className="request-list__id">{refund.id}</p>
                      <strong>{refund.customer.name}</strong>
                      <p>{formatCurrency(refund.requestedAmount)}</p>
                    </div>
                    <Button
                      onClick={() => onToggleExcluded(refund.id)}
                      variant="secondary"
                    >
                      Re-include
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="detail-actions">
          <div className="button-row">
            <Button
              disabled={
                batchSummary.state === 'blocked' ||
                batchSummary.includedCount === 0
              }
              onClick={onApprove}
            >
              Approve included batch
            </Button>
            <Button
              disabled={batchSummary.includedCount === 0}
              onClick={onFlag}
              variant="secondary"
            >
              Flag included batch
            </Button>
            <Button onClick={onClose} variant="ghost">
              Close review
            </Button>
          </div>
          <Badge tone={batchStateTone(batchSummary.state)}>
            {batchSummary.includedCount} included / {batchSummary.excludedCount}{' '}
            excluded
          </Badge>
        </div>
      </Card>
    </div>
  )
}
