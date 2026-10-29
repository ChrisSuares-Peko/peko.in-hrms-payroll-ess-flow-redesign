const { AsyncLocalStorage } = require("async_hooks");

const ACCOUNTING_PORTAL = "ACCOUNTING_PORTAL";
const ADMIN_PANEL = "ADMIN_PANEL";
const SOURCE_HEADER = "x-app-source";
const ACCOUNTING_HEADER_VALUE = "accounting-portal";
const ACCOUNTING_PATH = "/others/accounting/";

const storage = new AsyncLocalStorage();

// Two Accounting Portal screens call shared endpoints, so the portal also says so in a header.
const sourceOf = req => {
    const header = String((req.headers && req.headers[SOURCE_HEADER]) || "")
        .trim()
        .toLowerCase();
    if (header === ACCOUNTING_HEADER_VALUE) return ACCOUNTING_PORTAL;
    const path = String(req.originalUrl || req.url || "").split("?")[0];
    return `${path}/`.includes(ACCOUNTING_PATH) ? ACCOUNTING_PORTAL : ADMIN_PANEL;
};

const IP_LIMIT = 64;

// The gateway sets x-client-ip from its own view of the connection and overwrites any client-sent one; x-forwarded-for is
// client-controlled, so it is never used. Direct calls fall back to the socket.
const clientIpOf = req => {
    const gatewayIp = String((req.headers && req.headers["x-client-ip"]) || "").trim();
    const address = gatewayIp || (req.socket && req.socket.remoteAddress) || req.ip || "";
    return address.replace(/^::ffff:/, "").replace(/^::1$/, "127.0.0.1").slice(0, IP_LIMIT) || null;
};

const bindRequestContext = (req, res, next) =>
    storage.run(
        {
            actorId: req.user && req.user.id != null ? req.user.id : null,
            source: sourceOf(req),
            ipAddress: clientIpOf(req),
        },
        next
    );

const currentContext = () => storage.getStore();

const currentIp = () => {
    const context = currentContext();
    return (context && context.ipAddress) || null;
};

module.exports = {
    ACCOUNTING_PORTAL,
    ADMIN_PANEL,
    sourceOf,
    clientIpOf,
    bindRequestContext,
    currentContext,
    currentIp,
};
