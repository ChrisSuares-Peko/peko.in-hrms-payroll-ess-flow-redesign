module.exports = {
    ORDER_STATUS: { CREATED: 2, PROCESSED: 6 },

    ORDER_VERDICT: {
        ISSUED: 'ISSUED',
        FAILED: 'FAILED',
        PROCESSING: 'PROCESSING',
        AMBIGUOUS: 'AMBIGUOUS',
    },

    ISSUE_OUTCOME: {
        CONFIRMED: 'CONFIRMED',
        DEFINITIVE_FAILURE: 'DEFINITIVE_FAILURE',
        UNKNOWN: 'UNKNOWN',
    },

    RECONCILE_OUTCOME: {
        CONFIRMED_ISSUED: 'CONFIRMED_ISSUED',
        CONFIRMED_FAILED: 'CONFIRMED_FAILED',
        UNRESOLVED: 'UNRESOLVED',
    },

    RECONCILE_RESULT: {
        SKIPPED: 'SKIPPED',
        DEFERRED: 'DEFERRED',
        ISSUED: 'ISSUED',
        FAILED: 'FAILED',
        PROCESSING: 'PROCESSING',
        AMBIGUOUS: 'AMBIGUOUS',
        UNRESOLVED: 'UNRESOLVED',
    },

    reconcileCredsCacheKey: (accessKey) => `cc:reconcile:creds:${accessKey}`,

    ACTIVE_ISSUANCE_INDEX: 'cardIssuances_activeIssuance_unique',

    LOG_PREFIX: '[CardReconcile]',

    RECONCILE_DEFAULTS: {
        delayMinutes: 15,
        // Staging waits 5 minutes instead of 15: the point there is to see the order-status leg run
        // during a test session, not to be gentle with the issuer's rate limits.
        stagingDelayMinutes: 5,
        sweepSeconds: 60,
        batch: 25,
        leaseSeconds: 120,
        statusTimeoutMs: 20000,
        issueTimeoutMs: 5000,
        credsTtlSeconds: 604800,
        maxAgeDays: 10,
        maxAttempts: 2,
        giveUpHours: 1,
    },
}
