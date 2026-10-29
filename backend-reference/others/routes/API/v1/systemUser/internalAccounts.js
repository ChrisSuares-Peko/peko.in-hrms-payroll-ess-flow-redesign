const express = require("express");
const router = express.Router({ mergeParams: true });
const {
    findAllAccounts,
    findAllInternalAccounts,
    addInternalAccounts,
    deleteInternalAccounts,
} = require("../../../../controllers/admin/internalAccounts");
const { validateAddAccounts } = require("../../../../utils/apiValidation");

router.get("/all-accounts", findAllAccounts);
router.get("/", findAllInternalAccounts);
router.post("/", validateAddAccounts, addInternalAccounts);
router.delete("/:id", deleteInternalAccounts);

module.exports = router;
