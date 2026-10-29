
const express = require('express')
const { findAllAddOnsAndCount, AddOnsExcelCSV, AddOnsPDF } = require('../../../../controllers/admin/whatsAppForBusiness');
const { validateAddOnsQuery, validateExportType } = require('../../../../utils/apiValidations/queryValidation');
const router = express.Router()

router.get(
  "/addOns",
  validateAddOnsQuery,
  findAllAddOnsAndCount
);

router.get(
  "/pdf",
  validateAddOnsQuery,
  AddOnsPDF
);

router.get(
  "/:type",
  validateAddOnsQuery,
  validateExportType,
  AddOnsExcelCSV
);


module.exports = router