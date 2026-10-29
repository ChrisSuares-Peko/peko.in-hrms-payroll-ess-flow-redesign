const express = require('express')
const router = express.Router({ mergeParams: true });

const { verifyToken } = require('../../../../utils/jwtToken')

router.use(verifyToken)

router.use("/reportSetting", require("./reportSetting"));

module.exports = router