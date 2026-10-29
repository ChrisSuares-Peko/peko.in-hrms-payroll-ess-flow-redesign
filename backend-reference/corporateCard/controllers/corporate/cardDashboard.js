const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { GENERIC_ERROR } = require('../../constants/messages')
const { CARD_STATUS, CARD_STATE } = require('../../constants/card')
const { feTransactionStatus } = require('../../constants/jit')
const { resolveScope } = require('./cardTransactions')
const {
    getMonthlySummary,
    getSpendByCard,
    getSpendByCategory,
    getDailySpend,
    listTransactions,
} = require('../../models/use-cases/cardTransaction')
const { findCardsByScope } = require('../../models/use-cases/cardIssuance')
const { countPending, findTerminationStatusByCardIds } = require('../../models/use-cases/cardRequest')
const { getKycSummary } = require('../../models/use-cases/cardUser')
const { isAdmin, actsAsOwner, MONTH_REGEX, monthRangeUtc, currentMonthString, toNum, round2, last4, attachCardholders } = require('../../utils/cardHelpers')

const CARD_UTILISATION_LIMIT = 100

const RECENT_TRANSACTIONS_LIMIT = 6
const serializeRecentTransaction = (row) => ({
    id: row.id,
    merchant: row.merchantName || '',
    member: row.cardholder?.name ?? null,
    date: row.createdAt,
    amount: toNum(row.transactionAmount) ?? 0,
    status: feTransactionStatus(row.decision, row.status),
})

exports.getDashboardSummary = asyncHandler(async (req, res, next) => {
    const scope = resolveScope(req)
    if (scope.error) return next(new ErrorResponse(scope.error, 400))

    const month = typeof req.query.month === 'string' && req.query.month ? req.query.month : currentMonthString()
    if (!MONTH_REGEX.test(month)) return next(new ErrorResponse('A valid month (YYYY-MM) is required.', 400))
    const { monthStart, monthEnd } = monthRangeUtc(month)

    const admin = isAdmin(req)
    const { corporateId, cardholder } = scope

    try {
        const [cards, monthly, spendByCategory, daily, openRequests, kyc, recent] = await Promise.all([
            findCardsByScope({ corporateId, cardholder }),
            getMonthlySummary({ corporateId, cardholder, monthStart, monthEnd }),
            getSpendByCategory({ corporateId, cardholder, monthStart, monthEnd }),
            getDailySpend({ corporateId, cardholder, monthStart, monthEnd }),
            countPending({ corporateId, cardholder }),
            admin
                ? getKycSummary({ corporateId, includeOwner: actsAsOwner(req), req }).catch((err) => {
                    // Swallowed so one KPI cannot fail the whole dashboard — but the key is then absent
                    // rather than zero, and the UI renders that as unknown instead of inventing 0/0.
                    customLog(req?.LogTraceId, 'error', { message: '[CardDashboard] KYC summary unavailable — omitting member KPIs', error: err?.message, stack: err?.stack }, 'CONSOLE')
                    return null
                })
                : Promise.resolve(null),
            listTransactions({ corporateId, cardholder, limit: RECENT_TRANSACTIONS_LIMIT, offset: 0 }),
        ])

        const issued = cards.filter((c) => c.status === CARD_STATUS.ISSUED)
        const issuedIds = issued.map((c) => String(c.id))
        const [, spendMap, terminationByCard] = await Promise.all([
            attachCardholders([...issued, ...recent.rows], req),
            getSpendByCard({ corporateId, cardholder, cardIssuanceIds: issuedIds, monthStart, monthEnd }),
            findTerminationStatusByCardIds(issuedIds),
        ])
        const activeCards = issued.filter((c) => (c.cardState || CARD_STATE.ACTIVE) !== CARD_STATE.FROZEN).length
        // A card on its way out is not spendable headroom, so its limit is not part of "of X limit".
        // findTerminationStatusByCardIds is the same lookup the Cards table uses to label a row "Frozen
        // (Termination Requested)", and it covers the same request statuses as the wallet's sumCardLimits —
        // so this figure and the wallet's "Card Limit – Shared Across All Cards" now agree. Keyed off the
        // cards already in hand, which keeps it inside the caller's scope; sumCardLimits is corporate-wide
        // and would show a cardholder the whole corporate's limit.
        const totalCardLimits = round2(issued
            .filter((c) => !terminationByCard.has(String(c.id)))
            .reduce((sum, c) => sum + (toNum(c.cardLimit) || 0), 0))

        const cardUtilisation = issued
            .map((c) => ({
                cardIssuanceId: c.id,
                holder: c.cardholder?.name || null,
                last4: last4(c.maskedCardNumber),
                spent: spendMap.get(String(c.id)) || 0,
                limit: toNum(c.cardLimit) || 0,
            }))
            .sort((a, b) => b.spent - a.spent)
            .slice(0, CARD_UTILISATION_LIMIT)

        const kpis = {
            activeCards,
            spentThisMonth: monthly.amountSpent,
            transactionCount: monthly.transactionCount,
            totalCardLimits,
            openRequests,
        }
        if (admin) {
            kpis.totalCardsIssued = issued.length
            if (kyc) {
                kpis.verifiedMembers = { verified: kyc.verified, total: kyc.total }
                kpis.pendingKyc = kyc.pending
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Dashboard summary fetched.',
            data: {
                scope: admin ? 'admin' : 'cardholder',
                month,
                kpis,
                spendByCategory,
                dailySpend: {
                    total: round2(daily.reduce((sum, d) => sum + d.amount, 0)),
                    points: daily,
                },
                cardUtilisation,
                recentTransactions: recent.rows.map(serializeRecentTransaction),
            },
            responseCode: '000',
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: '[CardDashboard] Failed to build dashboard summary', error: err?.message }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }
})
