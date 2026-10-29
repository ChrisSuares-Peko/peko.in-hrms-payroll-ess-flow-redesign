const express = require("express");
const router = express.Router();

const { findAllSoftwareSubscriptionsAndCount, findAllPlansAndDetails, payment, findAllSoftwareSubscriptionTransactionsAndCount } = require("../../../../controllers/corporate/software_subscriptions");
const { validateSoftwareSubscriptionPayment } = require("../../../../utils/apiValidation");
const validateBusinessEmailAmount = require("../../../../middlewares/businessEmailPaymentValidation");
const { findAllSoftwareSubscriptionsAndCountValidation, findAllPlansAndDetailsValidation, findAllSoftwareSubscriptionTransactionsAndCountValidation } = require("../../../../utils/queryValidation");
const { checkServiceEnabled } = require("../../../../middlewares/disableServiceCheck");
const operatorsData = require('../../../../utils/operatorsData.json')
const accessKey = operatorsData["email_domain_service"]["accessKey"];

router.use(checkServiceEnabled(accessKey))
router.get("/",findAllSoftwareSubscriptionsAndCountValidation, findAllSoftwareSubscriptionsAndCount);
router.get("/plans",findAllPlansAndDetailsValidation, findAllPlansAndDetails);
router.get("/transactions",findAllSoftwareSubscriptionTransactionsAndCountValidation, findAllSoftwareSubscriptionTransactionsAndCount);
router.post("/payment", validateSoftwareSubscriptionPayment,validateBusinessEmailAmount, payment)


module.exports = router;