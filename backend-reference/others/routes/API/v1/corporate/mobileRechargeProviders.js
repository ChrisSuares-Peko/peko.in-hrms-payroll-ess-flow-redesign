const express = require("express");
const {
    listMobileRechargeProviders,
} = require("../../../../controllers/corporate/mobileRechargeProviders");

const router = express.Router({ mergeParams: true });

router.get("/", listMobileRechargeProviders);

module.exports = router;
