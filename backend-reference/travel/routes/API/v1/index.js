const router = (module.exports = require("express")());

router.use("/corporate/:corporateId/travel", require("./corporate"))

router.use("/system_user/:userId/travel", require("./systemUser"))

router.use("/vendor/:vendorId/travel", require("./webhooks"))
