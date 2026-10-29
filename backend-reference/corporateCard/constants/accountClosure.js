'use strict'

const CLOSURE_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
}

const CLOSURE_STATUS_VALUES = Object.values(CLOSURE_STATUS)

const OPEN_STATUSES = [CLOSURE_STATUS.PENDING]

const CLOSURE_REASON = {
    NOT_USING: 'NOT_USING',
    TOO_EXPENSIVE: 'TOO_EXPENSIVE',
    MISSING_FEATURES: 'MISSING_FEATURES',
    SWITCHING_PROVIDER: 'SWITCHING_PROVIDER',
    BUSINESS_CLOSING: 'BUSINESS_CLOSING',
    OTHERS: 'OTHERS',
}

const CLOSURE_REASON_LABELS = {
    [CLOSURE_REASON.NOT_USING]: 'We are no longer using Peko',
    [CLOSURE_REASON.TOO_EXPENSIVE]: 'Too expensive for our needs',
    [CLOSURE_REASON.MISSING_FEATURES]: 'Missing features we need',
    [CLOSURE_REASON.SWITCHING_PROVIDER]: 'Switching to another provider',
    [CLOSURE_REASON.BUSINESS_CLOSING]: 'The business is closing down',
    [CLOSURE_REASON.OTHERS]: 'Others',
}

const CLOSURE_REASON_VALUES = Object.values(CLOSURE_REASON)

const DETAILS_MIN = 10

const DETAILS_MAX = 1000

const KYB_RESET_FIELDS = {
    kybStatus: null,
    kybReference: null,
    metadata: null,
    agreementSignMethod: null,
    esignStatus: null,
    esignReference: null,
    esignSigningLink: null,
    esignSentAt: null,
    esignSignedAt: null,
    esignFailureReason: null,
}

const KYB_PRESERVED_FIELDS = [
    'businessType',
    'cardSchemeId',
    'svcCardNumber',
    'virtualAccount',
    'createdByCredentialId',
]

module.exports = {
    CLOSURE_STATUS,
    CLOSURE_STATUS_VALUES,
    OPEN_STATUSES,
    CLOSURE_REASON,
    CLOSURE_REASON_LABELS,
    CLOSURE_REASON_VALUES,
    DETAILS_MIN,
    DETAILS_MAX,
    KYB_RESET_FIELDS,
    KYB_PRESERVED_FIELDS,
}
