const express = require('express')
const {
  verifyToken,
  requireSystemUser,
} = require('../../../../utils/jwtToken')
const router = express.Router({mergeParams:true});

router.use(verifyToken)
router.use(requireSystemUser)
// router.use("/bulk-refund", require("./bulkRefund"));
router.use("/vendorPayout", require("./kybDetails"));
router.use("/payment-links", require("./paymentLinks"))
router.use("/refund-transaction", require("./refundTransaction"));
router.use("/billers", require("./billers"));
// F-PAY-20: dead Decentro VA mount (replaced by NuPay) — commented out, not removed.
// router.use("/virtual-account", require("./virtualAccount"));


module.exports = router;

