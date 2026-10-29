const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllBillers,
  addBiller,
  removeBiller,
  previewBillers,
  bulkUploadBillers,
  bulkRemoveBillers,
  disableBiller,
  enableBiller,
  refreshBillerInfo,
  fetchBillerMDM,
  getBillerCategories,
  updateBillerName,
  exportBillFetchLogs,
  getBillAvenueWalletBalance,
  updateBillAvenueWalletBalance,
} = require('../../../../controllers/admin/billers');
const { excelToJsonBillers } = require('../../../../middlewares/excelToJson');
const upload = require('../../../../middlewares/multer');

router.get("/", getAllBillers);

router.post("/", addBiller);

router.patch("/:billerId/name", updateBillerName);

router.delete("/", removeBiller);

router.post("/disable", disableBiller);

router.post("/enable", enableBiller);

router.post("/refresh", refreshBillerInfo);

router.post("/preview", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: false,
            message: "File size too large. Maximum size is 10MB",
            responseCode: "001"
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            status: false,
            message: "Unexpected file field. Please use 'file' as the field name",
            responseCode: "001"
          });
        }
        return res.status(400).json({
          status: false,
          message: `File upload error: ${err.message}`,
          responseCode: "001"
        });
      }
      // Handle "Unexpected end of form" and other errors
      if (err.message && (err.message.includes('Unexpected end of form') || err.message.includes('Unexpected end'))) {
        return res.status(400).json({
          status: false,
          message: "File upload incomplete or corrupted. Please check your file and try again. Ensure the file is a valid Excel file and not corrupted.",
          responseCode: "001"
        });
      }
      return res.status(400).json({
        status: false,
        message: `File upload error: ${err.message || 'Unknown error occurred'}`,
        responseCode: "001"
      });
    }
    next();
  });
}, excelToJsonBillers, previewBillers);

router.post("/preview-json", previewBillers);

router.post("/bulk-upload", bulkUploadBillers);

router.delete("/bulk-remove", bulkRemoveBillers);

router.post("/mdm/fetch", fetchBillerMDM);

router.get("/mdm/categories", getBillerCategories);

router.get("/fetch-logs/export", exportBillFetchLogs);

// BillAvenue vendor wallet balance (internally tracked) — admin reads + updates after a top-up.
router.get("/billavenue-wallet", getBillAvenueWalletBalance);
router.post("/billavenue-wallet", updateBillAvenueWalletBalance);

module.exports = router;
