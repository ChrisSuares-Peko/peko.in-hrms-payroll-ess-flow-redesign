const express = require('express')
const {
  verifyToken,
  requireSystemUser,
} = require('../../../../utils/jwtToken')
const router = express.Router({mergeParams:true});

router.use(verifyToken)
router.use(requireSystemUser)
router.use("/bus", require("./bus"));
router.use("/eSIM", require("./eSIM"));
router.use("/flight", require("./flight.js"));
router.use("/hotels", require("./hotels"));
router.use("/logistics", require("./logistics"));

module.exports = router;