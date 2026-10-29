const express = require("express");
const router = express.Router({ mergeParams: true });
const { handlePGWebhookCashfree, handlePGWebhook, handlePendingTransactions, handleCashfreeRedirect } = require("../../../../controllers/corporate/cashFreeGateway");

router.post("/", handlePGWebhook);//refund webhook //configured in payload notify url
router.post("/pg", handlePendingTransactions) //payment success, success payment
router.post("/subscription", handlePGWebhookCashfree);
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.post("/subscription/redirect", handleCashfreeRedirect); //configured in payload
// F-PG-25: disabled — "not used" (Cashfree returns to the frontend /payments and /plans/review-order),
// and it always redirected with a fake "success" status and a hard-coded transaction id.
// router.post("/return", handleCashfreeReturn)

module.exports = router;
