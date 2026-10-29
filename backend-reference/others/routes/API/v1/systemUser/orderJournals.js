const express = require("express");
const router = express.Router({ mergeParams: true });
const {
    getOrderJournals,
    exportOrderJournals,
    getTransactions,
    getFeeDetails,
    exportFeeDetails,
    getSubscriptionDetails,
    exportSubscriptionDetails,
    resolveJournalAccounts,
    retryJournal,
    retryJournalLineItems,
    retryAllFailed,
    downloadOrderDocument,
} = require("../../../../controllers/admin/orderJournal");
const { requireExportFormat } = require("../../../../utils/tableExport");

router.get("/", getOrderJournals);
router.get("/export/:format", requireExportFormat, exportOrderJournals);
router.get("/transactions", getTransactions);
router.get("/fee-details", getFeeDetails);
router.get("/fee-details/export/:format", requireExportFormat, exportFeeDetails);
router.get("/subscription-details", getSubscriptionDetails);
router.get("/subscription-details/export/:format", requireExportFormat, exportSubscriptionDetails);
router.post("/resolve-accounts", resolveJournalAccounts);
router.get("/:orderId/documents/:recipient/:docType", downloadOrderDocument);
router.put("/:corporateTxnId/journal/:journalKey/retry", retryJournal);
router.put(
    "/:corporateTxnId/journal/:journalKey/retry-line-items",
    retryJournalLineItems
);
router.put("/:corporateTxnId/journal/retry-all-failed", retryAllFailed);

module.exports = router;
