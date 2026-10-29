const express = require("express");
const router = express.Router();

const {  validateActiveStatus, validateSoftwareSubscriptionPlan } = require("../../../../utils/apiValidation");
const { findAllSoftwareSubscriptionPlansAndCount, createSoftwareSubscriptionPlan, updatePlanStatus, updateSoftwareSubscriptionPlan, softwareSubscriptionPlansAndCountPDF, softwareSubscriptionPlansAndCountExcelCSV, deleteSoftwareSubscriptionPlan } = require("../../../../controllers/admin/softwares_subscriptions_plans");
const { listAllSoftwareSubscriptionsAndCount } = require("../../../../controllers/admin/softwares_subscriptions");
const { findAllSoftwareSubscriptionPlansAndCountValidation } = require("../../../../utils/queryValidation");

router.get("/",findAllSoftwareSubscriptionPlansAndCountValidation, findAllSoftwareSubscriptionPlansAndCount);
router.get("/products", listAllSoftwareSubscriptionsAndCount)
router.post("/", validateSoftwareSubscriptionPlan, createSoftwareSubscriptionPlan);
router.put('/:id',validateSoftwareSubscriptionPlan, updateSoftwareSubscriptionPlan);
router.patch('/:id',validateActiveStatus, updatePlanStatus)
router.delete('/:id', deleteSoftwareSubscriptionPlan)


router.get("/pdf",findAllSoftwareSubscriptionPlansAndCountValidation, softwareSubscriptionPlansAndCountPDF);
router.get("/:type",findAllSoftwareSubscriptionPlansAndCountValidation, softwareSubscriptionPlansAndCountExcelCSV);

module.exports = router;