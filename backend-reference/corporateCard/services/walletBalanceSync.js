const sequelize = require('../configs/database/index')
const { customLog } = require('../utils/loggerHelper')
const { round2 } = require('../utils/cardHelpers')
const { LEDGER_DIRECTION, LEDGER_ENTRY_TYPE, BALANCE_SYNC } = require('../constants/ledger')
const { createEntry } = require('../models/use-cases/corporateCardLedger')
const { lockByCorporate } = require('../models/use-cases/corporateCardAdminApplication')
const { walletBalance } = require('./walletBalance')

const toBalance = (value) => {
    if (value === undefined || value === null || value === '') return null
    const num = Number(value)
    return Number.isFinite(num) && num >= 0 ? round2(num) : null
}

const syncIssuerBalance = async ({
    corporateId, issuerBalance, transactionUniqueId, logTraceId, phase = BALANCE_SYNC.PHASE.AUTH,
}) => {
    const issuer = toBalance(issuerBalance)
    if (!corporateId || issuer === null || !transactionUniqueId) {
        return { synced: false, reason: 'not-comparable' }
    }

    // AUTH keeps the bare id so rows written before phases existed stay idempotent.
    const refId = phase === BALANCE_SYNC.PHASE.AUTH
        ? String(transactionUniqueId)
        : `${transactionUniqueId}:${phase}`

    return sequelize.transaction(async (t) => {
        await lockByCorporate(corporateId, t)

        const ourBalance = await walletBalance({ corporateId, transaction: t })
        const delta = round2(issuer - ourBalance)
        if (Math.abs(delta) < BALANCE_SYNC.TOLERANCE) return { synced: false, reason: 'in-step', delta }

        // No ceiling: the issuer's balance is the authority, and the whole point is to recover drift we
        // cannot otherwise see — a missed top-up shows up here as a large credit and must be applied, not
        // refused. Anything past REVIEW_THRESHOLD is flagged for a human but still written.
        const credit = delta > 0
        const large = Math.abs(delta) > BALANCE_SYNC.REVIEW_THRESHOLD
        const entry = await createEntry({
            corporateId,
            entryType: credit ? LEDGER_ENTRY_TYPE.CREDIT_ADJUSTMENT : LEDGER_ENTRY_TYPE.DEBIT_ADJUSTMENT,
            direction: credit ? LEDGER_DIRECTION.IN : LEDGER_DIRECTION.OUT,
            amount: round2(Math.abs(delta)),
            description: BALANCE_SYNC.DESCRIPTION,
            reference: `${BALANCE_SYNC.REFERENCE_PREFIX}-${refId}`,
            refType: BALANCE_SYNC.REF_TYPE,
            refId,
            occurredAt: new Date(),
            metadata: {
                issuerBalance: issuer,
                ourBalance,
                delta,
                transactionUniqueId: String(transactionUniqueId),
                phase,
                ...(large ? { needsReview: true } : {}),
            },
        }, { transaction: t })

        customLog(logTraceId, large ? 'error' : 'info', {
            message: large
                ? '[WalletSync] Balance corrected to the issuer by an unusually large amount — review the cause'
                : '[WalletSync] Balance corrected to match the issuer',
            corporateId,
            transactionUniqueId,
            phase,
            issuerBalance: issuer,
            ourBalance,
            delta,
            entryId: entry?.id ?? null,
        }, 'VENDOR')

        return { synced: true, delta, entryId: entry?.id ?? null, needsReview: large }
    })
}

const syncIssuerBalanceSafely = async (params) => {
    try {
        return await syncIssuerBalance(params)
    } catch (error) {
        customLog(params?.logTraceId, 'error', {
            message: '[WalletSync] Balance sync failed — the authorisation decision is unaffected',
            corporateId: params?.corporateId,
            transactionUniqueId: params?.transactionUniqueId,
            error: error?.message,
        }, 'VENDOR')
        return { synced: false, reason: 'error' }
    }
}

module.exports = { syncIssuerBalance, syncIssuerBalanceSafely, toBalance }
