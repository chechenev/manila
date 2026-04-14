import fs from 'node:fs'
import path from 'node:path'

const seed = 420241

function createRng(initialSeed) {
  let value = initialSeed % 2147483647

  if (value <= 0) {
    value += 2147483646
  }

  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

const random = createRng(seed)

function pick(items) {
  return items[Math.floor(random() * items.length)]
}

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let cursor = random() * total

  for (const item of items) {
    cursor -= item.weight
    if (cursor <= 0) {
      return item.value
    }
  }

  return items[items.length - 1].value
}

function int(min, max) {
  return Math.floor(random() * (max - min + 1)) + min
}

function amount(min, max) {
  return Math.round((min + random() * (max - min)) * 100) / 100
}

function iso(date) {
  return date.toISOString()
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function randomDateBetween(start, end) {
  return new Date(
    start.getTime() + random() * (end.getTime() - start.getTime()),
  )
}

function formatId(prefix, index, pad = 4) {
  return `${prefix}-${String(index).padStart(pad, '0')}`
}

const firstNames = [
  'Ariana',
  'Miguel',
  'Jessa',
  'Paolo',
  'Katrina',
  'Liam',
  'Bianca',
  'Noel',
  'Angela',
  'Carlo',
  'Daniel',
  'Celine',
  'Marco',
  'Patricia',
  'Joaquin',
  'Aya',
  'Ramon',
  'Sofia',
  'Mika',
  'Tristan',
]

const lastNames = [
  'Santos',
  'Reyes',
  'Cruz',
  'Garcia',
  'Mendoza',
  'Flores',
  'Rivera',
  'Navarro',
  'Torres',
  'Aquino',
  'Bautista',
  'Ramos',
  'Castro',
  'Lim',
  'Tan',
]

const paymentMethods = [
  { value: 'gcash', weight: 0.34 },
  { value: 'maya', weight: 0.24 },
  { value: 'credit_card', weight: 0.26 },
  { value: 'cash_on_delivery', weight: 0.16 },
]

const transactionStatuses = [
  { value: 'settled', weight: 0.48 },
  { value: 'captured', weight: 0.2 },
  { value: 'authorized', weight: 0.1 },
  { value: 'failed', weight: 0.07 },
  { value: 'refunded', weight: 0.1 },
  { value: 'chargeback_filed', weight: 0.05 },
]

const refundReasons = [
  'item_not_received',
  'customer_return',
  'damaged_item',
  'wrong_item',
  'billing_issue',
  'courier_failure',
]

const refundChannels = ['support_portal', 'ops_console', 'chat', 'email']

const customerSegments = [
  { value: 'standard', weight: 0.78 },
  { value: 'vip', weight: 0.14 },
  { value: 'high_risk', weight: 0.08 },
]

const refundStatuses = [
  { value: 'pending', weight: 0.7 },
  { value: 'approved', weight: 0.15 },
  { value: 'rejected', weight: 0.1 },
  { value: 'flagged', weight: 0.05 },
]

const startDate = new Date('2026-02-01T00:00:00.000Z')
const endDate = new Date('2026-04-14T10:00:00.000Z')

const customers = Array.from({ length: 190 }, (_, index) => {
  const firstName = pick(firstNames)
  const lastName = pick(lastNames)
  const createdAt = randomDateBetween(
    addDays(startDate, -380),
    addDays(startDate, -20),
  )
  const id = formatId('CUS', index + 1, 5)

  return {
    id,
    externalId: `LM-${id}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}.${index + 1}@luzonmart.test`
      .toLowerCase()
      .replaceAll(' ', ''),
    segment: weightedPick(customerSegments),
    createdAt: iso(createdAt),
    countryCode: 'PH',
  }
})

const transactions = Array.from({ length: 360 }, (_, index) => {
  const transactionDate = randomDateBetween(startDate, addDays(endDate, -2))
  const status = weightedPick(transactionStatuses)
  const paymentMethod = weightedPick(paymentMethods)
  const amountValue = random() < 0.72 ? amount(280, 2400) : amount(11000, 29500)
  const capturedAt =
    status === 'authorized' || status === 'failed'
      ? null
      : iso(addHours(transactionDate, int(1, 20)))
  const settledAt =
    status === 'settled' ||
    status === 'refunded' ||
    status === 'chargeback_filed'
      ? iso(addDays(new Date(capturedAt ?? transactionDate), int(1, 3)))
      : null
  const chargebackFiledAt =
    status === 'chargeback_filed'
      ? iso(addDays(new Date(settledAt ?? transactionDate), int(6, 18)))
      : null

  return {
    id: formatId('TXN', index + 1, 5),
    orderId: formatId('ORD', index + 1, 5),
    customerId: pick(customers).id,
    paymentMethod,
    amount: amountValue,
    currency: 'PHP',
    itemCount: int(1, 5),
    transactionDate: iso(transactionDate),
    status,
    capturedAt,
    settledAt,
    chargebackFiledAt,
    refundedAmountTotal:
      status === 'refunded' ? amount(amountValue * 0.4, amountValue) : 0,
    authorizationExpiresAt:
      status === 'authorized' ? iso(addDays(transactionDate, 7)) : null,
    hasGatewayTimeoutHistory: false,
  }
})

const ensureStatus = (status, count) => {
  let assigned = 0
  for (const transaction of transactions) {
    if (assigned >= count) {
      break
    }
    if (transaction.status !== status) {
      transaction.status = status
      if (status === 'authorized') {
        transaction.capturedAt = null
        transaction.settledAt = null
        transaction.chargebackFiledAt = null
        transaction.authorizationExpiresAt = iso(
          addDays(new Date(transaction.transactionDate), 7),
        )
      } else if (status === 'chargeback_filed') {
        transaction.capturedAt ||= iso(
          addHours(new Date(transaction.transactionDate), 8),
        )
        transaction.settledAt ||= iso(
          addDays(new Date(transaction.capturedAt), 2),
        )
        transaction.chargebackFiledAt = iso(
          addDays(new Date(transaction.settledAt), 10),
        )
      } else if (status === 'settled') {
        transaction.capturedAt ||= iso(
          addHours(new Date(transaction.transactionDate), 6),
        )
        transaction.settledAt ||= iso(
          addDays(new Date(transaction.capturedAt), 2),
        )
      }
      assigned += 1
    }
  }
}

ensureStatus('authorized', 14)
ensureStatus('chargeback_filed', 10)
ensureStatus('failed', 14)
ensureStatus('captured', 35)
ensureStatus('refunded', 24)

const refundRequests = []
let refundCounter = 1

function nextRefundId() {
  const id = formatId('RF', refundCounter, 5)
  refundCounter += 1
  return id
}

function createRefundRequest(transaction, overrides = {}) {
  const baseDate = addDays(new Date(transaction.transactionDate), int(1, 32))
  const requestDate = overrides.requestDate
    ? new Date(overrides.requestDate)
    : baseDate
  const status = overrides.status ?? weightedPick(refundStatuses)
  const refundDestinationType =
    overrides.refundDestinationType ??
    (transaction.paymentMethod === 'cash_on_delivery'
      ? 'bank_transfer'
      : random() < 0.2
        ? 'store_credit'
        : 'original_method')
  const requestedAmount =
    overrides.requestedAmount ??
    Math.round(
      transaction.amount * (random() < 0.65 ? random() * 0.65 + 0.2 : 1) * 100,
    ) / 100

  const request = {
    id: nextRefundId(),
    transactionId: transaction.id,
    customerId: transaction.customerId,
    requestedAmount,
    requestDate: iso(requestDate),
    refundDestinationType,
    reason: overrides.reason ?? pick(refundReasons),
    status,
    submissionChannel: overrides.submissionChannel ?? pick(refundChannels),
    priorAttemptOutcome: overrides.priorAttemptOutcome ?? 'none',
    duplicateGroupId: overrides.duplicateGroupId ?? null,
    operatorNote: overrides.operatorNote ?? null,
    lineItemsReturned:
      overrides.lineItemsReturned ?? int(1, transaction.itemCount),
  }

  refundRequests.push(request)
  return request
}

const settledPool = transactions.filter((transaction) =>
  ['settled', 'captured', 'refunded'].includes(transaction.status),
)
const authorizedPool = transactions.filter(
  (transaction) => transaction.status === 'authorized',
)
const chargebackPool = transactions.filter(
  (transaction) => transaction.status === 'chargeback_filed',
)

const highVelocityCustomers = [customers[3].id, customers[12].id]
for (let index = 0; index < 8; index += 1) {
  settledPool[index].customerId = highVelocityCustomers[index < 4 ? 0 : 1]
}

for (const customerId of highVelocityCustomers) {
  const candidateTransactions = settledPool
    .filter((transaction) => transaction.customerId === customerId)
    .slice(0, 4)

  for (let index = 0; index < candidateTransactions.length; index += 1) {
    const transaction = candidateTransactions[index]
    createRefundRequest(transaction, {
      status: index < 2 ? 'approved' : 'pending',
      requestDate: iso(addDays(new Date('2026-04-05T09:00:00.000Z'), index)),
      requestedAmount: Math.min(transaction.amount, amount(300, 2200)),
      reason: index % 2 === 0 ? 'customer_return' : 'billing_issue',
    })
  }
}

for (let index = 0; index < 4; index += 1) {
  const transaction = settledPool[index]
  const duplicateGroupId = `DUP-${index + 1}`
  const baseDate = addDays(new Date(transaction.transactionDate), int(5, 16))
  const requestedAmount = Math.min(
    transaction.amount,
    amount(500, transaction.amount),
  )

  createRefundRequest(transaction, {
    status: 'pending',
    requestDate: iso(baseDate),
    requestedAmount,
    duplicateGroupId,
    reason: 'customer_return',
  })
  createRefundRequest(transaction, {
    status: 'pending',
    requestDate: iso(addHours(baseDate, int(2, 18))),
    requestedAmount,
    duplicateGroupId,
    reason: 'customer_return',
  })
}

for (let index = 0; index < 3; index += 1) {
  const transaction = authorizedPool[index]
  createRefundRequest(transaction, {
    status: 'pending',
    requestDate: iso(addDays(new Date(transaction.transactionDate), int(1, 3))),
    requestedAmount: Math.min(
      transaction.amount,
      amount(250, transaction.amount),
    ),
    reason: 'billing_issue',
  })
}

for (let index = 0; index < 3; index += 1) {
  const transaction = chargebackPool[index]
  createRefundRequest(transaction, {
    status: 'pending',
    requestDate: iso(
      addDays(new Date(transaction.chargebackFiledAt), int(1, 4)),
    ),
    requestedAmount: Math.min(
      transaction.amount,
      amount(300, transaction.amount),
    ),
    reason: 'item_not_received',
  })
}

for (let index = 0; index < 2; index += 1) {
  const transaction = settledPool[20 + index]
  createRefundRequest(transaction, {
    status: 'pending',
    requestDate: iso(
      addDays(new Date(transaction.transactionDate), int(7, 18)),
    ),
    requestedAmount:
      Math.round((transaction.amount + amount(120, 380)) * 100) / 100,
    reason: 'billing_issue',
  })
}

for (let index = 0; index < 3; index += 1) {
  const transaction = settledPool[30 + index]
  transaction.hasGatewayTimeoutHistory = true
  createRefundRequest(transaction, {
    status: 'pending',
    priorAttemptOutcome: 'timeout',
    requestDate: iso(
      addDays(new Date(transaction.transactionDate), int(3, 10)),
    ),
    requestedAmount: Math.min(
      transaction.amount,
      amount(600, transaction.amount),
    ),
    reason: 'damaged_item',
    operatorNote: 'Previous attempt timed out in gateway response log.',
  })
}

while (refundRequests.length < 140) {
  const transaction = pick(settledPool)
  createRefundRequest(transaction, {
    status: weightedPick(refundStatuses),
    requestDate: iso(
      addDays(new Date(transaction.transactionDate), int(2, 38)),
    ),
    requestedAmount:
      random() < 0.14
        ? amount(280, 1100)
        : Math.min(transaction.amount, amount(180, transaction.amount)),
    reason: pick(refundReasons),
  })
}

const approvedAmountsByTransaction = new Map()
for (const refundRequest of refundRequests) {
  if (refundRequest.status !== 'approved') {
    continue
  }

  approvedAmountsByTransaction.set(
    refundRequest.transactionId,
    (approvedAmountsByTransaction.get(refundRequest.transactionId) ?? 0) +
      refundRequest.requestedAmount,
  )
}

for (const transaction of transactions) {
  const approvedAmount = approvedAmountsByTransaction.get(transaction.id) ?? 0
  transaction.refundedAmountTotal =
    Math.round(
      Math.max(transaction.refundedAmountTotal, approvedAmount) * 100,
    ) / 100
}

const output = {
  generatedAt: new Date('2026-04-14T16:00:00.000Z').toISOString(),
  seed,
  customers,
  transactions,
  refundRequests,
}

const outputPath = path.resolve(
  process.cwd(),
  'src/data/seed/refund-workbench-data.json',
)

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n')

console.log(
  JSON.stringify(
    {
      outputPath,
      customers: customers.length,
      transactions: transactions.length,
      refundRequests: refundRequests.length,
    },
    null,
    2,
  ),
)
