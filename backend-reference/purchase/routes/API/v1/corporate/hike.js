const express = require("express");
const router = express.Router();

const { findAllHikes, payment, findAllHikeTransactionsAndCount } = require("../../../../controllers/corporate/hike");
const { validateHikePayment } = require("../../../../utils/apiValidation");
const { findAllHikeTransactionsAndCountValidation } = require("../../../../utils/queryValidation");
const { checkServiceEnabled } = require("../../../../middlewares/disableServiceCheck");
const operatorsData = require('../../../../utils/operatorsData.json')
const accessKey = operatorsData["hike"]["accessKey"];

router.use(checkServiceEnabled(accessKey))
router.get("/", findAllHikes);
router.get("/transactions",findAllHikeTransactionsAndCountValidation, findAllHikeTransactionsAndCount);
router.post("/payment", validateHikePayment, payment);

module.exports = router;
