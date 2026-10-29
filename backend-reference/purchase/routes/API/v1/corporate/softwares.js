const express = require("express");
const router = express.Router();

const {
  findAllSoftwares,
  findDetails,
  findAllPlansAndCount,
  findPlanDetails,
  findAllAssignedSubscriptions,
  findCorporateDetails,
  payment,
} = require("../../../../controllers/corporate/softwares");
const { fetchAllSoftwareCategories } = require("../../../../controllers/admin/software");
const {validateSoftwaresPayment}=require('../../../../utils/apiValidation')

router.get("/fetchAllCategories", fetchAllSoftwareCategories);
router.get("/subscriptions", findAllSoftwares);
router.get("/details", findDetails);
router.get("/plans", findAllPlansAndCount);
router.get("/singlePlan", findPlanDetails);
router.get("/allSubscriptions", findAllAssignedSubscriptions);
router.get("/corporateDetails", findCorporateDetails);
router.post("/payment",validateSoftwaresPayment, payment);

module.exports = router;
