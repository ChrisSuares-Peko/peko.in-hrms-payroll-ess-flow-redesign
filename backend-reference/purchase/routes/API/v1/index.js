const router = (module.exports = require("express")());

// Public routes — no auth middleware
router.use("/invite/rfq-invite/purchase", require("./public/rfqInvite"))
router.use("/invite/po-invite/purchase",  require("./public/poInvite"))

router.use("/corporate/:corporateId/purchase", require("./corporate"))

router.use("/system_user/:userId/purchase", require("./systemUser"))
router.use("/webhook", require("./webhook"))

// Internal ONDC ops (scheduler-triggered buyer delay notices)
router.use("/ondc", require("./ondc"))


// router.use("/paytm", require("./corporate/paytmWebhook"))