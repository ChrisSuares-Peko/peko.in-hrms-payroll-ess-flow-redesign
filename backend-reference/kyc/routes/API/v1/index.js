
const router = (module.exports = require("express")());

router.use("/corporate/:corporateId/kyc", require("./corporate"))
router.use("/system_user/:userId/kyc", require("./admin"))