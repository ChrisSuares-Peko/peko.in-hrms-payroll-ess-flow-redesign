const express = require("express");
const {
  findKYBDetails,
  updateKYBDocStatus,
  KYBDocumentsPDF,
  KYBDetailsExcelCSV,
} = require("../../../../controllers/admin/kybDetails");

const {
  validateKYBDetailsAdminUpdate,
} = require("../../../../utils/apiValidation");
const { findKYBDetailsValidation } = require("../../../../utils/queryValidation");
const router = express.Router({ mergeParams: true });

router.get("/kybDetails/find-all",findKYBDetailsValidation, findKYBDetails);
router.get("/kybDetails/pdf",findKYBDetailsValidation, KYBDocumentsPDF);
router.get("/kybDetails/:type",findKYBDetailsValidation, KYBDetailsExcelCSV);
router.put(
  "/kybDetails/update-status/:kybId",
  validateKYBDetailsAdminUpdate,
  updateKYBDocStatus
);

module.exports = router;
