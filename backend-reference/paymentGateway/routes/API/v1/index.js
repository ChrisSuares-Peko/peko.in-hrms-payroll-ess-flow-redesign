
const router = (module.exports = require("express")());

router.use("/corporate/:corporateId/payment-gateway", require("./corporate"))
router.use("/system_user/:userId/payment-gateway", require("./systemUser"))
router.use("/webhook/:webhookUser/payment-gateway", require("./webhook"))