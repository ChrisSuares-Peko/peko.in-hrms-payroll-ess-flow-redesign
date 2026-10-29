const IN_APP_STATUS = {
    INITIATED: 'INITIATED',
    REDEEMED: 'REDEEMED',
    DECLINED: 'DECLINED',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
    REVERSED: 'REVERSED',
    CANCELLED: 'CANCELLED',
    CANCEL_FAILED: 'CANCEL_FAILED',
}

const NOT_PAYABLE_REASON = {
    NO_CARD: 'No active corporate card on this account',
    CARD_NOT_LIVE: 'Card is not live',
    CARD_FROZEN: 'Card frozen',
    NO_ACCOUNT_NUMBER: 'Card has no account number on file',
    OVER_PER_TXN_LIMIT: 'Exceeds per-transaction limit',
    OVER_PERIOD_LIMIT: 'Exceeds card limit',
    INSUFFICIENT_WALLET_BALANCE: 'Insufficient corporate wallet balance',
}

module.exports = {
    IN_APP_STATUS,
    NOT_PAYABLE_REASON,
    REDEEM_TIMEOUT_MS: 30000,
    // Pine Labs: reverse a timed-out transaction only after ~17s, so a late success is not reversed under it.
    REVERSE_DELAY_MS: 17000,
    // How far back to look for the JIT AUTH row a successful redeem produced.
    JIT_LINK_WINDOW_MS: 120000,
    INVOICE_PREFIX: 'PK',
    // Sweep: an INITIATED row this old never got its answer recorded; a TIMEOUT row this old lost its in-process reverse.
    SWEEP_INITIATED_AFTER_MS: 5 * 60 * 1000,
    SWEEP_TIMEOUT_AFTER_MS: 2 * 60 * 1000,
    SWEEP_BATCH: 50,
    // The in-app AUTH carries no merchantDetail; this is what the cardholder's history shows instead.
    IN_APP_MERCHANT_NAME: 'Peko',
}
