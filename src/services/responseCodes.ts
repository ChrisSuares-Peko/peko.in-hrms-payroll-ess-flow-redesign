/**
 * `responseCode` values the backend sends that this app treats specially, in one place so a reader of
 * `ApiClient`'s response interceptor can see what each branch means.
 *
 * These mirror the backend contract (`Peko-IN/corporateCard/constants/responseCodes.js`,
 * `Peko-IN/users/utils/responseCodes.js`, and SESSION_EXPIRED from `createTraceIdExpiredError` in
 * `Peko-IN/travel/controllers/corporate/airline.js`) — changing a value here without changing it there
 * silently drops the branch.
 */
export const RESPONSE_CODE = {
    /** Invalid or expired token — log the user out. */
    INVALID_TOKEN: '002',
    /** The caller handles this error itself; the interceptor must stay silent. */
    SILENT: '003',
    /** Not found — hard-redirect to /404. */
    NOT_FOUND: '004',
    /** Vendor session expired (flight TraceId) — the caller must restart from its first step. */
    SESSION_EXPIRED: '005',
    /** Privacy policy not accepted — open the privacy modal. */
    PRIVACY_POLICY: '006',
    /** Authenticated, but not allowed to perform this action. */
    FORBIDDEN: '007',
} as const;

/**
 * Shown when a request is refused for lack of permission and the server sent no message of its own. The server
 * usually does send one, and its version is preferred because it can be specific ("Your own requests are
 * decided by your corporate admin") where this can only be generic.
 */
export const PERMISSION_DENIED_MESSAGE = "You don't have permission to perform this action.";
