import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '../../components/ui/Badge.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { FieldLabel, TextInput } from '../../components/ui/Field.tsx'
import { SectionHeading } from '../../components/ui/SectionHeading.tsx'
import { refundWorkbenchSeedData } from '../../data/loadSeedData.ts'
import {
  buildAnalyticsOverview,
  buildCustomerRefundInsights,
  buildPaymentMethodAnalytics,
  buildRefundVolumeTrend,
  filterRefundWorkbenchDataByRequestDate,
  getRefundRequestDateBounds,
} from '../../domain/selectors.ts'
import type { PaymentMethod } from '../../domain/refunds.ts'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const ratioFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const detailDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const paymentMethodLabels: Record<PaymentMethod, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  credit_card: 'Credit Card',
  cash_on_delivery: 'COD',
}

const paymentMethodColors: Record<PaymentMethod, string> = {
  gcash: '#0f766e',
  maya: '#1d4ed8',
  credit_card: '#b45309',
  cash_on_delivery: '#166534',
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatPercent(value: number) {
  return ratioFormatter.format(value)
}

function formatChartDate(value: string) {
  return shortDateFormatter.format(new Date(value))
}

function formatDetailDate(value: string) {
  return detailDateFormatter.format(new Date(value))
}

function formatTooltipNumber(value: unknown) {
  return typeof value === 'number' ? value.toLocaleString() : '0'
}

function formatTooltipCurrency(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : formatCurrency(0)
}

function formatTooltipPercent(value: unknown) {
  return typeof value === 'number' ? formatPercent(value) : formatPercent(0)
}

function formatPaymentMethodLabel(value: unknown) {
  return typeof value === 'string' && value in paymentMethodLabels
    ? paymentMethodLabels[value as PaymentMethod]
    : 'Unknown'
}

export function AnalyticsPage() {
  const requestDateBounds = useMemo(
    () => getRefundRequestDateBounds(refundWorkbenchSeedData),
    [],
  )
  const [dateFrom, setDateFrom] = useState(requestDateBounds.min)
  const [dateTo, setDateTo] = useState(requestDateBounds.max)

  const filteredAnalyticsData = useMemo(
    () =>
      filterRefundWorkbenchDataByRequestDate(
        refundWorkbenchSeedData,
        dateFrom,
        dateTo,
      ),
    [dateFrom, dateTo],
  )

  const overview = useMemo(
    () => buildAnalyticsOverview(filteredAnalyticsData),
    [filteredAnalyticsData],
  )
  const refundTrend = useMemo(
    () =>
      buildRefundVolumeTrend(filteredAnalyticsData).map((point) => ({
        ...point,
        label: formatChartDate(point.isoDate),
      })),
    [filteredAnalyticsData],
  )
  const paymentMethodAnalytics = useMemo(
    () => buildPaymentMethodAnalytics(filteredAnalyticsData),
    [filteredAnalyticsData],
  )
  const customerInsights = useMemo(
    () => buildCustomerRefundInsights(filteredAnalyticsData, 8),
    [filteredAnalyticsData],
  )

  const highestRatioMethod = [...paymentMethodAnalytics].sort(
    (left, right) =>
      right.refundToTransactionRatio - left.refundToTransactionRatio,
  )[0]
  const highestRiskCustomer = [...customerInsights].sort(
    (left, right) => right.criticalRiskCount - left.criticalRiskCount,
  )[0]

  const kpis = [
    {
      label: 'Refund requests',
      value: overview.totalRefundCount.toLocaleString(),
      note: 'Total seeded refund requests under analysis.',
    },
    {
      label: 'Refund amount',
      value: formatCurrency(overview.totalRefundAmount),
      note: 'Total requested value across all refund requests.',
    },
    {
      label: 'Refund ratio',
      value: formatPercent(overview.refundToTransactionRatio),
      note: 'Share of seeded transactions that resulted in a refund request.',
    },
    {
      label: 'Average delay',
      value: `${overview.averagePurchaseToRefundDelayDays.toFixed(1)} days`,
      note: 'Average time from purchase to refund request.',
    },
  ]

  function updateDateRange(boundary: 'from' | 'to', value: string) {
    if (boundary === 'from') {
      setDateFrom(value)
      if (dateTo && value && dateTo < value) {
        setDateTo(value)
      }
      return
    }

    setDateTo(value)
    if (dateFrom && value && value < dateFrom) {
      setDateFrom(value)
    }
  }

  function resetDateRange() {
    setDateFrom(requestDateBounds.min)
    setDateTo(requestDateBounds.max)
  }

  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="Secondary Workflow"
        title="Analytics Dashboard"
        description="Spot which payment methods, customers, and request windows are driving refund costs so ops can fix patterns instead of only processing tickets."
      />

      <Card className="foundation-card analytics-filter-card">
        <div className="analytics-filter-card__header">
          <SectionHeading
            eyebrow="Date Filter"
            title="Choose the request-date window"
            description="Every KPI, chart, and ranked customer row below is recalculated from the selected refund request period."
          />
          <Badge tone="success">
            {dateFrom && dateTo
              ? `${formatDetailDate(dateFrom)} to ${formatDetailDate(dateTo)}`
              : 'Full request window'}
          </Badge>
        </div>

        <div className="filter-grid analytics-filter-grid">
          <div>
            <FieldLabel
              htmlFor="analytics-date-from"
              label="Request date from"
            />
            <TextInput
              id="analytics-date-from"
              max={dateTo || undefined}
              min={requestDateBounds.min}
              name="analytics-date-from"
              onChange={(event) => updateDateRange('from', event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>

          <div>
            <FieldLabel htmlFor="analytics-date-to" label="Request date to" />
            <TextInput
              id="analytics-date-to"
              max={requestDateBounds.max}
              min={dateFrom || requestDateBounds.min}
              name="analytics-date-to"
              onChange={(event) => updateDateRange('to', event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>

          <div className="analytics-filter-card__actions">
            <Button onClick={resetDateRange} type="button" variant="secondary">
              Reset range
            </Button>
          </div>
        </div>
      </Card>

      <Card className="analytics-hero">
        <div className="analytics-hero__content">
          <p className="analytics-hero__eyebrow">Operational Story</p>
          <h3>Refund pressure is concentrated, not evenly distributed.</h3>
          <p>
            This view surfaces where refund demand is spiking, which payment
            methods convert into refunds most often, and which customers are
            generating the riskiest clusters.
          </p>
        </div>

        <div
          className="analytics-hero__badges"
          aria-label="Analytics highlights"
        >
          <Badge tone="warning">
            Highest ratio:{' '}
            {highestRatioMethod
              ? paymentMethodLabels[highestRatioMethod.paymentMethod]
              : 'N/A'}
          </Badge>
          <Badge tone="critical">
            Top risk customer:{' '}
            {highestRiskCustomer?.customerExternalId ?? 'N/A'}
          </Badge>
          <Badge tone="success">{refundTrend.length} active refund days</Badge>
        </div>
      </Card>

      {filteredAnalyticsData.refundRequests.length === 0 ? (
        <Card className="empty-state">
          <h3>No refund requests fall inside this request-date window.</h3>
          <p>
            Widen the range or reset the filter to restore analytics coverage.
          </p>
        </Card>
      ) : null}

      <div className="metrics-grid" role="list" aria-label="Analytics KPIs">
        {kpis.map((metric) => (
          <Card key={metric.label} className="metric-card" role="listitem">
            <p className="metric-card__label">{metric.label}</p>
            <div className="metric-card__value-row">
              <strong className="metric-card__value">{metric.value}</strong>
            </div>
            <p className="analytics-card__support">{metric.note}</p>
          </Card>
        ))}
      </div>

      <div className="analytics-grid analytics-grid--dashboard">
        <Card className="analytics-card analytics-card--chart">
          <div className="analytics-card__header">
            <div>
              <h3>Refund volume over time</h3>
              <p>
                Daily request count highlights operational spikes and
                post-incident surges.
              </p>
            </div>
          </div>
          <div className="chart-shell" aria-label="Refund volume chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={refundTrend}>
                <CartesianGrid
                  stroke="rgba(30, 58, 79, 0.08)"
                  vertical={false}
                />
                <XAxis dataKey="label" minTickGap={24} stroke="#5f7890" />
                <YAxis allowDecimals={false} stroke="#5f7890" />
                <Tooltip
                  formatter={(value) => [
                    formatTooltipNumber(value),
                    'Refund requests',
                  ]}
                  labelFormatter={(label) => `Request date: ${label}`}
                />
                <Bar
                  dataKey="refundCount"
                  fill="#0f766e"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="analytics-card analytics-card--chart">
          <div className="analytics-card__header">
            <div>
              <h3>Refund amount over time</h3>
              <p>
                Requested amount shows whether recent spikes are operationally
                small or financially dangerous.
              </p>
            </div>
          </div>
          <div className="chart-shell" aria-label="Refund amount chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={refundTrend}>
                <defs>
                  <linearGradient
                    id="refund-amount-fill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#1d4ed8"
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(30, 58, 79, 0.08)"
                  vertical={false}
                />
                <XAxis dataKey="label" minTickGap={24} stroke="#5f7890" />
                <YAxis
                  stroke="#5f7890"
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => [
                    formatTooltipCurrency(value),
                    'Refund amount',
                  ]}
                  labelFormatter={(label) => `Request date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="refundAmount"
                  fill="url(#refund-amount-fill)"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="analytics-card analytics-card--chart">
          <div className="analytics-card__header">
            <div>
              <h3>Payment method breakdown</h3>
              <p>
                Compare how much requested value each method contributes to the
                refund workload.
              </p>
            </div>
          </div>
          <div
            className="chart-shell"
            aria-label="Payment method breakdown chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentMethodAnalytics}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid
                  stroke="rgba(30, 58, 79, 0.08)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#5f7890"
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <YAxis
                  dataKey="paymentMethod"
                  stroke="#5f7890"
                  tickFormatter={(value: PaymentMethod) =>
                    paymentMethodLabels[value]
                  }
                  type="category"
                  width={96}
                />
                <Tooltip
                  formatter={(value) => [
                    formatTooltipCurrency(value),
                    'Refund amount',
                  ]}
                  labelFormatter={(label) => formatPaymentMethodLabel(label)}
                />
                <Bar dataKey="refundAmountTotal" radius={[0, 8, 8, 0]}>
                  {paymentMethodAnalytics.map((entry) => (
                    <Cell
                      fill={paymentMethodColors[entry.paymentMethod]}
                      key={entry.paymentMethod}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="analytics-card analytics-card--chart">
          <div className="analytics-card__header">
            <div>
              <h3>Refund ratio by payment method</h3>
              <p>
                Use this comparison to spot methods that over-index on refunds
                relative to transaction volume.
              </p>
            </div>
          </div>
          <div
            className="chart-shell"
            aria-label="Refund ratio by payment method chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodAnalytics}>
                <CartesianGrid
                  stroke="rgba(30, 58, 79, 0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="paymentMethod"
                  stroke="#5f7890"
                  tickFormatter={(value: PaymentMethod) =>
                    paymentMethodLabels[value]
                  }
                />
                <YAxis
                  stroke="#5f7890"
                  tickFormatter={(value) => `${Math.round(value * 100)}%`}
                />
                <Tooltip
                  formatter={(value) => [
                    formatTooltipPercent(value),
                    'Refund ratio',
                  ]}
                  labelFormatter={(label) => formatPaymentMethodLabel(label)}
                />
                <Bar dataKey="refundToTransactionRatio" radius={[8, 8, 0, 0]}>
                  {paymentMethodAnalytics.map((entry) => (
                    <Cell
                      fill={paymentMethodColors[entry.paymentMethod]}
                      key={entry.paymentMethod}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="analytics-card analytics-card--table analytics-card--wide">
          <div className="analytics-card__header">
            <div>
              <h3>High-refund and high-risk customers</h3>
              <p>
                Ranked customers combine refund frequency, requested amount, and
                critical-risk concentration.
              </p>
            </div>
          </div>

          <div
            className="customer-insights"
            role="table"
            aria-label="High refund customers"
          >
            <div className="customer-insights__head" role="row">
              <span role="columnheader">Customer</span>
              <span role="columnheader">Segment</span>
              <span role="columnheader">Refunds</span>
              <span role="columnheader">Critical</span>
              <span role="columnheader">Review+</span>
              <span role="columnheader">Requested</span>
              <span role="columnheader">Latest request</span>
            </div>

            {customerInsights.map((customer) => (
              <div
                className="customer-insights__row"
                key={customer.customerId}
                role="row"
              >
                <div className="customer-insights__identity" role="cell">
                  <strong>{customer.customerName}</strong>
                  <span>{customer.customerExternalId}</span>
                </div>
                <div role="cell">
                  <Badge
                    tone={
                      customer.segment === 'high_risk'
                        ? 'critical'
                        : customer.segment === 'vip'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {customer.segment.replace('_', ' ')}
                  </Badge>
                </div>
                <span role="cell">{customer.refundRequestCount}</span>
                <span role="cell">{customer.criticalRiskCount}</span>
                <span role="cell">{customer.reviewCount}</span>
                <strong role="cell">
                  {formatCurrency(customer.totalRequestedAmount)}
                </strong>
                <span role="cell">
                  {formatChartDate(customer.latestRequestDate.slice(0, 10))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
