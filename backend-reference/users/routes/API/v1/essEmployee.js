const express = require("express");
const router = express.Router();
const { validateCreateEssUser, validateUpdateEssEmail } = require("../../../utils/apiValidation");
const { verifyCorporateOwnerOrAdmin } = require("../../../middlewares/verifyCorporateOwnerOrAdmin");
const {
  createEssUser,
  listEssUsers,
  deleteEssUser,
  getEssAccess,
  updateEssAccess,
  updateEssEmail,
} = require("../../../controllers/essEmployee");
const { sanitizeBodyBaseUrl } = require("../../../utils/trustedFrontendUrl");

// Corporate-admin only. An ESS employee's own session (role USER) carries the employer's corporateId, so
// without this it could list colleagues, revoke them, or switch ESS off for the company.
router.post("/user", verifyCorporateOwnerOrAdmin, validateCreateEssUser, sanitizeBodyBaseUrl, createEssUser);
router.put("/user/:employeeId/email", verifyCorporateOwnerOrAdmin, validateUpdateEssEmail, sanitizeBodyBaseUrl, updateEssEmail);
router.get("/users", verifyCorporateOwnerOrAdmin, listEssUsers);
router.delete("/user/:employeeId", verifyCorporateOwnerOrAdmin, deleteEssUser);
router.get("/access", verifyCorporateOwnerOrAdmin, getEssAccess);
router.patch("/access", verifyCorporateOwnerOrAdmin, updateEssAccess);

module.exports = router;
