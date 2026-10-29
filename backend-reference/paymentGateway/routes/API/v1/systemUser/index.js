const express = require("express")
const router = express.Router({mergeParams:true});
const {
  verifyToken,
  requireSystemUser,
} = require('../../../../utils/jwtToken')
router.use(verifyToken)
router.use(requireSystemUser)
router.use("/ni-payments", require("./paymentGateway"));

router.use("/cashfree-payments", require("./paymentGateway"));

router.use("/payment-methods", require("./paymentMethods"));

router.use("/manual-refunds", require("./manualRefunds"));

router.use("/renewal-charges", require("./renewalCharges"));

router.use("/orders", require("./orders"));

module.exports = router;