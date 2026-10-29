const { findFirstIssuedByCardholder } = require('../models/use-cases/cardIssuance')
const { getAuthorizedSpendForCard } = require('../models/use-cases/cardTransaction')
const { walletBalance } = require('./walletBalance')
const { limitWindowRangeUtc, toNum, round2, last4, safeDecrypt } = require('../utils/cardHelpers')
const { CARD_STATE } = require('../constants/card')
const { NOT_PAYABLE_REASON } = require('../constants/inAppPayment')

const cardSummary = (card, spent, balance) => {
    const cardLimit = toNum(card.cardLimit)
    return {
        cardIssuanceId: card.id,
        last4: last4(card.maskedCardNumber),
        maskedCardNumber: card.maskedCardNumber || null,
        cardType: card.cardType,
        cardState: card.cardState,
        cardLimit,
        perTxnLimit: toNum(card.perTxnLimit),
        limitFrequency: card.limitFrequency || null,
        spent: round2(spent),
        remaining: cardLimit === null ? null : round2(Math.max(cardLimit - spent, 0)),
        walletBalance: round2(balance),
    }
}

// The same checks the JIT AUTH will run, minus the merchant ones (the MCC only arrives with the AUTH), so the
// payment page offers a card only when the redeem can actually clear. The AUTH stays the authority: a pass here
// is a prediction, never a reservation.
// `amount` is optional; without it only the card itself is judged.
const evaluateEligibility = async ({ corporateId, userId, amount }) => {
    const card = userId ? await findFirstIssuedByCardholder(userId) : null
    if (!card || String(card.corporateId) !== String(corporateId)) {
        return { available: false, reason: NOT_PAYABLE_REASON.NO_CARD, card: null, cardRow: null, accountNumber: null }
    }

    const { windowStart, windowEnd } = limitWindowRangeUtc(card.limitFrequency)
    const [spent, balance] = await Promise.all([
        getAuthorizedSpendForCard({ cardIssuanceId: card.id, windowStart, windowEnd }),
        walletBalance({ corporateId: card.corporateId }),
    ])
    const summary = cardSummary(card, spent, balance)
    const accountNumber = safeDecrypt(card.accountNumber)
    const amt = toNum(amount)

    let reason = null
    if (card.cardState === CARD_STATE.FROZEN) reason = NOT_PAYABLE_REASON.CARD_FROZEN
    else if (!accountNumber) reason = NOT_PAYABLE_REASON.NO_ACCOUNT_NUMBER
    else if (amt !== null) {
        if (summary.perTxnLimit !== null && amt > summary.perTxnLimit) reason = NOT_PAYABLE_REASON.OVER_PER_TXN_LIMIT
        else if (summary.cardLimit !== null && spent + amt > summary.cardLimit) reason = NOT_PAYABLE_REASON.OVER_PERIOD_LIMIT
        else if (balance < amt) reason = NOT_PAYABLE_REASON.INSUFFICIENT_WALLET_BALANCE
    }

    return {
        available: !reason,
        reason,
        card: summary,
        cardRow: card,
        accountNumber: reason ? null : accountNumber,
    }
}

module.exports = { evaluateEligibility }
