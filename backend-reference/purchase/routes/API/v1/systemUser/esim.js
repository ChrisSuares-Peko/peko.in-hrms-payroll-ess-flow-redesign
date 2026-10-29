const express = require("express");
const router = express.Router();
const upload = require("../../../../middlewares/multer");
const { createEsim, findAllEsim, updateEsim, fetchCountries, coveragepprofiles, updateEsimStatus, esimPDF, esimExcelCSV, bulkExcelUploadPlans, getBulkTemplate, getPriceEsimPlan, syncTunzPlans } = require("../../../../controllers/admin/esim");
const { validateEsim, validateEsimUpdate } = require("../../../../utils/apiValidation");
const { excelToJsonPlans } = require("../../../../middlewares/excelToJson");
const { findAllEsimValidation, fetchCountriesValidation, coveragepprofilesValidation, getPriceEsimPlanValidation } = require("../../../../utils/queryValidation");


router.post("/", validateEsim, createEsim);
router.get('/bulk-template', getBulkTemplate)
router.post("/bulk-excel-upload", upload.single("file"), excelToJsonPlans, bulkExcelUploadPlans);

// router.post("/", createEsim);
router.get("/", findAllEsimValidation, findAllEsim);
router.put("/:planId", validateEsimUpdate, updateEsim);
router.put("/status/:id", updateEsimStatus);
router.get("/countries", fetchCountriesValidation, fetchCountries);
router.get("/coveragepprofiles",coveragepprofilesValidation, coveragepprofiles);
router.get('/download/pdf', findAllEsimValidation, esimPDF)
router.get('/download/:type', findAllEsimValidation, esimExcelCSV)
router.get("/getPriceEsim",getPriceEsimPlanValidation, getPriceEsimPlan);
router.post("/tunz/sync", syncTunzPlans);

module.exports = router;
