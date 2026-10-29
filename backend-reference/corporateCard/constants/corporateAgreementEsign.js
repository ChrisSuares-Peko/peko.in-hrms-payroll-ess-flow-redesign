'use strict'

const ESIGN_ACCESS_KEY = 'REDACTED'

const ESIGN_SOURCE_TYPE = 'CORPORATE_CARD_AGREEMENT'

const SIGNING_POLICY = 'AADHAAR'

const DOCKET_TITLE = 'Peko Corporate Cards — Corporate Agreement'

const SIGNED_PDF_NAME = 'Corporate-Agreement-Signed.pdf'

const DISPATCH_PDF_NAME = 'Corporate-Agreement.pdf'

const SIGNATURE_TAG = {
    pageNumber: 3,
    x: 367,
    y: 135,
    width: 130,
    height: 6,
}

const EXPIRY_DAYS = 30

const DISPATCH_LOCK_TTL_SECONDS = 120

const TERMINAL_LOCK_TTL_SECONDS = 60

const REFRESH_THROTTLE_SECONDS = 60

const dispatchLockKey = (corporateId) => `cc:esign:dispatch:${corporateId}`

const refreshThrottleKey = (corporateId) => `cc:esign:refresh:${corporateId}`

const terminalLockKey = (corporateId) => `cc:esign:terminal:${corporateId}`

const UPSTREAM_STATUS = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED',
}

module.exports = {
    ESIGN_ACCESS_KEY,
    ESIGN_SOURCE_TYPE,
    SIGNING_POLICY,
    DOCKET_TITLE,
    SIGNED_PDF_NAME,
    DISPATCH_PDF_NAME,
    SIGNATURE_TAG,
    EXPIRY_DAYS,
    DISPATCH_LOCK_TTL_SECONDS,
    TERMINAL_LOCK_TTL_SECONDS,
    REFRESH_THROTTLE_SECONDS,
    dispatchLockKey,
    refreshThrottleKey,
    terminalLockKey,
    UPSTREAM_STATUS,
}
