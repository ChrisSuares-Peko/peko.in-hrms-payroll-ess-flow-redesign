const { customLog } = require('../utils/loggerHelper')
const { CARD_STATE, CARD_STATUS, FREEZE_ACTOR, FREEZE_REASON } = require('../constants/card')
const { KYB_RESET_FIELDS } = require('../constants/accountClosure')
const { findCardsByScope } = require('../models/use-cases/cardIssuance')
const { upsertByCorporate: upsertApplication } = require('../models/use-cases/corporateCardAdminApplication')
const { applyCardStateChange } = require('../controllers/corporate/cardState')
const { resolveReconcileCreds } = require('../utils/cardOrderReconciler')

const FREEZE_NOTE = 'Account closure approved by Peko support'

const freezeCorporateCards = async ({ corporateId, actorCredentialId, actorDisplay, req }) => {
    const cards = await findCardsByScope({ corporateId })
    const eligible = cards.filter(
        (card) => card.status === CARD_STATUS.ISSUED
            && (card.cardState || CARD_STATE.ACTIVE) !== CARD_STATE.FROZEN
    )
    if (eligible.length === 0) {
        return { requested: 0, frozen: 0, failed: 0 }
    }

    const creds = await resolveReconcileCreds(req?.LogTraceId)
    if (!creds) {
        customLog(req?.LogTraceId, 'error', {
            message: '[AccountClosure] Could not resolve vendor credentials — cards left as they are',
            corporateId,
        }, 'CONSOLE')
        return { requested: eligible.length, frozen: 0, failed: eligible.length, vendorUnavailable: true }
    }

    let frozen = 0
    for (const card of eligible) {
        const outcome = await applyCardStateChange({
            card,
            freeze: true,
            reason: FREEZE_REASON.OTHERS,
            reasonNote: FREEZE_NOTE,
            isAdmin: true,
            actorRole: FREEZE_ACTOR.SYSTEM,
            actorCredentialId,
            actorDisplay,
            corporateId,
            creds,
            logTraceId: req?.LogTraceId,
        })
        if (outcome.ok) frozen += 1
    }

    return { requested: eligible.length, frozen, failed: eligible.length - frozen }
}

const resetKybToFresh = async ({ corporateId, req }) => {
    await upsertApplication(corporateId, { ...KYB_RESET_FIELDS, isDeleted: true })
    customLog(req?.LogTraceId, 'info', {
        message: '[AccountClosure] KYB reset to fresh and application soft deleted',
        corporateId,
    }, 'CONSOLE')
}

const applyApprovedClosure = async ({ corporateId, actorCredentialId, actorDisplay, req }) => {
    const cards = await freezeCorporateCards({ corporateId, actorCredentialId, actorDisplay, req })
    await resetKybToFresh({ corporateId, req })
    return { cards, kybReset: true, appliedAt: new Date().toISOString() }
}

module.exports = {
    applyApprovedClosure,
    freezeCorporateCards,
    resetKybToFresh,
    FREEZE_NOTE,
}
