const express = require("express");
const router = express.Router();

const { createSoftwareSubscription, findAllSoftwareSubscriptionsAndCount, fetchSoftwareSubscriptionVendor, updateSoftwareSubscription, updateStatus, softwareSubscriptionAndCountPDF, softwareSubscriptionAndCountExcelCSV, deleteSoftwareSubscription, findAllBusinessEmailsOrdersAndCount, businessEmailOrdersGeneratePDF, businessEmailOrdersGenerateExcelCSV } = require("../../../../controllers/admin/softwares_subscriptions");
const {  validateSoftwareSubscription, validateActiveStatus } = require("../../../../utils/apiValidation");
const { findAllSoftwareSubscriptionsAndCountValidation } = require("../../../../utils/queryValidation");

router.get("/",findAllSoftwareSubscriptionsAndCountValidation, findAllSoftwareSubscriptionsAndCount);
router.post("/", validateSoftwareSubscription, createSoftwareSubscription);
router.get("/vendors",fetchSoftwareSubscriptionVendor)
router.put('/:id',validateSoftwareSubscription, updateSoftwareSubscription);
router.patch('/:id',validateActiveStatus, updateStatus)
router.delete('/:id', deleteSoftwareSubscription)

router.get("/pdf",findAllSoftwareSubscriptionsAndCountValidation, softwareSubscriptionAndCountPDF);
router.get("/:type",findAllSoftwareSubscriptionsAndCountValidation, softwareSubscriptionAndCountExcelCSV);


router.get('/reports',findAllBusinessEmailsOrdersAndCount)
router.get('/reports/pdf',businessEmailOrdersGeneratePDF)
router.get('/reports/:type',businessEmailOrdersGenerateExcelCSV)
module.exports = router;