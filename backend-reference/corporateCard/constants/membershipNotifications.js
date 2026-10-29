/**
 * Copy for the Corporate Cards access-request notifications.
 *
 * The request one is read by an admin deciding whether to act, so it names who asked. The decisions are read
 * by the employee, so they name who decided and carry the rejection reason — without it a rejected employee
 * has nothing to act on but the word "rejected".
 *
 * Pure string builders, like the unfreeze copy: a constants file that reaches into utils is how this service
 * produced a require cycle before.
 */

const MEMBERSHIP_NOTIFICATION = {
    REQUESTED: {
        category: 'CARD_ACCESS_REQUEST',
        title: 'Corporate Card Access Request',
        brief: ({ requestedBy }) =>
            `${requestedBy} has requested access to Corporate Cards.`,
    },

    APPROVED: {
        category: 'CARD_ACCESS_APPROVED',
        title: 'Corporate Card Access Approved',
        brief: ({ decidedBy }) =>
            `Your request for Corporate Cards access was approved by ${decidedBy}. You can start your KYC now.`,
    },

    REJECTED: {
        category: 'CARD_ACCESS_REJECTED',
        title: 'Corporate Card Access Rejected',
        brief: ({ decidedBy, note }) =>
            (note
                ? `Your request for Corporate Cards access was rejected by ${decidedBy}. Reason: ${note}`
                : `Your request for Corporate Cards access was rejected by ${decidedBy}.`),
    },
}

module.exports = { MEMBERSHIP_NOTIFICATION }
