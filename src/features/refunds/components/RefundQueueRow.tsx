import type { KeyboardEvent } from 'react'
import { Badge } from '../../../components/ui/Badge.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import type { EnrichedRefundRequest } from '../../../domain/refunds.ts'
import {
  formatCompactDate,
  formatCurrency,
  paymentMethodLabels,
  riskLabel,
  riskTone,
  statusBadgeTone,
  statusLabel,
  transactionStatusLabels,
} from '../refundExplorerPresentation.ts'

type RefundQueueRowProps = {
  isBatchSelected: boolean
  isDetailSelected: boolean
  onOpenDetails: (refundId: string) => void
  onQueueRowKeyDown: (
    event: KeyboardEvent<HTMLDivElement>,
    refundId: string,
  ) => void
  onToggleSelection: (refundId: string) => void
  refundRequest: EnrichedRefundRequest
}

export function RefundQueueRow({
  isBatchSelected,
  isDetailSelected,
  onOpenDetails,
  onQueueRowKeyDown,
  onToggleSelection,
  refundRequest,
}: RefundQueueRowProps) {
  return (
    <div
      className={[
        'queue-row',
        isDetailSelected ? 'queue-row--selected' : '',
        isBatchSelected ? 'queue-row--batch-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="listitem"
    >
      <div className="queue-row__topline">
        <div className="queue-row__selection">
          <button
            aria-label={
              isBatchSelected
                ? `Remove ${refundRequest.id} from batch selection`
                : `Add ${refundRequest.id} to batch selection`
            }
            aria-pressed={isBatchSelected}
            className={
              isBatchSelected
                ? 'queue-row__select queue-row__select--active'
                : 'queue-row__select'
            }
            onClick={(event) => {
              event.stopPropagation()
              onToggleSelection(refundRequest.id)
            }}
            type="button"
          >
            {isBatchSelected ? 'Selected' : 'Select'}
          </button>
          <div>
            <p className="request-list__id">{refundRequest.id}</p>
            <strong>{refundRequest.customer.name}</strong>
          </div>
        </div>

        <div className="queue-row__meta-actions">
          <Badge tone={riskTone(refundRequest.riskLevel)}>
            {riskLabel(refundRequest.riskLevel)}
          </Badge>
          <Button
            aria-label={`Review details for ${refundRequest.id} ${refundRequest.customer.name}`}
            onClick={() => onOpenDetails(refundRequest.id)}
            variant="ghost"
          >
            Review details
          </Button>
        </div>
      </div>

      <div
        className="queue-row__interactive"
        onClick={() => onOpenDetails(refundRequest.id)}
        onKeyDown={(event) => onQueueRowKeyDown(event, refundRequest.id)}
        role="button"
        tabIndex={0}
      >
        <div className="queue-row__grid">
          <div>
            <p className="queue-row__label">Customer</p>
            <strong>{refundRequest.customer.externalId}</strong>
          </div>
          <div>
            <p className="queue-row__label">Payment method</p>
            <strong>
              {paymentMethodLabels[refundRequest.transaction.paymentMethod]}
            </strong>
          </div>
          <div>
            <p className="queue-row__label">Requested refund</p>
            <strong>{formatCurrency(refundRequest.requestedAmount)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Original amount</p>
            <strong>{formatCurrency(refundRequest.transaction.amount)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Transaction date</p>
            <strong>
              {formatCompactDate(refundRequest.transaction.transactionDate)}
            </strong>
          </div>
          <div>
            <p className="queue-row__label">Request date</p>
            <strong>{formatCompactDate(refundRequest.requestDate)}</strong>
          </div>
          <div>
            <p className="queue-row__label">Transaction status</p>
            <strong>
              {transactionStatusLabels[refundRequest.transaction.status]}
            </strong>
          </div>
          <div>
            <p className="queue-row__label">Warnings</p>
            <strong>{refundRequest.riskFlags.length}</strong>
          </div>
        </div>

        <div className="queue-row__footer">
          <div className="queue-row__flaglist">
            {refundRequest.riskFlags.slice(0, 2).map((flag) => (
              <span
                className={`chip ${
                  flag.severity === 'critical'
                    ? 'chip--critical'
                    : 'chip--warning'
                }`}
                key={flag.code}
              >
                {flag.title}
              </span>
            ))}
            {refundRequest.riskFlags.length > 2 ? (
              <span className="chip">
                +{refundRequest.riskFlags.length - 2} more
              </span>
            ) : null}
          </div>
          <Badge tone={statusBadgeTone('pending')}>
            {statusLabel('pending')}
          </Badge>
        </div>
      </div>
    </div>
  )
}
