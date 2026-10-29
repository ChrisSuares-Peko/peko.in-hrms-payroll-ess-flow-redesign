module.exports = {
    CARD_REQUEST_TYPE: {
        CARD_ISSUANCE: 'CARD_ISSUANCE',
        LIMIT_INCREASE: 'LIMIT_INCREASE',
        TOPUP: 'TOPUP',
        TERMINATE: 'TERMINATE',
        UNFREEZE: 'UNFREEZE',
        MEMBERSHIP: 'MEMBERSHIP',
    },
    CARD_REQUEST_STATUS: {
        PENDING: 'PENDING',
        PROCESSING: 'PROCESSING',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        CANCELLED: 'CANCELLED',
    },
    CARD_TYPE: { VIRTUAL: 'Virtual', PHYSICAL: 'Physical' },
    CARD_TYPE_OPTIONS: ['Virtual', 'Physical'],

    NAME_ON_CARD_REGEX: /^[A-Za-z0-9 .]{1,25}$/,
    NAME_ON_CARD_MAX: 25,
    ADDRESS_LINE_REGEX: /^[-'"/\\.{}()[\]:;#&@!,|=+ a-zA-Z0-9\r\n]{1,100}$/,
    ADDRESS_LINE_MAX: 100,
}
