const express = require("express");
const {
    // Payment Links (Collection 360)
    nupayCollectionWebhook,
    nupaySettlementWebhook,
    nupayOnboardingWebhook,
    // Payouts (Unified Wallet)
    nupayDebitWebhookHandler,
    nupayCreditWebhookHandler,
    nupayRefundWebhookHandler,
    nupayOnboardingWebhookHandler,
} = require("../../../../controllers/webhook/nupayWebhook");

const router = express.Router({ mergeParams: true });

// NuPay registers these URLs per merchant at onboarding. Public (no auth), always ACK 200.

// Payment Links (Collection 360)
router.post("/payment-links/callback", nupayCollectionWebhook);
router.post("/payment-links/settlement", nupaySettlementWebhook);
router.post("/onboarding/status", nupayOnboardingWebhook);

// Payouts (Unified Wallet)
router.post("/payout/update", nupayDebitWebhookHandler);
router.post("/wallet/credit", nupayCreditWebhookHandler);
router.post("/refund", nupayRefundWebhookHandler);
router.post("/onboarding-status", nupayOnboardingWebhookHandler);

module.exports = router;
