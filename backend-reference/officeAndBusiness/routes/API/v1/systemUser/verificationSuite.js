const express = require('express')
const { getVerificationHistoryForAdmin, getVerificationPDFForAdmin, getVerificationExcelCSVForAdmin } = require('../../../../controllers/admin/verificationSuite');
const { validateAdminVerificationQuery, validateExportType } = require('../../../../utils/apiValidations/queryValidation');
const router = express.Router()


router.get(
  "/verification-history",
  validateAdminVerificationQuery,
  getVerificationHistoryForAdmin
);

router.get(
  "/verification-history/pdf",
  validateAdminVerificationQuery,
  getVerificationPDFForAdmin
);

router.get(
  "/verification-history/:type",
  validateAdminVerificationQuery,
  validateExportType,
  getVerificationExcelCSVForAdmin
);

module.exports = router