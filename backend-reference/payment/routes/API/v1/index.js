const router = (module.exports = require("express")());


router.use("/corporate/:corporateId/payment", require("./corporate"))
router.use("/system_user/:userId/payment", require("./systemUser"))
router.use("/webhook/decentro/payment", require("./webhook"))
// TEMP: public BBPS proxy-api test endpoint — see ./webhook/bbpsTest.js
router.use("/webhook/bbps/payment", require("./webhook/bbpsTest"))
router.use("/webhook/droom/payment", require("./webhook/droom"))
router.use("/webhook/nupay/payment", require("./webhook/nupay"))
// router.use("/vendor/:webhookUser/payment", require("./webhook/esimWebhook"))
