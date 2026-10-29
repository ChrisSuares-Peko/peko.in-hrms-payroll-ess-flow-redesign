const express = require("express");
const router = express.Router({ mergeParams: true });
const { customLog } = require("../../../utils/loggerHelper");
const { notifyDelayedOndcOrders } = require("../../../services/ondcOrderStatusNotify");

// Shared-secret guard for internal (scheduler -> purchase) calls. The caller
// must send `x-internal-token` matching the existing shared SESSION_SECRET.
const requireInternalToken = (req, res, next) => {
    const expected = process.env.SESSION_SECRET;
    const provided = req.headers["x-internal-token"];
    if (!expected || provided !== expected) {
        return res.status(401).json({
            status: false,
            message: "Unauthorized",
            responseCode: "001",
        });
    }
    next();
};

// NOTE: the office-supply catalog refresh route is gone along with the cron that
// pre-warmed the catalog. The storefront now fires its own /search per visit and
// reads the results back scoped to that search's transaction_id, so a
// broadcast-everything sweep bought nothing and, pointed at a test harness,
// injected transaction ids no scenario had issued. Retention moved to the
// scheduler's purge-only job (scheduler/services/ondcProductPurge.js).

// NOTE: the seller-payout RELEASE sweep also has no route here. It used to be
// POST /payouts/sweep so Cashfree Easy Split had one home in purchase; it now
// runs in the scheduler (scheduler/services/ondcSellerPayout.js) against the
// shared DB, same pattern as delivery-status and TAT-breach. PARK and NARROW
// stay event-driven in services/ondcPayoutHold.js.

/**
 * Mail buyers whose orders are past their promised delivery date and still
 * undelivered (spec template 9's "seller has gone quiet" trigger).
 *
 * Unlike the TAT-breach ALERT next door in the scheduler — which reads the shared DB
 * directly because it only needs ondcOrders and an ops recipient list — this one
 * needs purchase's notification ledger for its send-once claim, the buyer recipient
 * resolver (corporate -> sub-corporate -> billing) and the Office Supplies template
 * set. All three live here, so the work does too and the scheduler just ticks it.
 *
 * Idempotent: each order's mail is claimed on (order, "delay:tat-breach") before it
 * is sent, so a double call mails nobody twice. Always 200 on a completed sweep —
 * the counts are in the body, and a non-2xx would make the cron treat a partial
 * sweep as a total failure.
 */
router.post("/notify/delayed-orders", requireInternalToken, async (req, res) => {
    try {
        const summary = await notifyDelayedOndcOrders({
            noEtaFallbackHours: Number(req.body?.noEtaFallbackHours) || 24,
            limit: Number(req.body?.limit) || 200,
            logTraceId: req?.LogTraceId,
        });
        return res.status(200).json({
            status: true,
            message: "ONDC buyer delay notices complete",
            data: summary,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            flow: "ondcOrderStatusNotify",
            message: "ONDC buyer delay sweep failed",
            error: error?.message || error,
        });
        return res.status(500).json({
            status: false,
            message: error?.message || "Delay notice sweep failed",
            responseCode: "001",
        });
    }
});

// NOTE: the confirm-after-payment flow has no route here either. paymentGateway
// sends /confirm itself and records it in the shared tables; purchase settles the
// checkout from on_confirm and on each checkout-result poll
// (services/ondcConfirmAfterPayment.js). No service calls another.

// NOTE: the delivery-status poll deliberately has no route here. It sends only
// signed /status calls — no gateway, no money — so it runs entirely in the
// scheduler (scheduler/services/ondcDeliveryStatus.js) against the shared DB.
// Purchase still owns the on_status webhook that persists the answers.

// NOTE: the TAT-breach alert deliberately has no route here. It moves no money
// and calls no gateway, so it lives entirely in the scheduler
// (scheduler/services/ondcTatBreach.js) and reads the shared DB directly.
// Purchase still owns the ondcOrders.tatBreachNotifiedAt column and the
// admin panel's delayed badge/filter.

module.exports = router;
