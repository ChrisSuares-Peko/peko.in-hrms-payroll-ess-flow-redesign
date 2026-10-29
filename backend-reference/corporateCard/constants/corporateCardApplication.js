const KYB_STATUS = {
    PENDING: 'PENDING',
    SUBMITTED: 'SUBMITTED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED',
}

const canModifyKybDocuments = (application) =>
    !application
    || application.kybStatus === KYB_STATUS.REJECTED
    || (application.kybStatus === KYB_STATUS.PENDING && !application.kybReference)

const KYB_SUBMISSION_ALERT_EMAILS = ['miscc.in@peko.one', 'zuhaib@peko.one'];

module.exports = {
    canModifyKybDocuments,
    KYB_SUBMISSION_ALERT_EMAILS,
    KYB_STATUS: {
        PENDING: 'PENDING',
        SUBMITTED: 'SUBMITTED',
        UNDER_REVIEW: 'UNDER_REVIEW',
        VERIFIED: 'VERIFIED',
        REJECTED: 'REJECTED',
        COMPLETED: 'COMPLETED',
    },
    KYB_STATUS_OPTIONS: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'COMPLETED'],
    ADMIN_SETTABLE_KYB_STATUSES: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
    KYB_REFERENCE_REGEX: /^KYB[0-9A-F]{10}$/,
}
