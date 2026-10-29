/**
 * `responseCode` values with app-wide meaning, and the message that pairs with FORBIDDEN.
 *
 * The frontend interceptor (`Peko-IN-Frontend/src/services/config.ts`) branches on these, so they are a
 * contract rather than free-form strings. Only the authorization codes live here — this service also returns
 * '000'/'001' in hundreds of places and centralising those would be a rename, not a fix.
 *
 * Deliberately NOT applied in `middlewares/error.js`: unlike corporateCard, a 403 in this service is not always
 * an authorization refusal — `controllers/admin/signUp.js` raises 403 for field validation — so mapping every
 * 403 to FORBIDDEN here would tell a user their details are wrong because they lack permission.
 */
module.exports = {
    // Authenticated, but not allowed to do this. The frontend shows a permission message.
    FORBIDDEN: '007',
    // The caller handles this refusal itself; the frontend interceptor stays quiet. For a refusal the user
    // did not ask for and cannot act on, where a toast would be noise rather than information.
    SILENT: '003',
    // Says what went wrong without naming the missing permission — the caller cannot act on it, and listing it
    // would map out the authorization model.
    PERMISSION_DENIED: "You don't have permission to perform this action.",
}
