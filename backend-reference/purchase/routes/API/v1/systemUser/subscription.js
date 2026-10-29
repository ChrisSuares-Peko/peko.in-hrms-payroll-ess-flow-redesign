const express = require("express");
const { createNewActivationCode, findAllSubscriptionCodesAndCount, updateActivationCode, updateStatusActivationCode, deleteActivationCode, subscriptionCodePDF, subscriptionCodeExcelCSV } = require("../../../../controllers/admin/subscriptionCodes");
const { validateActivationCodeStatus, validateNewActivationCode } = require("../../../../utils/apiValidation");
const { findAllSubscriptionCodesAndCountValidation } = require("../../../../utils/queryValidation");

const router = express.Router();

router.get("/",findAllSubscriptionCodesAndCountValidation, findAllSubscriptionCodesAndCount);
router.post("/", validateNewActivationCode, createNewActivationCode);
router.put('/:id', validateNewActivationCode, updateActivationCode)
router.put('/update-status/:id', validateActivationCodeStatus, updateStatusActivationCode);
router.delete('/:id', deleteActivationCode)
router.get('/download/pdf', subscriptionCodePDF)
router.get('/download/:type',subscriptionCodeExcelCSV)

module.exports = router;