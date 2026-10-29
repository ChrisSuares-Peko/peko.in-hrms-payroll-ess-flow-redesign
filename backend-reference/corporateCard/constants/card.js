module.exports = {
    CARD_STATUS: {
        PENDING: 'PENDING',
        ISSUED: 'ISSUED',
        FAILED: 'FAILED',
        REPLACED: 'REPLACED',
    },
    UPI_STATUS: {
        PENDING: 'PENDING',
        WALLET_CREATED: 'WALLET_CREATED',
        LINKED: 'LINKED',
        FAILED: 'FAILED',
    },

    CARD_STATE: {
        ACTIVE: 'ACTIVE',
        FROZEN: 'FROZEN',
    },
    VENDOR_CARD_STATE: {
        ACTIVE: 1,
        ADMIN_INACTIVE: 2,
        CARDHOLDER_BLOCKED: 3,
    },
    FREEZE_REASON: {
        LOST: 1,
        STOLEN: 2,
        PHYSICAL_DAMAGE: 3,
        OTHERS: 4,
    },
    FREEZE_REASON_LABELS: {
        1: 'Lost',
        2: 'Stolen',
        3: 'Physical Damage',
        4: 'Others',
    },
    FREEZE_ACTOR: {
        ADMIN: 'ADMIN',
        CARDHOLDER: 'CARDHOLDER',
        SYSTEM: 'SYSTEM',
    },
}
