/**
 * In-process cache of successful on_init orders, keyed by transaction_id.
 *
 * ONDC /confirm must ECHO the order returned on on_init (provider, items,
 * billing, quote "must match", payment + settlement details) — but the
 * /ondc/initOrder API returns only a mapped quote to the client. So the raw
 * on_init `message.order` (plus the routing context needed to fire /confirm)
 * is parked here between the init and confirm calls instead of being
 * round-tripped through the browser.
 *
 * Entries expire after 30 minutes (the sellers' quotes carry ~PT1H ttls) —
 * a confirm after expiry gets `undefined` and the client must re-run init.
 *
 * Single-process only (same purchase service handles init and confirm), same
 * constraint as the ondc*Waiter registries.
 */

const SESSION_TTL_MS = 30 * 60 * 1000;

const sessions = new Map(); // transactionId -> { data, timer }

/**
 * Park a successful on_init result for the upcoming /confirm.
 * @param {string} transactionId
 * @param {Object} data { order, bppId, bppUri, domain, city, gps, cartItems }
 */
const saveInitSession = (transactionId, data) => {
    if (!transactionId) return;
    clearInitSession(transactionId);
    const timer = setTimeout(() => sessions.delete(transactionId), SESSION_TTL_MS);
    sessions.set(transactionId, { data, timer });
};

/**
 * @param {string} transactionId
 * @returns {Object|undefined} the parked init session data, if not expired
 */
const getInitSession = (transactionId) => sessions.get(transactionId)?.data;

/** Drop a parked session (confirm succeeded, or superseded by a re-init). */
const clearInitSession = (transactionId) => {
    const entry = sessions.get(transactionId);
    if (!entry) return;
    clearTimeout(entry.timer);
    sessions.delete(transactionId);
};

module.exports = {
    saveInitSession,
    getInitSession,
    clearInitSession,
};
