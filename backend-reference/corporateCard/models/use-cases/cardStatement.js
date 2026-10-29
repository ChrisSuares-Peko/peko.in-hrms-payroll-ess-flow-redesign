const { Op, fn, col, literal } = require('sequelize')
const ledger = require('../entities/corporateCardLedgerEntry')
const cardTransaction = require('../entities/cardTransaction')
const asyncHandler = require('../../middlewares/async')
const { LEDGER_DIRECTION, ENTRY_TYPE_META, CARD_SPEND_LABEL } = require('../../constants/ledger')
const { TRANSACTION_DECISION } = require('../../constants/jit')

const CARD_DECISION_AUTHORIZED = TRANSACTION_DECISION.AUTHORIZED
const STATEMENT_MAX_ROWS = 5000
const REFUND_LABEL = 'Refund'

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const num = (v) => (v === null || v === undefined ? 0 : Number(v))

const sumAmount = async (model, where, amountCol) => {
    const r = await model.findOne({
        attributes: [[fn('COALESCE', fn('SUM', col(amountCol)), 0), 'total']],
        where,
        raw: true,
    })
    return num(r?.total)
}

// A refund is its own linked row (eventType REFUND), not a status flip on the original — net spend
// before the statement window must subtract it rather than count it as more spend, exactly like the
// card-limit/spend-total queries in cardTransaction.js.
const sumNetCardSpend = async (where) => {
    const r = await cardTransaction.findOne({
        attributes: [[literal("COALESCE(SUM(CASE WHEN eventType = 'REFUND' THEN -transactionAmount ELSE transactionAmount END), 0)"), 'total']],
        where,
        raw: true,
    })
    return num(r?.total)
}

const buildStatement = asyncHandler(async ({ corporateId, monthStart, monthEnd }) => {
    const [inBefore, outBefore, spendBefore] = await Promise.all([
        sumAmount(ledger, { corporateId, direction: LEDGER_DIRECTION.IN, occurredAt: { [Op.lt]: monthStart } }, 'amount'),
        sumAmount(ledger, { corporateId, direction: LEDGER_DIRECTION.OUT, occurredAt: { [Op.lt]: monthStart } }, 'amount'),
        sumNetCardSpend({ corporateId, decision: CARD_DECISION_AUTHORIZED, createdAt: { [Op.lt]: monthStart } }),
    ])
    const openingBalance = round2(inBefore - outBefore - spendBefore)

    const [ledgerRows, spendRows] = await Promise.all([
        ledger.findAll({
            where: { corporateId, occurredAt: { [Op.gte]: monthStart, [Op.lt]: monthEnd } },
            order: [['occurredAt', 'ASC'], ['id', 'ASC']],
            limit: STATEMENT_MAX_ROWS,
            raw: true,
        }),
        cardTransaction.findAll({
            where: { corporateId, decision: CARD_DECISION_AUTHORIZED, createdAt: { [Op.gte]: monthStart, [Op.lt]: monthEnd } },
            order: [['createdAt', 'ASC'], ['id', 'ASC']],
            limit: STATEMENT_MAX_ROWS,
            raw: true,
        }),
    ])

    const normalised = [
        ...ledgerRows.map((r) => {
            const isIn = r.direction === LEDGER_DIRECTION.IN
            const amount = round2(num(r.amount))
            return {
                at: new Date(r.occurredAt).getTime(),
                date: r.occurredAt,
                description: r.description || ENTRY_TYPE_META[r.entryType]?.label || r.entryType,
                reference: r.reference || '',
                type: ENTRY_TYPE_META[r.entryType]?.label || r.entryType,
                direction: r.direction,
                moneyIn: isIn ? amount : null,
                moneyOut: isIn ? null : amount,
            }
        }),
        ...spendRows.map((r) => {
            const isRefund = r.eventType === 'REFUND'
            const amount = round2(num(r.transactionAmount))
            return {
                at: new Date(r.createdAt).getTime(),
                date: r.createdAt,
                description: r.merchantName || (isRefund ? REFUND_LABEL : CARD_SPEND_LABEL),
                reference: r.referenceNumber || r.displayId || '',
                type: isRefund ? REFUND_LABEL : CARD_SPEND_LABEL,
                direction: isRefund ? LEDGER_DIRECTION.IN : LEDGER_DIRECTION.OUT,
                moneyIn: isRefund ? amount : null,
                moneyOut: isRefund ? null : amount,
            }
        }),
    ].sort((a, b) => a.at - b.at)

    let running = openingBalance
    let moneyIn = 0
    let moneyOut = 0
    const rows = normalised.map((r) => {
        moneyIn = round2(moneyIn + num(r.moneyIn))
        moneyOut = round2(moneyOut + num(r.moneyOut))
        running = round2(running + num(r.moneyIn) - num(r.moneyOut))
        return {
            date: r.date,
            description: r.description,
            reference: r.reference,
            type: r.type,
            direction: r.direction,
            moneyIn: r.moneyIn,
            moneyOut: r.moneyOut,
            balance: running,
            kind: 'txn',
        }
    })

    const closingBalance = round2(openingBalance + moneyIn - moneyOut)
    const truncated = ledgerRows.length >= STATEMENT_MAX_ROWS || spendRows.length >= STATEMENT_MAX_ROWS

    return { openingBalance, moneyIn, moneyOut, closingBalance, rows, truncated }
})

module.exports = { buildStatement }
