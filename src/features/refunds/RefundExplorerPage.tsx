import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import {
  FieldLabel,
  SelectInput,
  TextInput,
} from '../../components/ui/Field.tsx'
import { SectionHeading } from '../../components/ui/SectionHeading.tsx'
import { refundWorkbenchSeedData } from '../../data/loadSeedData.ts'
import type {
  BatchProcessState,
  EnrichedRefundRequest,
  PaymentMethod,
  RiskLevel,
  TransactionStatus,
} from '../../domain/refunds.ts'
import { enrichAllRefundRequests } from '../../domain/risk.ts'
import {
  buildPaymentMethodSummaries,
  calculatePendingExposureTotal,
} from '../../domain/selectors.ts'
import {
  buildBatchSafetySummary,
  buildFilteredViewImpact,
  simulateRefundApproval,
} from '../../domain/simulation.ts'

type FilterState = {
  query: string
  paymentMethod: string
  transactionStatus: string
  minAmount: string
  maxAmount: string
  dateFrom: string
  dateTo: string
  sortBy: 'risk' | 'newest' | 'oldest' | 'amount_desc' | 'amount_asc'
}

type ActionStatus = 'approved' | 'rejected' | 'flagged'

const pageSize = 20

const defaultFilters: FilterState = {
  query: '',
  paymentMethod: 'all',
  transactionStatus: 'all',
  minAmount: '',
  maxAmount: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'risk',
}

const riskRank: Record<RiskLevel, number> = {
  critical: 3,
  review: 2,
  safe: 1,
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  credit_card: 'Credit Card',
  cash_on_delivery: 'Cash on Delivery',
}

const transactionStatusLabels: Record<TransactionStatus, string> = {
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

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatCompactDate(isoValue: string) {
  return compactDateFormatter.format(new Date(isoValue))
}

function formatDetailDate(isoValue: string | null) {
  return isoValue ? detailDateFormatter.format(new Date(isoValue)) : 'N/A'
}

function toInputDate(isoValue: string) {
  return new Date(isoValue).toISOString().slice(0, 10)
}

function riskTone(level: RiskLevel): 'critical' | 'warning' | 'success' {
  if (level === 'critical') {
    return 'critical'
  }

  if (level === 'review') {
    return 'warning'
  }

  return 'success'
}

function riskLabel(level: RiskLevel) {
  if (level === 'critical') {
    return 'Critical risk'
  }

  if (level === 'review') {
    return 'Needs review'
  }

  return 'Safe to process'
}

function statusBadgeTone(status: ActionStatus | 'pending') {
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

function statusLabel(status: ActionStatus | 'pending') {
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

function batchStateTone(state: BatchProcessState) {
  if (state === 'blocked') {
    return 'critical' as const
  }

  if (state === 'review') {
    return 'warning' as const
  }

  return 'success' as const
}

function batchStateLabel(state: BatchProcessState) {
  if (state === 'blocked') {
    return 'Blocked'
  }

  if (state === 'review') {
    return 'Needs review'
  }

  return 'Safe batch'
}

function activeFilterChips(filters: FilterState) {
  return [
    filters.query ? `Search: ${filters.query}` : null,
    filters.paymentMethod !== 'all'
      ? `Method: ${paymentMethodLabels[filters.paymentMethod as PaymentMethod]}`
      : null,
    filters.transactionStatus !== 'all'
      ? `Status: ${transactionStatusLabels[filters.transactionStatus as TransactionStatus]}`
      : null,
    filters.minAmount
      ? `Min: ${formatCurrency(Number(filters.minAmount))}`
      : null,
    filters.maxAmount
      ? `Max: ${formatCurrency(Number(filters.maxAmount))}`
      : null,
    filters.dateFrom ? `From: ${filters.dateFrom}` : null,
    filters.dateTo ? `To: ${filters.dateTo}` : null,
  ].filter(Boolean) as string[]
}

function parseFilters(searchParams: URLSearchParams): FilterState {
  const sortBy = searchParams.get('sortBy')

  return {
    query: searchParams.get('query') ?? '',
    paymentMethod: searchParams.get('paymentMethod') ?? 'all',
    transactionStatus: searchParams.get('transactionStatus') ?? 'all',
    minAmount: searchParams.get('minAmount') ?? '',
    maxAmount: searchParams.get('maxAmount') ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
    sortBy:
      sortBy === 'newest' ||
      sortBy === 'oldest' ||
      sortBy === 'amount_desc' ||
      sortBy === 'amount_asc'
        ? sortBy
        : 'risk',
  }
}

function parsePage(searchParams: URLSearchParams) {
  const value = Number(searchParams.get('page') ?? '1')
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
}

function normalizeDateRange(filters: FilterState): FilterState {
  if (filters.dateFrom && filters.dateTo && filters.dateTo < filters.dateFrom) {
    return {
      ...filters,
      dateTo: filters.dateFrom,
    }
  }

  return filters
}

function buildSearchParams(filters: FilterState, page: number) {
  const normalizedFilters = normalizeDateRange(filters)
  const params = new URLSearchParams()

  if (normalizedFilters.query) params.set('query', normalizedFilters.query)
  if (normalizedFilters.paymentMethod !== 'all') {
    params.set('paymentMethod', normalizedFilters.paymentMethod)
  }
  if (normalizedFilters.transactionStatus !== 'all') {
    params.set('transactionStatus', normalizedFilters.transactionStatus)
  }
  if (normalizedFilters.minAmount)
    params.set('minAmount', normalizedFilters.minAmount)
  if (normalizedFilters.maxAmount)
    params.set('maxAmount', normalizedFilters.maxAmount)
  if (normalizedFilters.dateFrom)
    params.set('dateFrom', normalizedFilters.dateFrom)
  if (normalizedFilters.dateTo) params.set('dateTo', normalizedFilters.dateTo)
  if (normalizedFilters.sortBy !== 'risk')
    params.set('sortBy', normalizedFilters.sortBy)
  params.set('page', String(page))

  return params
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, 2, 3, totalPages, currentPage])

  if (currentPage > 3 && currentPage < totalPages) {
    pages.add(currentPage)
  }

  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right)
    .flatMap((page, index, collection) => {
      if (index === 0) {
        return [page]
      }

      const previousPage = collection[index - 1]
      if (page - previousPage > 1) {
        return ['ellipsis', page] as const
      }

      return [page]
    })
}

function hasBlockingFlags(refund: EnrichedRefundRequest) {
  return refund.riskFlags.some((flag) => flag.blocking)
}

function getBatchAlertCopy(state: BatchProcessState) {
  if (state === 'blocked') {
    return {
      title: 'Blocking items are still included in this batch.',
      description:
        'Exclude blocking requests before approving the batch, or process them individually after review.',
    }
  }

  if (state === 'review') {
    return {
      title: 'Batch can proceed, but review-only items remain.',
      description:
        'Non-blocking warnings are still present, so the included items should be reviewed before final approval.',
    }
  }

  return {
    title: 'Included items are safe under the seeded rules.',
    description:
      'No blocking or review signals remain in the included set, so this batch is ready for a clean local approval demo.',
  }
}

const enrichedRefunds = enrichAllRefundRequests(refundWorkbenchSeedData)
const paymentMethodSummaries = buildPaymentMethodSummaries(
  refundWorkbenchSeedData,
)

export function RefundExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(
    () => normalizeDateRange(parseFilters(searchParams)),
    [searchParams],
  )
  const currentPageParam = useMemo(
    () => parsePage(searchParams),
    [searchParams],
  )
  const [draftFilters, setDraftFilters] = useState<FilterState>(appliedFilters)
  const [actionOverrides, setActionOverrides] = useState<
    Partial<Record<string, ActionStatus>>
  >({})
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null)
  const [selectedRefundIds, setSelectedRefundIds] = useState<string[]>([])
  const [excludedBatchIds, setExcludedBatchIds] = useState<string[]>([])
  const [isBatchReviewOpen, setIsBatchReviewOpen] = useState(false)

  useEffect(() => {
    setDraftFilters(appliedFilters)
  }, [appliedFilters])

  useEffect(() => {
    if (selectedRefundId === null && !isBatchReviewOpen) {
      return
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedRefundId(null)
        setIsBatchReviewOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isBatchReviewOpen, selectedRefundId])

  const queueItems = useMemo(() => {
    const pendingOnly = enrichedRefunds.filter((refundRequest) => {
      const effectiveStatus =
        actionOverrides[refundRequest.id] ?? refundRequest.status
      return effectiveStatus === 'pending'
    })

    const filtered = pendingOnly.filter((refundRequest) => {
      const normalizedQuery = appliedFilters.query.trim().toLowerCase()
      if (normalizedQuery) {
        const haystack = [
          refundRequest.id,
          refundRequest.transaction.id,
          refundRequest.transaction.orderId,
          refundRequest.customer.id,
          refundRequest.customer.externalId,
          refundRequest.customer.name,
        ]
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(normalizedQuery)) {
          return false
        }
      }

      if (
        appliedFilters.paymentMethod !== 'all' &&
        refundRequest.transaction.paymentMethod !== appliedFilters.paymentMethod
      ) {
        return false
      }

      if (
        appliedFilters.transactionStatus !== 'all' &&
        refundRequest.transaction.status !== appliedFilters.transactionStatus
      ) {
        return false
      }

      if (
        appliedFilters.minAmount &&
        refundRequest.requestedAmount < Number(appliedFilters.minAmount)
      ) {
        return false
      }

      if (
        appliedFilters.maxAmount &&
        refundRequest.requestedAmount > Number(appliedFilters.maxAmount)
      ) {
        return false
      }

      if (
        appliedFilters.dateFrom &&
        toInputDate(refundRequest.requestDate) < appliedFilters.dateFrom
      ) {
        return false
      }

      if (
        appliedFilters.dateTo &&
        toInputDate(refundRequest.requestDate) > appliedFilters.dateTo
      ) {
        return false
      }

      return true
    })

    return [...filtered].sort((left, right) => {
      if (appliedFilters.sortBy === 'risk') {
        const riskDifference =
          riskRank[right.riskLevel] - riskRank[left.riskLevel]
        if (riskDifference !== 0) {
          return riskDifference
        }

        return right.requestDate.localeCompare(left.requestDate)
      }

      if (appliedFilters.sortBy === 'newest') {
        return right.requestDate.localeCompare(left.requestDate)
      }

      if (appliedFilters.sortBy === 'oldest') {
        return left.requestDate.localeCompare(right.requestDate)
      }

      if (appliedFilters.sortBy === 'amount_desc') {
        return right.requestedAmount - left.requestedAmount
      }

      return left.requestedAmount - right.requestedAmount
    })
  }, [actionOverrides, appliedFilters])

  const totalPages = Math.max(1, Math.ceil(queueItems.length / pageSize))
  const currentPage = Math.min(currentPageParam, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const paginatedQueueItems = queueItems.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    const visibleIds = new Set(queueItems.map((refund) => refund.id))

    setSelectedRefundIds((current) =>
      current.filter((refundId) => visibleIds.has(refundId)),
    )
    setExcludedBatchIds((current) =>
      current.filter((refundId) => visibleIds.has(refundId)),
    )

    if (selectedRefundId && !visibleIds.has(selectedRefundId)) {
      setSelectedRefundId(null)
    }
  }, [queueItems, selectedRefundId])

  const activeSelectedRefundId =
    selectedRefundId &&
    queueItems.some((refund) => refund.id === selectedRefundId)
      ? selectedRefundId
      : null

  const selectedRefund = useMemo(
    () =>
      queueItems.find(
        (refundRequest) => refundRequest.id === activeSelectedRefundId,
      ) ?? null,
    [activeSelectedRefundId, queueItems],
  )

  const selectedRefunds = useMemo(
    () => queueItems.filter((refund) => selectedRefundIds.includes(refund.id)),
    [queueItems, selectedRefundIds],
  )

  const filteredViewImpact = useMemo(
    () => buildFilteredViewImpact(queueItems),
    [queueItems],
  )
  const batchSummary = useMemo(
    () => buildBatchSafetySummary(selectedRefunds, excludedBatchIds),
    [excludedBatchIds, selectedRefunds],
  )
  const includedBatchRefunds = useMemo(
    () =>
      selectedRefunds.filter((refund) => !excludedBatchIds.includes(refund.id)),
    [excludedBatchIds, selectedRefunds],
  )
  const blockingBatchRefunds = useMemo(
    () => includedBatchRefunds.filter(hasBlockingFlags),
    [includedBatchRefunds],
  )
  const reviewBatchRefunds = useMemo(
    () =>
      includedBatchRefunds.filter(
        (refund) => refund.riskLevel === 'review' && !hasBlockingFlags(refund),
      ),
    [includedBatchRefunds],
  )
  const safeBatchRefunds = useMemo(
    () => includedBatchRefunds.filter((refund) => refund.riskLevel === 'safe'),
    [includedBatchRefunds],
  )
  const excludedBatchRefunds = useMemo(
    () =>
      selectedRefunds.filter((refund) => excludedBatchIds.includes(refund.id)),
    [excludedBatchIds, selectedRefunds],
  )
  const selectedRefundSimulation = useMemo(
    () =>
      selectedRefund
        ? simulateRefundApproval(selectedRefund, queueItems)
        : null,
    [queueItems, selectedRefund],
  )
  const chips = activeFilterChips(appliedFilters)
  const batchAlert = getBatchAlertCopy(batchSummary.state)

  const queueMetrics = useMemo(() => {
    const criticalCount = queueItems.filter(
      (refund) => refund.riskLevel === 'critical',
    ).length
    const reviewCount = queueItems.filter(
      (refund) => refund.riskLevel === 'review',
    ).length
    const pendingExposure = queueItems.reduce(
      (total, refund) => total + refund.requestedAmount,
      0,
    )

    return [
      {
        label: 'Pending queue',
        value: queueItems.length.toLocaleString(),
        tooltip:
          'Refund requests currently visible in the queue after filters are applied.',
      },
      {
        label: 'Critical risk',
        value: criticalCount.toLocaleString(),
        tooltip:
          'Visible requests blocked by duplicate, chargeback, or invalid refund conditions.',
      },
      {
        label: 'Needs review',
        value: reviewCount.toLocaleString(),
        tooltip:
          'Visible requests that are not blocked, but still require operator review.',
      },
      {
        label: 'Exposure',
        value: formatCurrency(pendingExposure),
        tooltip:
          'Total requested amount represented by the currently visible pending queue.',
      },
    ]
  }, [queueItems])

  const summaryHighlights = useMemo(() => {
    const ratios = paymentMethodSummaries
      .filter((summary) => summary.refundToTransactionRatio > 0)
      .sort(
        (left, right) =>
          right.refundToTransactionRatio - left.refundToTransactionRatio,
      )
    const topRatio = ratios[0]

    return {
      totalPendingExposure: formatCurrency(
        calculatePendingExposureTotal(refundWorkbenchSeedData),
      ),
      highestRatioMethod: topRatio
        ? `${paymentMethodLabels[topRatio.paymentMethod]} (${Math.round(
            topRatio.refundToTransactionRatio * 100,
          )}%)`
        : 'N/A',
    }
  }, [])

  function updateDraft<K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  function updateDateRange(boundary: 'dateFrom' | 'dateTo', value: string) {
    setDraftFilters((current) => {
      if (boundary === 'dateFrom') {
        return {
          ...current,
          dateFrom: value,
          dateTo:
            current.dateTo && value && current.dateTo < value
              ? value
              : current.dateTo,
        }
      }

      return {
        ...current,
        dateTo: value,
        dateFrom:
          current.dateFrom && value && value < current.dateFrom
            ? value
            : current.dateFrom,
      }
    })
  }

  function applyFilters() {
    setSearchParams(buildSearchParams(draftFilters, 1))
  }

  function resetFilters() {
    setDraftFilters(defaultFilters)
    setSearchParams(buildSearchParams(defaultFilters, 1))
    setSelectedRefundIds([])
    setExcludedBatchIds([])
    setIsBatchReviewOpen(false)
  }

  function handleDecision(decision: ActionStatus) {
    if (!selectedRefund) {
      return
    }

    setActionOverrides((current) => ({
      ...current,
      [selectedRefund.id]: decision,
    }))
    setSelectedRefundId(null)
  }

  function handleBatchDecision(decision: ActionStatus) {
    if (includedBatchRefunds.length === 0 || batchSummary.state === 'blocked') {
      return
    }

    setActionOverrides((current) => ({
      ...current,
      ...Object.fromEntries(
        includedBatchRefunds.map((refund) => [refund.id, decision]),
      ),
    }))
    setSelectedRefundIds([])
    setExcludedBatchIds([])
    setIsBatchReviewOpen(false)
  }

  function changePage(nextPage: number) {
    setSearchParams(buildSearchParams(appliedFilters, nextPage))
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyFilters()
  }

  function closeDetailModal(event?: {
    preventDefault?: () => void
    stopPropagation?: () => void
  }) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setSelectedRefundId(null)
  }

  function closeBatchReview(event?: {
    preventDefault?: () => void
    stopPropagation?: () => void
  }) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setIsBatchReviewOpen(false)
  }

  function toggleRefundSelection(refundId: string) {
    setSelectedRefundIds((current) =>
      current.includes(refundId)
        ? current.filter((id) => id !== refundId)
        : [...current, refundId],
    )
  }

  function toggleExcludedBatchItem(refundId: string) {
    setExcludedBatchIds((current) =>
      current.includes(refundId)
        ? current.filter((id) => id !== refundId)
        : [...current, refundId],
    )
  }

  function excludeFlaggedBatchItems() {
    setExcludedBatchIds(
      selectedRefunds
        .filter((refund) => refund.riskLevel !== 'safe')
        .map((refund) => refund.id),
    )
  }

  function includeAllBatchItems() {
    setExcludedBatchIds([])
  }

  function clearBatchSelection() {
    setSelectedRefundIds([])
    setExcludedBatchIds([])
    setIsBatchReviewOpen(false)
  }

  function openBatchReview() {
    if (selectedRefunds.length === 0) {
      return
    }

    setIsBatchReviewOpen(true)
  }

  function openRefundDetails(refundId: string) {
    setSelectedRefundId(refundId)
  }

  function handleQueueRowKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    refundId: string,
  ) {
    const target = event.target as HTMLElement
    if (target.closest('button')) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openRefundDetails(refundId)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="Primary Workflow"
        title="Refund Explorer"
        description="Review pending refund requests, understand why they are risky, and take a safe next action without leaving the queue."
      />

      <div className="summary-strip">
        <Card className="summary-strip__card">
          <p className="summary-strip__label">Seeded queue baseline</p>
          <strong>{summaryHighlights.totalPendingExposure}</strong>
          <span>Total pending exposure across the full seeded dataset.</span>
        </Card>
        <Card className="summary-strip__card">
          <p className="summary-strip__label">Highest refund ratio</p>
          <strong>{summaryHighlights.highestRatioMethod}</strong>
          <span>
            Top payment method by refund-request-to-transaction ratio.
          </span>
        </Card>
      </div>

      <div className="metrics-grid" role="list" aria-label="Queue highlights">
        {queueMetrics.map((metric) => (
          <Card key={metric.label} className="metric-card" role="listitem">
            <div className="metric-card__header">
              <p className="metric-card__label">{metric.label}</p>
              <button
                aria-label={`${metric.label} info`}
                className="metric-card__tooltip"
                data-tooltip={metric.tooltip}
                type="button"
              >
                i
              </button>
            </div>
            <div className="metric-card__value-row">
              <strong className="metric-card__value">{metric.value}</strong>
            </div>
          </Card>
        ))}
      </div>

      <Card className="foundation-card">
        <SectionHeading
          eyebrow="Queue Controls"
          title="Search, filter, and sort the pending queue"
          description="Use the controls below to narrow the queue by customer, amount, date, payment method, or original transaction status."
        />

        <form className="filter-form" onSubmit={handleFilterSubmit}>
          <div className="filter-grid filter-grid--explorer">
            <div>
              <FieldLabel
                htmlFor="refund-query"
                label="Customer, order, or refund ID"
              />
              <TextInput
                id="refund-query"
                name="refund-query"
                onChange={(event) => updateDraft('query', event.target.value)}
                placeholder="Search by customer name, CUS, RF, TXN, or order"
                value={draftFilters.query}
              />
            </div>

            <div>
              <FieldLabel htmlFor="payment-method" label="Payment method" />
              <SelectInput
                id="payment-method"
                name="payment-method"
                onChange={(event) =>
                  updateDraft('paymentMethod', event.target.value)
                }
                value={draftFilters.paymentMethod}
              >
                <option value="all">All methods</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </SelectInput>
            </div>

            <div>
              <FieldLabel
                htmlFor="transaction-status"
                label="Transaction status"
              />
              <SelectInput
                id="transaction-status"
                name="transaction-status"
                onChange={(event) =>
                  updateDraft('transactionStatus', event.target.value)
                }
                value={draftFilters.transactionStatus}
              >
                <option value="all">All statuses</option>
                <option value="authorized">Authorized</option>
                <option value="captured">Captured</option>
                <option value="settled">Settled</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
                <option value="chargeback_filed">Chargeback filed</option>
              </SelectInput>
            </div>

            <div>
              <FieldLabel htmlFor="min-amount" label="Minimum amount" />
              <TextInput
                id="min-amount"
                inputMode="decimal"
                name="min-amount"
                onChange={(event) =>
                  updateDraft('minAmount', event.target.value)
                }
                placeholder="0"
                value={draftFilters.minAmount}
              />
            </div>

            <div>
              <FieldLabel htmlFor="max-amount" label="Maximum amount" />
              <TextInput
                id="max-amount"
                inputMode="decimal"
                name="max-amount"
                onChange={(event) =>
                  updateDraft('maxAmount', event.target.value)
                }
                placeholder="15000"
                value={draftFilters.maxAmount}
              />
            </div>

            <div>
              <FieldLabel htmlFor="sort-by" label="Sort queue by" />
              <SelectInput
                id="sort-by"
                name="sort-by"
                onChange={(event) =>
                  updateDraft(
                    'sortBy',
                    event.target.value as FilterState['sortBy'],
                  )
                }
                value={draftFilters.sortBy}
              >
                <option value="risk">Risk first</option>
                <option value="newest">Newest requests</option>
                <option value="oldest">Oldest requests</option>
                <option value="amount_desc">Largest amounts</option>
                <option value="amount_asc">Smallest amounts</option>
              </SelectInput>
            </div>

            <div>
              <FieldLabel htmlFor="date-from" label="Request date from" />
              <TextInput
                id="date-from"
                max={draftFilters.dateTo || undefined}
                name="date-from"
                onChange={(event) =>
                  updateDateRange('dateFrom', event.target.value)
                }
                type="date"
                value={draftFilters.dateFrom}
              />
            </div>

            <div>
              <FieldLabel htmlFor="date-to" label="Request date to" />
              <TextInput
                id="date-to"
                min={draftFilters.dateFrom || undefined}
                name="date-to"
                onChange={(event) =>
                  updateDateRange('dateTo', event.target.value)
                }
                type="date"
                value={draftFilters.dateTo}
              />
            </div>
          </div>

          <div className="button-row">
            <Button type="submit">Apply Filters</Button>
            <Button onClick={resetFilters} type="button" variant="secondary">
              Reset
            </Button>
            <Button
              disabled={selectedRefunds.length === 0}
              onClick={openBatchReview}
              type="button"
              variant="ghost"
            >
              Open Bulk Review
            </Button>
          </div>
        </form>

        <div className="chip-row" aria-label="Active filters">
          <span className="chip chip--static">Pending queue only</span>
          {chips.length > 0 ? (
            chips.map((chip) => (
              <span className="chip" key={chip}>
                {chip}
              </span>
            ))
          ) : (
            <span className="chip">No additional filters applied</span>
          )}
        </div>
      </Card>

      <div className="summary-strip">
        <Card className="summary-strip__card">
          <p className="summary-strip__label">Filtered view impact</p>
          <strong>{formatCurrency(filteredViewImpact.totalAmount)}</strong>
          <span>
            {filteredViewImpact.requestCount} visible requests, with{' '}
            {formatCurrency(filteredViewImpact.criticalAmount)} in critical
            exposure.
          </span>
        </Card>
        <Card className="summary-strip__card">
          <p className="summary-strip__label">Batch selection</p>
          <strong>{selectedRefunds.length.toLocaleString()} selected</strong>
          <span>
            {selectedRefunds.length > 0
              ? `${batchSummary.includedCount} included for ${formatCurrency(
                  batchSummary.includedAmount,
                )}`
              : 'Select requests to prepare a safe bulk review batch.'}
          </span>
        </Card>
      </div>

      {selectedRefunds.length > 0 ? (
        <Card className="batch-bar">
          <div>
            <p className="summary-strip__label">Batch review ready</p>
            <strong>
              {selectedRefunds.length} selected ·{' '}
              {formatCurrency(batchSummary.selectedAmount)}
            </strong>
            <p className="batch-bar__copy">
              {batchSummary.criticalCount} critical and{' '}
              {batchSummary.reviewCount} review items are currently selected.
            </p>
          </div>
          <div className="batch-bar__actions">
            <Badge tone={batchStateTone(batchSummary.state)}>
              {batchStateLabel(batchSummary.state)}
            </Badge>
            <Button onClick={openBatchReview} variant="secondary">
              Review batch
            </Button>
            <Button onClick={clearBatchSelection} variant="ghost">
              Clear selection
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="queue-panel">
        <div className="queue-panel__header">
          <SectionHeading
            eyebrow="Queue"
            title="Pending refund requests"
            description="Rows are sorted for operational triage, with critical items and recent requests pushed upward."
          />
          <p className="queue-panel__count">
            {queueItems.length} visible items
          </p>
        </div>

        {queueItems.length === 0 ? (
          <div className="empty-state">
            <h3>No refund requests match these filters.</h3>
            <p>
              Reset the current filters or widen the amount/date range to keep
              reviewing the queue.
            </p>
          </div>
        ) : (
          <div
            className="queue-list"
            role="list"
            aria-label="Refund request queue"
          >
            {paginatedQueueItems.map((refundRequest) => {
              const isDetailSelected =
                refundRequest.id === activeSelectedRefundId
              const isBatchSelected = selectedRefundIds.includes(
                refundRequest.id,
              )

              return (
                <div
                  className={[
                    'queue-row',
                    isDetailSelected ? 'queue-row--selected' : '',
                    isBatchSelected ? 'queue-row--batch-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={refundRequest.id}
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
                          toggleRefundSelection(refundRequest.id)
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
                        onClick={() => openRefundDetails(refundRequest.id)}
                        variant="ghost"
                      >
                        Review details
                      </Button>
                    </div>
                  </div>

                  <div
                    className="queue-row__interactive"
                    onClick={() => openRefundDetails(refundRequest.id)}
                    onKeyDown={(event) =>
                      handleQueueRowKeyDown(event, refundRequest.id)
                    }
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
                          {
                            paymentMethodLabels[
                              refundRequest.transaction.paymentMethod
                            ]
                          }
                        </strong>
                      </div>
                      <div>
                        <p className="queue-row__label">Requested refund</p>
                        <strong>
                          {formatCurrency(refundRequest.requestedAmount)}
                        </strong>
                      </div>
                      <div>
                        <p className="queue-row__label">Original amount</p>
                        <strong>
                          {formatCurrency(refundRequest.transaction.amount)}
                        </strong>
                      </div>
                      <div>
                        <p className="queue-row__label">Transaction date</p>
                        <strong>
                          {formatCompactDate(
                            refundRequest.transaction.transactionDate,
                          )}
                        </strong>
                      </div>
                      <div>
                        <p className="queue-row__label">Request date</p>
                        <strong>
                          {formatCompactDate(refundRequest.requestDate)}
                        </strong>
                      </div>
                      <div>
                        <p className="queue-row__label">Transaction status</p>
                        <strong>
                          {
                            transactionStatusLabels[
                              refundRequest.transaction.status
                            ]
                          }
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
            })}
          </div>
        )}

        {queueItems.length > pageSize ? (
          <div className="pagination" aria-label="Refund queue pagination">
            <Button
              disabled={currentPage === 1}
              onClick={() => changePage(currentPage - 1)}
              variant="secondary"
            >
              Previous
            </Button>
            <div className="pagination__pages">
              {buildPaginationItems(currentPage, totalPages).map(
                (pageNumber, index) =>
                  pageNumber === 'ellipsis' ? (
                    <span
                      aria-hidden="true"
                      className="pagination__ellipsis"
                      key={`ellipsis-${index}`}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      aria-current={
                        pageNumber === currentPage ? 'page' : undefined
                      }
                      className={
                        pageNumber === currentPage
                          ? 'pagination__page pagination__page--active'
                          : 'pagination__page'
                      }
                      key={pageNumber}
                      onClick={() => changePage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  ),
              )}
            </div>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => changePage(currentPage + 1)}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        ) : null}
      </Card>

      {isBatchReviewOpen ? (
        <div className="detail-modal">
          <button
            aria-label="Close batch review"
            className="detail-modal__backdrop"
            onMouseDown={closeBatchReview}
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
                  Review selected items, exclude flagged requests, and only
                  approve what is safe to move forward.
                </p>
              </div>
              <div className="detail-panel__header-actions">
                <Badge tone={batchStateTone(batchSummary.state)}>
                  {batchStateLabel(batchSummary.state)}
                </Badge>
                <button
                  aria-label="Close batch review"
                  className="detail-panel__close"
                  onMouseDown={closeBatchReview}
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
                <Button onClick={excludeFlaggedBatchItems} variant="secondary">
                  Exclude flagged items
                </Button>
                <Button onClick={includeAllBatchItems} variant="ghost">
                  Include all selected
                </Button>
                <Button onClick={clearBatchSelection} variant="ghost">
                  Clear batch
                </Button>
              </div>
            </div>

            <div className="risk-list">
              <h4>Included items</h4>
              <div className="batch-review-sections">
                <div className="batch-review-section">
                  <div className="risk-list__header">
                    <h5>Blocking items</h5>
                    <Badge tone="critical">{blockingBatchRefunds.length}</Badge>
                  </div>
                  {blockingBatchRefunds.length > 0 ? (
                    <ul className="risk-list__items">
                      {blockingBatchRefunds.map((refund) => (
                        <li className="risk-list__item" key={refund.id}>
                          <div className="batch-review-item">
                            <div>
                              <p className="request-list__id">{refund.id}</p>
                              <strong>{refund.customer.name}</strong>
                              <p>{formatCurrency(refund.requestedAmount)}</p>
                            </div>
                            <Button
                              onClick={() => toggleExcludedBatchItem(refund.id)}
                              variant="secondary"
                            >
                              Exclude
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="risk-list__empty">
                      No blocking items remain in the included set.
                    </p>
                  )}
                </div>

                <div className="batch-review-section">
                  <div className="risk-list__header">
                    <h5>Review items</h5>
                    <Badge tone="warning">{reviewBatchRefunds.length}</Badge>
                  </div>
                  {reviewBatchRefunds.length > 0 ? (
                    <ul className="risk-list__items">
                      {reviewBatchRefunds.map((refund) => (
                        <li className="risk-list__item" key={refund.id}>
                          <div className="batch-review-item">
                            <div>
                              <p className="request-list__id">{refund.id}</p>
                              <strong>{refund.customer.name}</strong>
                              <p>{formatCurrency(refund.requestedAmount)}</p>
                            </div>
                            <Button
                              onClick={() => toggleExcludedBatchItem(refund.id)}
                              variant="secondary"
                            >
                              Exclude
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="risk-list__empty">
                      No review-only items remain in the included set.
                    </p>
                  )}
                </div>

                <div className="batch-review-section">
                  <div className="risk-list__header">
                    <h5>Safe items</h5>
                    <Badge tone="success">{safeBatchRefunds.length}</Badge>
                  </div>
                  {safeBatchRefunds.length > 0 ? (
                    <ul className="risk-list__items">
                      {safeBatchRefunds.map((refund) => (
                        <li className="risk-list__item" key={refund.id}>
                          <div className="batch-review-item">
                            <div>
                              <p className="request-list__id">{refund.id}</p>
                              <strong>{refund.customer.name}</strong>
                              <p>{formatCurrency(refund.requestedAmount)}</p>
                            </div>
                            <Button
                              onClick={() => toggleExcludedBatchItem(refund.id)}
                              variant="ghost"
                            >
                              Exclude
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="risk-list__empty">
                      No safe items are currently included.
                    </p>
                  )}
                </div>
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
                          onClick={() => toggleExcludedBatchItem(refund.id)}
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
                  onClick={() => handleBatchDecision('approved')}
                >
                  Approve included batch
                </Button>
                <Button
                  disabled={batchSummary.includedCount === 0}
                  onClick={() => handleBatchDecision('flagged')}
                  variant="secondary"
                >
                  Flag included batch
                </Button>
                <Button onClick={closeBatchReview} variant="ghost">
                  Close review
                </Button>
              </div>
              <Badge tone={batchStateTone(batchSummary.state)}>
                {batchSummary.includedCount} included /{' '}
                {batchSummary.excludedCount} excluded
              </Badge>
            </div>
          </Card>
        </div>
      ) : null}

      {selectedRefund ? (
        <div className="detail-modal">
          <button
            aria-label="Close refund details"
            className="detail-modal__backdrop"
            onMouseDown={closeDetailModal}
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
                <p className="request-list__id">{selectedRefund.id}</p>
                <h3 className="detail-panel__title">
                  {selectedRefund.customer.name}
                </h3>
                <p className="detail-panel__subtitle">
                  {selectedRefund.customer.externalId} ·{' '}
                  {selectedRefund.transaction.orderId} ·{' '}
                  {
                    paymentMethodLabels[
                      selectedRefund.transaction.paymentMethod
                    ]
                  }
                </p>
              </div>
              <div className="detail-panel__header-actions">
                <Badge tone={riskTone(selectedRefund.riskLevel)}>
                  {riskLabel(selectedRefund.riskLevel)}
                </Badge>
                <button
                  aria-label="Close refund details"
                  className="detail-panel__close"
                  onMouseDown={closeDetailModal}
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>

            <div
              className={
                selectedRefund.riskLevel === 'critical'
                  ? 'detail-alert detail-alert--critical'
                  : selectedRefund.riskLevel === 'review'
                    ? 'detail-alert detail-alert--warning'
                    : 'detail-alert detail-alert--success'
              }
            >
              <strong>
                {selectedRefund.riskLevel === 'critical'
                  ? 'Approval should be blocked pending review.'
                  : selectedRefund.riskLevel === 'review'
                    ? 'Manual review recommended before approval.'
                    : 'No blocking conditions were detected.'}
              </strong>
              <p>
                {selectedRefund.riskFlags[0]?.explanation ??
                  'This request currently has no critical or warning signals in the seeded ruleset.'}
              </p>
            </div>

            <div className="detail-grid">
              <div>
                <p className="queue-row__label">Requested refund</p>
                <strong>
                  {formatCurrency(selectedRefund.requestedAmount)}
                </strong>
              </div>
              <div>
                <p className="queue-row__label">Original amount</p>
                <strong>
                  {formatCurrency(selectedRefund.transaction.amount)}
                </strong>
              </div>
              <div>
                <p className="queue-row__label">Refund destination</p>
                <strong>
                  {selectedRefund.refundDestinationType.replaceAll('_', ' ')}
                </strong>
              </div>
              <div>
                <p className="queue-row__label">Reason</p>
                <strong>{selectedRefund.reason.replaceAll('_', ' ')}</strong>
              </div>
              <div>
                <p className="queue-row__label">Request date</p>
                <strong>{formatDetailDate(selectedRefund.requestDate)}</strong>
              </div>
              <div>
                <p className="queue-row__label">Purchase-to-request delay</p>
                <strong>{selectedRefund.purchaseToRequestDays} days</strong>
              </div>
              <div>
                <p className="queue-row__label">Request channel</p>
                <strong>
                  {selectedRefund.submissionChannel.replaceAll('_', ' ')}
                </strong>
              </div>
              <div>
                <p className="queue-row__label">Prior attempt outcome</p>
                <strong>
                  {selectedRefund.priorAttemptOutcome.replaceAll('_', ' ')}
                </strong>
              </div>
              <div>
                <p className="queue-row__label">7-day customer refunds</p>
                <strong>{selectedRefund.customerRefundsLast7Days}</strong>
              </div>
              <div>
                <p className="queue-row__label">Duplicate candidates</p>
                <strong>{selectedRefund.duplicateCandidateIds.length}</strong>
              </div>
            </div>

            <div className="timeline">
              <h4>Transaction timeline</h4>
              <div className="timeline__items">
                <div className="timeline__item">
                  <span className="timeline__label">Purchased</span>
                  <strong>
                    {formatDetailDate(
                      selectedRefund.transaction.transactionDate,
                    )}
                  </strong>
                </div>
                <div className="timeline__item">
                  <span className="timeline__label">Captured</span>
                  <strong>
                    {formatDetailDate(selectedRefund.transaction.capturedAt)}
                  </strong>
                </div>
                <div className="timeline__item">
                  <span className="timeline__label">Settled</span>
                  <strong>
                    {formatDetailDate(selectedRefund.transaction.settledAt)}
                  </strong>
                </div>
                <div className="timeline__item">
                  <span className="timeline__label">Refund requested</span>
                  <strong>
                    {formatDetailDate(selectedRefund.requestDate)}
                  </strong>
                </div>
                <div className="timeline__item">
                  <span className="timeline__label">Chargeback filed</span>
                  <strong>
                    {formatDetailDate(
                      selectedRefund.transaction.chargebackFiledAt,
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="risk-list">
              <h4>Risk flags and explanations</h4>
              {selectedRefund.riskFlags.length > 0 ? (
                <ul className="risk-list__items">
                  {selectedRefund.riskFlags.map((flag) => (
                    <li className="risk-list__item" key={flag.code}>
                      <div className="risk-list__header">
                        <Badge
                          tone={
                            flag.severity === 'critical'
                              ? 'critical'
                              : 'warning'
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

            {selectedRefundSimulation ? (
              <div className="risk-list">
                <h4>What if you approve this?</h4>
                <div
                  className={
                    selectedRefundSimulation.state === 'blocked'
                      ? 'detail-alert detail-alert--critical'
                      : selectedRefundSimulation.state === 'review'
                        ? 'detail-alert detail-alert--warning'
                        : 'detail-alert detail-alert--success'
                  }
                >
                  <strong>{selectedRefundSimulation.headline}</strong>
                  <p>{selectedRefundSimulation.summary}</p>
                </div>

                <div className="detail-grid">
                  <div>
                    <p className="queue-row__label">Duplicate overlaps</p>
                    <strong>
                      {selectedRefundSimulation.duplicateExposureCount}
                    </strong>
                  </div>
                  <div>
                    <p className="queue-row__label">Blocking reasons</p>
                    <strong>
                      {selectedRefundSimulation.blockingReasons.length}
                    </strong>
                  </div>
                  <div>
                    <p className="queue-row__label">Review reasons</p>
                    <strong>
                      {selectedRefundSimulation.reviewReasons.length}
                    </strong>
                  </div>
                  <div>
                    <p className="queue-row__label">Conflicting request IDs</p>
                    <strong>
                      {selectedRefundSimulation.conflictingRequestIds.length > 0
                        ? selectedRefundSimulation.conflictingRequestIds.join(
                            ', ',
                          )
                        : 'None'}
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="detail-actions">
              <div className="button-row">
                <Button onClick={() => handleDecision('approved')}>
                  Approve refund
                </Button>
                <Button
                  onClick={() => handleDecision('rejected')}
                  variant="secondary"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleDecision('flagged')}
                  variant="ghost"
                >
                  Flag for review
                </Button>
              </div>
              <div className="batch-bar__actions">
                <Button
                  aria-label={`${selectedRefundIds.includes(selectedRefund.id) ? 'Remove' : 'Add'} ${selectedRefund.id} ${selectedRefund.customer.name} ${selectedRefundIds.includes(selectedRefund.id) ? 'from' : 'to'} batch`}
                  onClick={() => toggleRefundSelection(selectedRefund.id)}
                  variant="secondary"
                >
                  {selectedRefundIds.includes(selectedRefund.id)
                    ? 'Remove from batch'
                    : 'Add to batch'}
                </Button>
                {actionOverrides[selectedRefund.id] ? (
                  <Badge
                    tone={statusBadgeTone(
                      actionOverrides[selectedRefund.id] ?? 'pending',
                    )}
                  >
                    {statusLabel(
                      actionOverrides[selectedRefund.id] ?? 'pending',
                    )}
                  </Badge>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
