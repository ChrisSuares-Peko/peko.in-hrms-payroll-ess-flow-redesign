const express = require("express");
const router = express.Router();
const {
    createMobileRechargeProvider,
    findAllMobileRechargeProvidersAndCount,
    updateMobileRechargeProvider,
    updateMobileRechargeProviderStatus,
    deleteMobileRechargeProvider,
} = require("../../../../controllers/admin/mobileRechargeProviders");
const {
    validateMobileRechargeProvider,
    validateMobileRechargeProviderStatus,
} = require("../../../../utils/apiValidation");

router.get("/", findAllMobileRechargeProvidersAndCount);
router.post("/", validateMobileRechargeProvider, createMobileRechargeProvider);
router.put("/update-status/:id", validateMobileRechargeProviderStatus, updateMobileRechargeProviderStatus);
router.put("/:id", validateMobileRechargeProvider, updateMobileRechargeProvider);
router.delete("/:id", deleteMobileRechargeProvider);

module.exports = router;
