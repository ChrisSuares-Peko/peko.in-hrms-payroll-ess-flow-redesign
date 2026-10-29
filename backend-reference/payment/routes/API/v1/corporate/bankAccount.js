const express = require("express");
const router = express.Router();
const {
  addDomesticAccount,
  getDomesticAccounts,
  updateDomesticAccount,
  setPrimaryAccount,
  deleteDomesticAccount,
  getVirtualAccounts,
  getEscrowAccounts,
} = require("../../../../controllers/corporate/bankAccount");

// Domestic accounts
router.post("/domestic", addDomesticAccount);
router.get("/domestic", getDomesticAccounts);
router.put("/domestic/:id", updateDomesticAccount);
router.put("/domestic/:id/primary", setPrimaryAccount);
router.delete("/domestic/:id", deleteDomesticAccount);

// Virtual accounts (read-only from Decentro)
router.get("/virtual", getVirtualAccounts);

// Escrow accounts (read-only from Decentro)
router.get("/escrow", getEscrowAccounts);

module.exports = router;
