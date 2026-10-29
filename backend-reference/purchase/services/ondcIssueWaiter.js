/**
 * In-process registry that lets issue endpoint holds its HTTP response
 * open until the seller's asynchronous on_issue or on_issue_status callback
 * arrives for that issue_id.
 */

const { customLog } = require("../utils/loggerHelper");

const DEFAULT_TIMEOUT_MS = 30000;

const pending = new Map(); // issueId -> { resolve, timer }

const settle = (issueId, reason, issue = null, error = null) => {
    const entry = pending.get(issueId);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(issueId);
    entry.resolve({ received: Boolean(issue || error), reason, issue, error });
};

/**
 * Register interest in an issueId and wait until its on_issue/on_issue_status callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} issueId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, issue:Object|null, error:Object|null}>}
 */
const waitForOnIssue = (
    issueId,
    { timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) =>
    new Promise((resolve) => {
        if (pending.has(issueId)) {
            settle(issueId, 'superseded');
        }
        const timer = setTimeout(() => settle(issueId, 'timeout'), timeoutMs);
        pending.set(issueId, { resolve, timer });
    });

/**
 * Called by the on_issue/on_issue_status webhook with the issue payload.
 *
 * @param {string} issueId
 * @param {Object} [issue] on_issue `message.issue`
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnIssue = (issueId, issue, error) => {
    if (!issueId) return;
    const entry = pending.get(issueId);
    if (!entry) return;
    customLog(null, "info", { message: `notifyOnIssue: ${issueId}`, hasIssue: Boolean(issue), error }, "VENDOR");
    settle(issueId, error ? 'error' : 'on_issue', issue || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. client disconnected). */
const cancelIssueWait = (issueId, reason = 'cancelled') => {
    settle(issueId, reason);
};

module.exports = {
    waitForOnIssue,
    notifyOnIssue,
    cancelIssueWait,
};
