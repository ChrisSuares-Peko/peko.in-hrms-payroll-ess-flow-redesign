const express = require("express");
const router = express.Router();
const { employeesFilesUpload } = require("../middleware/fileUpload");
const {
    validateOnboardingDocuments,
    validateOnboardingBank,
    validateOnboardingEmergency,
} = require("../middleware/validation/onboarding");
const {
    getRequiredOnboardingDocuments,
    submitOnboardingDocuments,
    submitOnboardingBank,
    submitOnboardingEmergency,
} = require("../controller/onboarding");

router.get("/required-documents", getRequiredOnboardingDocuments);
router.post("/documents", validateOnboardingDocuments, employeesFilesUpload, submitOnboardingDocuments);
router.post("/bank", validateOnboardingBank, submitOnboardingBank);
router.post("/emergency", validateOnboardingEmergency, submitOnboardingEmergency);

module.exports = router;
