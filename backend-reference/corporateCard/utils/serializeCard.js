const { CARD_STATE, CARD_STATUS, FREEZE_REASON_LABELS } = require('../constants/card')
const { LIMIT_FREQUENCY } = require('../constants/cardLimits')
const { toNum, last4, safeDecrypt } = require('./cardHelpers')

const CARD_STATUS_DISPLAY = { ISSUED: 'Active', PENDING: 'Pending', FAILED: 'Failed', REPLACED: 'Replaced' }

const serializeCard = (
    row,
    { includeViewLink = false, spent = 0, terminationStatus = null, unfreezeRequestStatus = null, terminationRequested = false } = {}
) => {
    const cardLimit = toNum(row.cardLimit) ?? 0
    const spentNum = Number(spent) || 0
    const card = {
        id: row.id,
        type: row.cardType || 'Virtual',
        status: row.cardState === CARD_STATE.FROZEN
            ? 'Frozen'
            : (CARD_STATUS_DISPLAY[row.status] || row.status),
        issuanceStatus: row.status,
        cardState: row.cardState || CARD_STATE.ACTIVE,
        terminationStatus: terminationStatus || null,
        terminationRequested: !!terminationRequested,
        freezeReason: row.freezeReason ?? null,
        freezeReasonLabel: FREEZE_REASON_LABELS[row.freezeReason] ?? null,
        freezeReasonNote: row.freezeReasonNote ?? null,
        frozenByRole: row.frozenByRole ?? null,
        unfreezeRequestStatus: unfreezeRequestStatus || null,
        maskedCardNumber: row.maskedCardNumber || null,
        last4: last4(row.maskedCardNumber),
        orderId: row.orderId ?? null,
        dbUniqueNumber: row.referenceNumber === null || row.referenceNumber === undefined
            ? null
            : String(row.referenceNumber),
        awaitingConfirmation: row.status === CARD_STATUS.PENDING && row.reconcileNextAt != null,
        reconcileOutcome: row.reconcileOutcome ?? null,
        externalRequestId: row.externalRequestId,
        externalCardIdentifier: row.externalCardIdentifier ?? null,
        holderId: row.userId ?? null,
        holder: row.cardholder?.name || null,
        nameOnCard: row.nameOnCard || null,
        department: row.cardholder?.role || null,
        cardholder: row.cardholder
            ? { id: row.cardholder.id, name: row.cardholder.name, email: row.cardholder.email, mobileNo: row.cardholder.mobileNo }
            : null,
        requestedLimit: toNum(row.requestedLimit),
        upiStatus: row.upiStatus || null,
        walletNumber: row.walletNumber || null,
        cardLimit,
        perTxnLimit: toNum(row.perTxnLimit),
        limitFrequency: row.limitFrequency || LIMIT_FREQUENCY.MONTHLY,
        atmEnabled: !!row.atmEnabled,
        restrictedCategories: row.restrictedCategories || [],
        spent: spentNum,
        remaining: Math.max(cardLimit - spentNum, 0),
        createdAt: row.createdAt,
    }
    if (includeViewLink) card.cardViewLink = safeDecrypt(row.cardViewLink)
    return card
}

module.exports = { serializeCard }
