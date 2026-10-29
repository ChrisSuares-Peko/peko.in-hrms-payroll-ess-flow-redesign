/**
 * Copy for the unfreeze notifications.
 *
 * Every one of them names the card and who acted, because the reader is deciding whether to care: an admin
 * with twenty cardholders cannot act on "a cardholder has submitted an unfreeze request", and a cardholder
 * with two cards cannot tell which one was released or by whom.
 *
 * Pure string builders on purpose — a constants file that reaches into utils is how this service produced
 * a require cycle before. Callers pass an already-computed last4.
 */

/** Names the card when we know it, and stays readable when we do not. */
const cardPhrase = (cardLast4) => (cardLast4 ? `the card ending ${cardLast4}` : 'the card')

const UNFREEZE_NOTIFICATION = {
    REQUESTED: {
        category: 'UNFREEZE_REQUEST',
        title: 'Unfreeze Request',
        brief: ({ cardLast4, requestedBy }) =>
            `${requestedBy} has requested an unfreeze for ${cardPhrase(cardLast4)}.`,
    },

    APPROVED: {
        category: 'UNFREEZE_APPROVED',
        title: 'Unfreeze Request Approved',
        brief: ({ cardLast4, decidedBy }) =>
            `Your unfreeze request for ${cardPhrase(cardLast4)} was approved by ${decidedBy}.`,
    },

    REJECTED: {
        category: 'UNFREEZE_REJECTED',
        title: 'Unfreeze Request Rejected',
        brief: ({ cardLast4, decidedBy, note }) => {
            const head = `Your unfreeze request for ${cardPhrase(cardLast4)} was rejected by ${decidedBy}`
            return note ? `${head}: ${note}` : `${head}.`
        },
    },
}

/** Matches the cap the decision note is stored under, so a notification never outruns the audit trail. */
const NOTE_MAX = 200

module.exports = { UNFREEZE_NOTIFICATION, NOTE_MAX, cardPhrase }
