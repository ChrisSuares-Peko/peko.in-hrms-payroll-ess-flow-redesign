const express = require('express')
const router = express.Router({ mergeParams: true });

const { verifyToken, requireSystemUser } = require('../../../../utils/jwtToken')

router.use(verifyToken)
router.use(requireSystemUser)

router.use("/reportSetting", require("./reportSetting"));
router.use("/preReminders", require("./preRemainders"));
module.exports = router