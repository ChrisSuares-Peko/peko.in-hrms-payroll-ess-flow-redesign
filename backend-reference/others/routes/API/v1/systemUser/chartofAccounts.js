const express = require("express");
const {
    createChartofAccounts,
    updateChartOfAccounts,
    listChartOfAccounts,
    getAccountTypes,
    listParentAccounts,
} = require("../../../../controllers/admin/chartofAccount");

const router = express.Router({ mergeParams: true });

router.post("/", createChartofAccounts);
router.put("/:id", updateChartOfAccounts);
router.get("/", listChartOfAccounts);
router.get("/account-types", getAccountTypes);
router.get("/parent-accounts", listParentAccounts);

module.exports = router;
