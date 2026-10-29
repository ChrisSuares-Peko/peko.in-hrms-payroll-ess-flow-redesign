const express = require("express");
const router = express.Router({ mergeParams: true });
const { pay } = require("../../../../controllers/corporate/corporateCardGateway");
const validateAmount = require("../../../../middlewares/validateAmount");
const { checkServiceEnabled } = require("../../../../middlewares/disableServiceCheck");
const operatorsData = require("../../../../utils/operatorsData.json");

// Same amount validation as the Cashfree create-order; the leg is off wherever Corporate Cards itself is.
router.post("/pay", checkServiceEnabled(operatorsData["corporateCards"]["accessKey"]), validateAmount, pay);

module.exports = router;
