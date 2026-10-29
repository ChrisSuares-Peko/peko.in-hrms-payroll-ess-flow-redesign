module.exports = {
    LEDGER_DIRECTION: { IN: 'IN', OUT: 'OUT' },

    LEDGER_ENTRY_TYPE: {
        TOPUP: 'TOPUP',
        REFUND: 'REFUND',
        CASHBACK: 'CASHBACK',
        FEE: 'FEE',
        CREDIT_ADJUSTMENT: 'CREDIT_ADJUSTMENT',
        DEBIT_ADJUSTMENT: 'DEBIT_ADJUSTMENT',
    },

    ENTRY_TYPE_META: {
        TOPUP: { direction: 'IN', label: 'Top-up' },
        REFUND: { direction: 'IN', label: 'Refund' },
        CASHBACK: { direction: 'IN', label: 'Cashback' },
        FEE: { direction: 'OUT', label: 'Fee' },
        CREDIT_ADJUSTMENT: { direction: 'IN', label: 'Adjustment' },
        DEBIT_ADJUSTMENT: { direction: 'OUT', label: 'Adjustment' },
    },

    CARD_SPEND_LABEL: 'Card spend',

    TOPUP_HISTORY_TYPES: ['TOPUP', 'REFUND', 'CASHBACK'],

    BALANCE_SYNC: {
        REF_TYPE: 'ISSUER_BALANCE_SYNC',
        DESCRIPTION: 'Balance corrected to match the card issuer',
        REFERENCE_PREFIX: 'ISSUER-SYNC',
        TOLERANCE: 0.01,
        /**
         * Large corrections are logged and flagged for review, never refused. The issuer's figure is the
         * authority — a big gap usually means we missed a top-up, which is exactly what this corrects.
         */
        REVIEW_THRESHOLD: 10000,
        /**
         * The issuer reports a balance twice per transaction — before it on the AUTH call, after it on the
         * NOTIFY callback. Both are legitimate corrections, but `ccLedger_ref_unique (refType, refId)`
         * allows one sync row per refId, so the two phases must not share one. AUTH keeps the bare
         * transaction id so existing rows and their idempotency are untouched; every other phase is
         * suffixed.
         */
        PHASE: { AUTH: 'auth', NOTIFY: 'notify' },
    },
}
