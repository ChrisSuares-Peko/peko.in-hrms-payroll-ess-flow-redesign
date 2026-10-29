const express = require('express');
const { verifyToken } = require('../../../../utils/jwtToken');
const router = express.Router({mergeParams:true});

router.use(verifyToken)
// travel
router.use("/hotels", require("./hotels"));
router.use("/flight", require("./flight"))
router.use("/logistics_V3", require("./logistics_V3"))
router.use("/eSIM", require("./eSIM"))
router.use("/bus", require("./bus"))
router.use("/visa", require("./visa"))

module.exports = router;

