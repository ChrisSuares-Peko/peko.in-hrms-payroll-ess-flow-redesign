const router = (module.exports = require("express")());
router.use("/peko/general/officeAndBusiness", require("./general"));

router.use("/corporate/:corporateId/officeAndBusiness", require("./corporate"))
router.use("/system_user/:userId/officeAndBusiness", require("./systemUser"))
router.use("/webhook/:webhookUser/officeAndBusiness", require("./webhook"))
