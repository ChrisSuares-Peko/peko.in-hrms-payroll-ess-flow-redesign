const express = require("express");
const router = express.Router({ mergeParams: true });
const { companyDocumentsFilesUpload } = require("../../../../middlewares/fileUpload");
const { addBeneficiaryHandler, getBeneficiariesHandler, updateBeneficiaryHandler, deleteBeneficiaryHandler } = require("../../../../controllers/corporate/nupayBeneficiary");
const { initiateNupayPayoutHandler, getNupayPayoutStatusHandler } = require("../../../../controllers/corporate/nupayOnboarding");


const {
  getDashboard,
  getTransactions,
  exportTransactions,
  getPayoutStatus,
  downloadPayoutReceipt,
  createRentBill,
  getRentBills,
  getRentBill,
  updateRentBillHandler,
  deleteRentBillHandler,
  createOtherBillHandler,
  getOtherBills,
  getOtherBill,
  updateOtherBillHandler,
  deleteOtherBillHandler,
  createVendorPayoutHandler,
  getVendorPayouts,
  getVendorPayout,
  updateVendorPayoutHandler,
  deleteVendorPayoutHandler,
  createBillPayoutHandler,
  getBillPayouts,
  getBillPayout,
  updateBillPayoutHandler,
  deleteBillPayoutHandler,
} = require("../../../../controllers/corporate/payout");
// GET /payout/dashboard
router.get("/dashboard", getDashboard);

// Transactions
router.get("/transactions", getTransactions);
router.get("/transactions/export", exportTransactions);
router.get("/transactions/:id/status", getPayoutStatus);
router.get("/transactions/:id/receipt", downloadPayoutReceipt);

// Beneficiary CRUD
router.post("/beneficiary", addBeneficiaryHandler);
router.get("/beneficiary", getBeneficiariesHandler);
router.put("/beneficiary/:id", updateBeneficiaryHandler);
router.delete("/beneficiary/:id", deleteBeneficiaryHandler);

// Rent bills
router.post("/rent", companyDocumentsFilesUpload, createRentBill);
router.get("/rent", getRentBills);
router.get("/rent/:id", getRentBill);
router.put("/rent/:id", updateRentBillHandler);
router.delete("/rent/:id", deleteRentBillHandler);

// Other bills
router.post("/bill", companyDocumentsFilesUpload, createOtherBillHandler);
router.get("/bill", getOtherBills);
router.get("/bill/:id", getOtherBill);
router.put("/bill/:id", updateOtherBillHandler);
router.delete("/bill/:id", deleteOtherBillHandler);

// Vendor payouts
router.post("/vendor", companyDocumentsFilesUpload, createVendorPayoutHandler);
router.get("/vendor", getVendorPayouts);
router.get("/vendor/:id", getVendorPayout);
router.put("/vendor/:id", updateVendorPayoutHandler);
router.delete("/vendor/:id", deleteVendorPayoutHandler);

// Bill payouts
router.post("/bill-payout", companyDocumentsFilesUpload, createBillPayoutHandler);
router.get("/bill-payout", getBillPayouts);
router.get("/bill-payout/:id", getBillPayout);
router.put("/bill-payout/:id", updateBillPayoutHandler);
router.delete("/bill-payout/:id", deleteBillPayoutHandler);

// F-PAY-20: dead Decentro VA route (replaced by NuPay) — commented out, not removed.
// router.post("/virtual-account", createVA);

// Initiate payout transfer
router.post("/transfer", initiateNupayPayoutHandler);
router.get("/transfer/:id/status", getNupayPayoutStatusHandler);


module.exports = router;
