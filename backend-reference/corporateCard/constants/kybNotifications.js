const KYB_REASON_MAX = 200

const briefReason = (reason) => {
    const text = String(reason || '').replace(/\s+/g, ' ').trim()
    if (!text) return ''
    return text.length > KYB_REASON_MAX ? `${text.slice(0, KYB_REASON_MAX - 3)}...` : text
}

const KYB_STATUS_NOTIFICATION = {
    VERIFIED: {
        category: 'KYB_VERIFIED',
        title: 'KYB Verification Approved',
        brief: () => 'Your business verification has been approved. You can now issue corporate cards.',
    },

    REJECTED: {
        category: 'KYB_REJECTED',
        title: 'KYB Verification Rejected',
        brief: ({ reason } = {}) => {
            const head = 'Your business verification was rejected'
            const detail = briefReason(reason)
            return detail
                ? `${head}: ${detail}`
                : `${head}. Please check your email for the details.`
        },
    },
}

module.exports = { KYB_STATUS_NOTIFICATION, KYB_REASON_MAX, briefReason }
