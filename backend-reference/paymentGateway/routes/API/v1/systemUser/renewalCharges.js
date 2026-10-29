const express = require("express");

const router = express.Router({ mergeParams: true });
const { getRenewalCharges } = require("../../../../controllers/admin/renewalCharges");
const { getSchedulerChargeOrders } = require("../../../../controllers/admin/schedulerChargeOrders");
const {
    getMandateStatus,
    fixAmount,
    chargeNow,
    recollectMandate,
    simulateCharge,
} = require("../../../../controllers/admin/renewalChargeActions");

// Admin report: subscription renewal charges (requested orders + upcoming preview) with validation.
router.get("/", getRenewalCharges);

// Admin report (2nd tab): scheduler-initiated SUBSCRIPTION_CHARGE orders — per-order webhook prediction,
// live Cashfree mandate status, price validation, and the rows the renewal webhook will write.
router.get("/scheduler-charge-orders", getSchedulerChargeOrders);

// Live mandate health (on-demand Cashfree lookup).
router.get("/mandate-status", getMandateStatus);

// Remediation actions.
router.post("/fix-amount", fixAmount); // correct a drifted stored amount to the canonical price
router.post("/charge-now", chargeNow); // trigger/retry the renewal charge (money action — idempotent + guarded)
router.post("/recollect-mandate", recollectMandate); // ask the customer to re-authorize auto-pay
router.post("/simulate-charge", simulateCharge); // STAGING-ONLY: deliver the CHARGE webhook for a dispatched order

module.exports = router;
