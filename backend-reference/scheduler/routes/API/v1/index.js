const router = (module.exports = require("express")());


router.use("/corporate/:corporateId/scheduler", require("./corporate"))
router.use("/system_user/:userId/scheduler", require("./systemUser"))