const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  createCoaRule,
  updateCoaRule,
  getAllCoaRules,
  deleteCoaRule,
  changeCoaRuleStatus,
} = require("../../../../controllers/admin/coaRules");

router.post("/", createCoaRule);
router.patch("/status/:id", changeCoaRuleStatus);
router.put("/:id", updateCoaRule);
router.get("/", getAllCoaRules);
router.delete("/:id", deleteCoaRule);

module.exports = router;
