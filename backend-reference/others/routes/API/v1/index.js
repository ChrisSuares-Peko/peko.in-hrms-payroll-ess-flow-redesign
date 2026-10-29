const router = (module.exports = require("express")());

router.use("/corporate/:corporateId/others", require("./corporate"))
router.use("/system_user/:userId/others", require("./systemUser"))
// An employee session addresses this service as /user/:userId/others. Without this mount every call they
// make here matched no route at all.
router.use("/user/:userId/others", require("./employee"))

