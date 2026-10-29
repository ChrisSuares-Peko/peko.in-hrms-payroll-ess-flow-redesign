const express = require("express");
const router = express.Router({ mergeParams: true });

const { getManualRefunds, updateManualRefund } = require("../../../../controllers/admin/manualRefunds");
const { getManualRefundsValidation, updateManualRefundValidation } = require("../../../../utils/queryValidation");

router.get("/", getManualRefundsValidation, getManualRefunds);
router.put("/:manualRefundId", updateManualRefundValidation, updateManualRefund);

module.exports = router;
