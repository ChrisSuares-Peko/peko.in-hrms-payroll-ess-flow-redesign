const express = require("express");
const router = express.Router({ mergeParams: true });
const {
    getServicesTypeConfig,
    updateServicesTypeConfig,
    listAccountingServices,
    getAccountingService,
    updateAccountingServiceCommission,
    updateAccountingServiceCommissionStatus,
    updateAccountingServiceVendor,
    getAccountingServicePlans,
    getAccountingServiceAddOns,
    getAccountingServiceCommissionModes,
    updateAccountingServiceAddOn,
    updateAccountingServiceAddOnCommissionStatus,
    updateAccountingServicePlanCommission,
    updateAccountingServicePlanCommissionBulk,
    updateAccountingServicePlanCommissionStatus,
    updateAccountingServiceCashbackBulk,
    updateCashbackSurchargeStatus,
    createAccountingCashback,
    updateAccountingCashback,
} = require("../../../../controllers/admin/accounting");
const { getAccountingDashboard } = require("../../../../controllers/admin/accountingDashboard");
const {
    listConfigAuditLogs,
    exportConfigAuditLogs,
} = require("../../../../controllers/admin/configAuditLog");
const {
    getAccountingGoLiveDate,
    updateAccountingGoLiveDate,
} = require("../../../../controllers/admin/accountingPeriod");
const { listOtherSales, exportOtherSales } = require("../../../../controllers/admin/otherSales");
const {
    listThirdPartySales,
    exportThirdPartySales,
} = require("../../../../controllers/admin/thirdPartySales");
const {
    listPaymentLinkCharges,
    updateDefaultPaymentLinkCharge,
    updateCorporatePaymentLinkCharge,
    removeCorporatePaymentLinkCharge,
} = require("../../../../controllers/admin/thirdPartyConfiguration");
const { validatePaymentLinkCharge } = require("../../../../utils/apiValidation");
const {
    validatePaymentLinkChargesQuery,
    validatePaymentLinkChargeParams,
} = require("../../../../utils/queryValidation");
const { requireExportFormat } = require("../../../../utils/tableExport");
const {
    listApprovalPartners,
    listPartnerApprovals,
    getServiceApproval,
    decideServiceApprovals,
    getServiceApprovalGate,
    updateServiceApprovalGate,
} = require("../../../../controllers/admin/serviceApprovals");
const {
    listPartnerLedger,
    getPartnerLedger,
    listPartnerTransactions,
    exportPartnerTransactions,
    listPartnerSubscriptions,
    exportPartnerSubscriptions,
    listPartnerPayouts,
    exportPartnerPayouts,
    getPartnerPayoutSuggestion,
    createPartnerPayout,
    createPartnerOpeningBalance,
    reversePartnerPayout,
    updatePartnerPayout,
    deletePartnerPayout,
    updatePartnerOpeningBalance,
    deletePartnerOpeningBalance,
    listPartnerDebitNotes,
    exportPartnerDebitNotes,
    createPartnerDebitNote,
    reversePartnerDebitNote,
    updatePartnerDebitNote,
    deletePartnerDebitNote,
    tagPartnerPayoutBooks,
    tagPartnerDebitNoteBooks,
    getPartnerStatement,
    exportPartnerStatement,
    exportPartnerStatementPdf,
} = require("../../../../controllers/admin/partnerLedger");
const {
    listPaymentGatewayLedger,
    getPaymentGatewayLedger,
    listPaymentGatewayTransactions,
    exportPaymentGatewayTransactions,
    listPaymentGatewaySettlements,
    exportPaymentGatewayReceipts,
    exportPaymentGatewayFees,
    getPaymentGatewaySettlementSuggestion,
    createPaymentGatewaySettlement,
    createPaymentGatewayFee,
    createPaymentGatewayOpeningBalance,
    reversePaymentGatewaySettlement,
    reversePaymentGatewayFee,
    updatePaymentGatewaySettlement,
    deletePaymentGatewaySettlement,
    updatePaymentGatewayFee,
    deletePaymentGatewayFee,
    updatePaymentGatewayOpeningBalance,
    deletePaymentGatewayOpeningBalance,
    tagPaymentGatewaySettlementBooks,
    tagPaymentGatewayFeeBooks,
    getPaymentGatewayStatement,
    exportPaymentGatewayStatement,
    exportPaymentGatewayStatementPdf,
} = require("../../../../controllers/admin/paymentGatewayLedger");
const {
    listVendorLedger,
    getVendorLedger,
    listVendorTransactions,
    exportVendorTransactions,
    listVendorCommissions,
    exportVendorCommissions,
    getVendorStatement,
    exportVendorStatement,
    exportVendorStatementPdf,
    listVendorDeposits,
    exportVendorDeposits,
    createVendorDeposit,
    createVendorOpeningBalance,
    reverseVendorDeposit,
    updateVendorDeposit,
    deleteVendorDeposit,
    updateVendorOpeningBalance,
    deleteVendorOpeningBalance,
    listVendorCreditNotes,
    exportVendorCreditNotes,
    createVendorCreditNote,
    reverseVendorCreditNote,
    updateVendorCreditNote,
    deleteVendorCreditNote,
    createVendorCommission,
    reverseVendorCommission,
    updateVendorCommission,
    deleteVendorCommission,
    tagVendorDepositBooks,
    tagVendorCreditNoteBooks,
    tagVendorCommissionBooks,
    downloadVendorCommissionInvoice,
    listVendorCostOfSales,
    exportVendorCostOfSales,
    createVendorCostOfSales,
    reverseVendorCostOfSales,
    updateVendorCostOfSales,
    deleteVendorCostOfSales,
    tagVendorCostOfSalesBooks,
    listVendorDebitNotes,
    exportVendorDebitNotes,
    createVendorDebitNote,
    reverseVendorDebitNote,
    updateVendorDebitNote,
    deleteVendorDebitNote,
    tagVendorDebitNoteBooks,
    downloadVendorCreditNote,
} = require("../../../../controllers/admin/vendorLedger");
const {
    searchCommissionInvoices,
    getCommissionInvoice,
    previewCommissionInvoice,
    updateCommissionInvoiceBilledTo,
    sendCommissionInvoice,
} = require("../../../../controllers/admin/vendorCommissionInvoices");
const {
    listSubscriberLedger,
    getSubscriberLedger,
    listSubscriberTransactions,
    exportSubscriberTransactions,
    listSubscriberWallet,
    exportSubscriberWallet,
    listSubscriberBills,
    exportSubscriberBills,
    downloadSubscriberReceipt,
    downloadSubscriberFullInvoice,
    downloadSubscriberPekoInvoice,
} = require("../../../../controllers/admin/subscriberLedger");
const {
    getManualJournal,
    listManualJournalAccounts,
    previewManualJournal,
    generateManualJournalSplit,
    recordManualJournal,
} = require("../../../../controllers/admin/manualJournal");
const {
    validateServicesTypeConfig,
    validateAccountingServiceCommission,
    validateCommissionConfiguredStatus,
    validateAccountingServicePlanCommissionBulk,
    validateAccountingServiceCashbackBulk,
    validateSurchargeConfiguredStatus,
    validateAccountingServiceVendor,
    validateVendorDeposit,
    validateVendorOpeningBalance,
    validateVendorCreditNote,
    validateVendorCommission,
    validateVendorCostOfSales,
    validateVendorDebitNote,
    validateCommissionInvoiceBilledTo,
    validateCommissionInvoicePreview,
    validateCommissionInvoiceSend,
    validatePartnerDebitNote,
    validatePartnerPayout,
    validatePaymentGatewaySettlement,
    validatePaymentGatewayFee,
    validateLedgerOpeningBalance,
    validateLedgerVoid,
    validateVendorDepositEdit,
    validatePartnerPayoutEdit,
    validatePaymentGatewaySettlementEdit,
    validatePaymentGatewayFeeEdit,
    validateLedgerOpeningBalanceEdit,
    validateLedgerEntryEdit,
    validateBooksTag,
    validateAccountingGoLiveDate,
    validateServiceApprovalDecision,
    validateServiceApprovalGate,
    validateManualJournalParams,
    validateManualJournalSetup,
    validateManualJournalPreview,
    validateManualJournalEntry,
    validateCashback,
    validateServiceClassificationBulk,
} = require("../../../../utils/apiValidation");
const {
    validateAccountingServicesQuery,
    validateAccountingDashboardQuery,
    validateAccountingServicePlansQuery,
    validateVendorLedgerQuery,
    validateVendorLedgerTabQuery,
    validateCommissionInvoiceSearchQuery,
    validateVendorLedgerDetailQuery,
    validateSubscriberLedgerQuery,
    validateLedgerTabQuery,
    validateLedgerDetailQuery,
    validateOtherSalesQuery,
    validateThirdPartySalesQuery,
    validatePartnerLedgerQuery,
    validatePaymentGatewayLedgerQuery,
    validatePaymentGatewaySettlementQuery,
    validateServiceApprovalParams,
    validateServiceApprovalsQuery,
    validateServiceApprovalNodeQuery,
    validateConfigAuditLogsQuery,
} = require("../../../../utils/queryValidation");
const {
    requirePermission,
    requireAnyPermission,
    requireCategoryAccess,
    requireAdminRole,
} = require("../../../../middlewares/requirePermission");
const {
    listServiceClassification,
    classifyService,
    classifyServices,
    listClassificationOptions,
} = require("../../../../controllers/admin/serviceClassification");
const { validateServiceClassification } = require("../../../../utils/apiValidation");
const {
    validateServiceClassificationParams,
    validateServiceClassificationQuery,
} = require("../../../../utils/queryValidation");

const requireServiceClassificationWrite = requirePermission({
    category: "Settings",
    group: "Services",
    service: "Service Classification",
    action: "update",
});

const requireVendorLedgerWrite = requirePermission({
    category: "Accounting",
    group: "Ledgers",
    service: "Vendors",
    action: "update",
});

const requirePartnerLedgerWrite = requirePermission({
    category: "Accounting",
    group: "Ledgers",
    service: "Partners",
    action: "update",
});

const requirePaymentGatewayLedgerWrite = requirePermission({
    category: "Accounting",
    group: "Ledgers",
    service: "Payment Gateways",
    action: "update",
});

const requireApprovalsWrite = requirePermission({
    category: "Accounting",
    group: "Others",
    service: "Approvals",
    action: "update",
});

const requireManualOperationsWrite = requirePermission({
    category: "Accounting",
    group: "Others",
    service: "Manual Operations",
    action: "update",
});

const requireThirdPartyConfigurationRead = requirePermission({
    category: "Accounting",
    group: "Operations",
    service: "Third Party Configuration",
    action: "view",
});

const requireThirdPartyConfigurationWrite = requirePermission({
    category: "Accounting",
    group: "Operations",
    service: "Third Party Configuration",
    action: "update",
});
const requireApprovalsRead = requireAnyPermission([
    { category: "Accounting", group: "Others", service: "Approvals", action: "view" },
    { category: "Settings", group: "Services", service: "Accounting Approvals", action: "view" },
]);

const requireAccountingAccess = requireCategoryAccess("Accounting");
// Service Classification and Accounting Approvals belong to Settings and keep their own checks.
const SETTINGS_OWNED_PATH = /^\/(services-type-config|approvals)(\/|$)/;
router.use((req, res, next) =>
    SETTINGS_OWNED_PATH.test(req.path) ? next() : requireAccountingAccess(req, res, next)
);

router.get("/dashboard", validateAccountingDashboardQuery, getAccountingDashboard);
router.get("/config-audit-logs", validateConfigAuditLogsQuery, listConfigAuditLogs);
router.get(
    "/config-audit-logs/export/:format",
    requireExportFormat,
    validateConfigAuditLogsQuery,
    exportConfigAuditLogs
);
router.get("/go-live-date", getAccountingGoLiveDate);
router.put(
    "/go-live-date",
    requireAdminRole,
    validateAccountingGoLiveDate,
    updateAccountingGoLiveDate
);
router.get("/approvals/gate", getServiceApprovalGate);
router.put(
    "/approvals/gate",
    requireAdminRole,
    validateServiceApprovalGate,
    updateServiceApprovalGate
);
router.put(
    "/approvals/decide",
    requireApprovalsWrite,
    validateServiceApprovalDecision,
    decideServiceApprovals
);
router.get("/approvals/partners", requireApprovalsRead, listApprovalPartners);
router.get("/manual-operations/accounts", listManualJournalAccounts);
router.get(
    "/manual-operations/journal/:corporateTxnId",
    validateManualJournalParams,
    getManualJournal
);
router.post(
    "/manual-operations/journal/:corporateTxnId/:journalKey/split",
    requireManualOperationsWrite,
    validateManualJournalParams,
    validateManualJournalSetup,
    generateManualJournalSplit
);
router.post(
    "/manual-operations/journal/:corporateTxnId/:journalKey/preview",
    requireManualOperationsWrite,
    validateManualJournalParams,
    validateManualJournalPreview,
    previewManualJournal
);
router.post(
    "/manual-operations/journal/:corporateTxnId/:journalKey",
    requireManualOperationsWrite,
    validateManualJournalParams,
    validateManualJournalEntry,
    recordManualJournal
);
router.get(
    "/approvals/partners/:partnerPermissionId/node",
    requireApprovalsRead,
    validateServiceApprovalParams,
    validateServiceApprovalNodeQuery,
    getServiceApproval
);
router.get(
    "/approvals/partners/:partnerPermissionId",
    requireApprovalsRead,
    validateServiceApprovalParams,
    validateServiceApprovalsQuery,
    listPartnerApprovals
);
router.get("/services-type-config", getServicesTypeConfig);
router.get(
    "/services-type-config/operators",
    validateServiceClassificationQuery,
    listServiceClassification
);
router.put(
    "/services-type-config",
    requireServiceClassificationWrite,
    validateServicesTypeConfig,
    updateServicesTypeConfig
);
router.patch(
    "/services-type-config/:accessKey",
    requireServiceClassificationWrite,
    validateServiceClassificationParams,
    validateServiceClassification,
    classifyService
);
router.get("/services-type-config/options", listClassificationOptions);
router.post(
    "/services-type-config/classify",
    requireServiceClassificationWrite,
    validateServiceClassificationBulk,
    classifyServices
);
router.get("/services", validateAccountingServicesQuery, listAccountingServices);
router.get("/services/:accessKey", getAccountingService);
router.put(
    "/services/commission/:id",
    validateAccountingServiceCommission,
    updateAccountingServiceCommission
);
router.patch(
    "/services/commission-status/:id",
    validateCommissionConfiguredStatus,
    updateAccountingServiceCommissionStatus
);
router.put(
    "/services/vendor/:id",
    validateAccountingServiceVendor,
    updateAccountingServiceVendor
);
router.get(
    "/services/:accessKey/plans",
    validateAccountingServicePlansQuery,
    getAccountingServicePlans
);
router.get("/services/:accessKey/commission-modes", getAccountingServiceCommissionModes);
router.get("/services/:accessKey/add-ons", getAccountingServiceAddOns);
router.put(
    "/services/:accessKey/add-ons/:addOnType",
    validateAccountingServiceCommission,
    updateAccountingServiceAddOn
);
router.patch(
    "/services/:accessKey/add-ons/:addOnType/commission-status",
    validateCommissionConfiguredStatus,
    updateAccountingServiceAddOnCommissionStatus
);
router.put(
    "/services/:accessKey/plans/bulk-commission",
    validateAccountingServicePlanCommissionBulk,
    updateAccountingServicePlanCommissionBulk
);
router.put(
    "/services/:accessKey/plans/:planId",
    validateAccountingServiceCommission,
    updateAccountingServicePlanCommission
);
router.patch(
    "/services/:accessKey/plans/:planId/commission-status",
    validateCommissionConfiguredStatus,
    updateAccountingServicePlanCommissionStatus
);
router.put(
    "/cashbacks/bulk",
    validateAccountingServiceCashbackBulk,
    updateAccountingServiceCashbackBulk
);
router.patch(
    "/cashbacks/:id/surcharge-status",
    validateSurchargeConfiguredStatus,
    updateCashbackSurchargeStatus
);
router.post("/cashbacks", validateCashback, createAccountingCashback);
router.put("/cashbacks/:id", validateCashback, updateAccountingCashback);

router.get("/other-sales", validateOtherSalesQuery, listOtherSales);
router.get("/other-sales/export/:format", requireExportFormat, validateOtherSalesQuery, exportOtherSales);
router.get("/third-party-sales/:kind", validateThirdPartySalesQuery, listThirdPartySales);
router.get(
    "/third-party-sales/:kind/export/:format",
    requireExportFormat,
    validateThirdPartySalesQuery,
    exportThirdPartySales
);

router.get(
    "/third-party-configuration/payment-links",
    requireThirdPartyConfigurationRead,
    validatePaymentLinkChargesQuery,
    listPaymentLinkCharges
);
router.put(
    "/third-party-configuration/payment-links/default",
    requireThirdPartyConfigurationWrite,
    validatePaymentLinkCharge,
    updateDefaultPaymentLinkCharge
);
router.put(
    "/third-party-configuration/payment-links/corporates/:credentialId",
    requireThirdPartyConfigurationWrite,
    validatePaymentLinkChargeParams,
    validatePaymentLinkCharge,
    updateCorporatePaymentLinkCharge
);
router.delete(
    "/third-party-configuration/payment-links/corporates/:credentialId",
    requireThirdPartyConfigurationWrite,
    validatePaymentLinkChargeParams,
    removeCorporatePaymentLinkCharge
);

router.get("/vendors", validateVendorLedgerQuery, listVendorLedger);
router.get("/vendors/:vendorId", validateVendorLedgerDetailQuery, getVendorLedger);
router.get(
    "/vendors/:vendorId/transactions",
    validateVendorLedgerTabQuery,
    listVendorTransactions
);
router.get(
    "/vendors/:vendorId/transactions/export/:format",
    requireExportFormat,
    validateVendorLedgerTabQuery,
    exportVendorTransactions
);
router.get("/vendors/:vendorId/commissions", validateVendorLedgerTabQuery, listVendorCommissions);
router.get(
    "/vendors/:vendorId/commissions/export/:format",
    requireExportFormat,
    validateVendorLedgerTabQuery,
    exportVendorCommissions
);
router.post(
    "/vendors/:vendorId/commissions",
    requireVendorLedgerWrite,
    validateVendorCommission,
    createVendorCommission
);
router.patch(
    "/vendors/:vendorId/commissions/:id/reverse",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    reverseVendorCommission
);
router.put(
    "/vendors/:vendorId/commissions/:id",
    requireVendorLedgerWrite,
    validateLedgerEntryEdit,
    updateVendorCommission
);
router.delete(
    "/vendors/:vendorId/commissions/:id",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    deleteVendorCommission
);
router.patch(
    "/vendors/:vendorId/commissions/:id/books",
    requireVendorLedgerWrite,
    validateBooksTag,
    tagVendorCommissionBooks
);
router.get(
    "/vendors/:vendorId/commissions/:source/:id/invoice",
    downloadVendorCommissionInvoice
);
router.get("/commission-invoices", validateCommissionInvoiceSearchQuery, searchCommissionInvoices);
router.get("/vendors/:vendorId/commissions/:source/:id/invoice/details", getCommissionInvoice);
router.post(
    "/vendors/:vendorId/commissions/:source/:id/invoice/preview",
    validateCommissionInvoicePreview,
    previewCommissionInvoice
);
router.put(
    "/vendors/:vendorId/commissions/:source/:id/invoice/billed-to",
    requireVendorLedgerWrite,
    validateCommissionInvoiceBilledTo,
    updateCommissionInvoiceBilledTo
);
router.post(
    "/vendors/:vendorId/commissions/:source/:id/invoice/send",
    requireVendorLedgerWrite,
    validateCommissionInvoiceSend,
    sendCommissionInvoice
);
router.get("/vendors/:vendorId/cost-of-sales", validateVendorLedgerTabQuery, listVendorCostOfSales);
router.get(
    "/vendors/:vendorId/cost-of-sales/export/:format",
    requireExportFormat,
    validateVendorLedgerTabQuery,
    exportVendorCostOfSales
);
router.post(
    "/vendors/:vendorId/cost-of-sales",
    requireVendorLedgerWrite,
    validateVendorCostOfSales,
    createVendorCostOfSales
);
router.patch(
    "/vendors/:vendorId/cost-of-sales/:id/reverse",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    reverseVendorCostOfSales
);
router.put(
    "/vendors/:vendorId/cost-of-sales/:id",
    requireVendorLedgerWrite,
    validateLedgerEntryEdit,
    updateVendorCostOfSales
);
router.delete(
    "/vendors/:vendorId/cost-of-sales/:id",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    deleteVendorCostOfSales
);
router.patch(
    "/vendors/:vendorId/cost-of-sales/:id/books",
    requireVendorLedgerWrite,
    validateBooksTag,
    tagVendorCostOfSalesBooks
);
router.get("/vendors/:vendorId/debit-notes", validateVendorLedgerTabQuery, listVendorDebitNotes);
router.get(
    "/vendors/:vendorId/debit-notes/export/:format",
    requireExportFormat,
    validateVendorLedgerTabQuery,
    exportVendorDebitNotes
);
router.post(
    "/vendors/:vendorId/debit-notes",
    requireVendorLedgerWrite,
    validateVendorDebitNote,
    createVendorDebitNote
);
router.patch(
    "/vendors/:vendorId/debit-notes/:id/reverse",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    reverseVendorDebitNote
);
router.put(
    "/vendors/:vendorId/debit-notes/:id",
    requireVendorLedgerWrite,
    validateLedgerEntryEdit,
    updateVendorDebitNote
);
router.delete(
    "/vendors/:vendorId/debit-notes/:id",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    deleteVendorDebitNote
);
router.patch(
    "/vendors/:vendorId/debit-notes/:id/books",
    requireVendorLedgerWrite,
    validateBooksTag,
    tagVendorDebitNoteBooks
);
router.get("/vendors/:vendorId/statement", validateVendorLedgerTabQuery, getVendorStatement);
router.get(
    "/vendors/:vendorId/statement/export",
    validateVendorLedgerTabQuery,
    exportVendorStatement
);
router.get(
    "/vendors/:vendorId/statement/pdf",
    validateVendorLedgerTabQuery,
    exportVendorStatementPdf
);
router.get("/vendors/:vendorId/deposits", validateVendorLedgerTabQuery, listVendorDeposits);
router.get(
    "/vendors/:vendorId/deposits/export/:format",
    requireExportFormat,
    validateVendorLedgerTabQuery,
    exportVendorDeposits
);
router.post(
    "/vendors/:vendorId/deposits",
    requireVendorLedgerWrite,
    validateVendorDeposit,
    createVendorDeposit
);
router.post(
    "/vendors/:vendorId/opening-balance",
    requireVendorLedgerWrite,
    validateVendorOpeningBalance,
    createVendorOpeningBalance
);
router.patch(
    "/vendors/:vendorId/deposits/:id/reverse",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    reverseVendorDeposit
);
router.put(
    "/vendors/:vendorId/deposits/:id",
    requireVendorLedgerWrite,
    validateVendorDepositEdit,
    updateVendorDeposit
);
router.delete(
    "/vendors/:vendorId/deposits/:id",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    deleteVendorDeposit
);
router.patch(
    "/vendors/:vendorId/deposits/:id/books",
    requireVendorLedgerWrite,
    validateBooksTag,
    tagVendorDepositBooks
);
router.put(
    "/vendors/:vendorId/opening-balance/:id",
    requireVendorLedgerWrite,
    validateLedgerOpeningBalanceEdit,
    updateVendorOpeningBalance
);
router.delete(
    "/vendors/:vendorId/opening-balance/:id",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    deleteVendorOpeningBalance
);
router.get("/vendors/:vendorId/credit-notes", validateVendorLedgerTabQuery, listVendorCreditNotes);
router.get(
    "/vendors/:vendorId/credit-notes/export/:format",
    requireExportFormat,
    validateVendorLedgerTabQuery,
    exportVendorCreditNotes
);
router.post(
    "/vendors/:vendorId/credit-notes",
    requireVendorLedgerWrite,
    validateVendorCreditNote,
    createVendorCreditNote
);
router.patch(
    "/vendors/:vendorId/credit-notes/:id/reverse",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    reverseVendorCreditNote
);
router.put(
    "/vendors/:vendorId/credit-notes/:id",
    requireVendorLedgerWrite,
    validateLedgerEntryEdit,
    updateVendorCreditNote
);
router.delete(
    "/vendors/:vendorId/credit-notes/:id",
    requireVendorLedgerWrite,
    validateLedgerVoid,
    deleteVendorCreditNote
);
router.patch(
    "/vendors/:vendorId/credit-notes/:id/books",
    requireVendorLedgerWrite,
    validateBooksTag,
    tagVendorCreditNoteBooks
);
router.get(
    "/vendors/:vendorId/credit-notes/:source/:id/credit-note",
    downloadVendorCreditNote
);

router.get("/subscribers", validateSubscriberLedgerQuery, listSubscriberLedger);
router.get("/subscribers/:credentialId", validateLedgerDetailQuery, getSubscriberLedger);
router.get(
    "/subscribers/:credentialId/transactions",
    validateLedgerTabQuery,
    listSubscriberTransactions
);
router.get(
    "/subscribers/:credentialId/transactions/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportSubscriberTransactions
);
router.get("/subscribers/:credentialId/wallet", validateLedgerTabQuery, listSubscriberWallet);
router.get(
    "/subscribers/:credentialId/wallet/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportSubscriberWallet
);
router.get("/subscribers/:credentialId/bills", validateLedgerTabQuery, listSubscriberBills);
router.get(
    "/subscribers/:credentialId/bills/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportSubscriberBills
);
router.get("/subscribers/:credentialId/transactions/:orderId/receipt", downloadSubscriberReceipt);
router.get("/subscribers/:credentialId/bills/:orderId/invoice", downloadSubscriberFullInvoice);
router.get("/subscribers/:credentialId/bills/:orderId/peko-invoice", downloadSubscriberPekoInvoice);

router.get("/partners", validatePartnerLedgerQuery, listPartnerLedger);
router.get("/partners/:partnerId", validateLedgerDetailQuery, getPartnerLedger);
router.get(
    "/partners/:partnerId/transactions",
    validateLedgerTabQuery,
    listPartnerTransactions
);
router.get(
    "/partners/:partnerId/transactions/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportPartnerTransactions
);
router.get(
    "/partners/:partnerId/own-subscriptions",
    validateLedgerTabQuery,
    listPartnerSubscriptions
);
router.get(
    "/partners/:partnerId/own-subscriptions/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportPartnerSubscriptions
);
router.get("/partners/:partnerId/payments", validateLedgerTabQuery, listPartnerPayouts);
router.get(
    "/partners/:partnerId/payments/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportPartnerPayouts
);
router.get("/partners/:partnerId/payments/suggestion", getPartnerPayoutSuggestion);
router.post(
    "/partners/:partnerId/payments",
    requirePartnerLedgerWrite,
    validatePartnerPayout,
    createPartnerPayout
);
router.post(
    "/partners/:partnerId/opening-balance",
    requirePartnerLedgerWrite,
    validateLedgerOpeningBalance,
    createPartnerOpeningBalance
);
router.patch(
    "/partners/:partnerId/payments/:id/reverse",
    requirePartnerLedgerWrite,
    validateLedgerVoid,
    reversePartnerPayout
);
router.put(
    "/partners/:partnerId/payments/:id",
    requirePartnerLedgerWrite,
    validatePartnerPayoutEdit,
    updatePartnerPayout
);
router.delete(
    "/partners/:partnerId/payments/:id",
    requirePartnerLedgerWrite,
    validateLedgerVoid,
    deletePartnerPayout
);
router.patch(
    "/partners/:partnerId/payments/:id/books",
    requirePartnerLedgerWrite,
    validateBooksTag,
    tagPartnerPayoutBooks
);
router.put(
    "/partners/:partnerId/opening-balance/:id",
    requirePartnerLedgerWrite,
    validateLedgerOpeningBalanceEdit,
    updatePartnerOpeningBalance
);
router.delete(
    "/partners/:partnerId/opening-balance/:id",
    requirePartnerLedgerWrite,
    validateLedgerVoid,
    deletePartnerOpeningBalance
);
router.get("/partners/:partnerId/debit-notes", validateLedgerTabQuery, listPartnerDebitNotes);
router.get(
    "/partners/:partnerId/debit-notes/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportPartnerDebitNotes
);
router.post(
    "/partners/:partnerId/debit-notes",
    requirePartnerLedgerWrite,
    validatePartnerDebitNote,
    createPartnerDebitNote
);
router.patch(
    "/partners/:partnerId/debit-notes/:id/reverse",
    requirePartnerLedgerWrite,
    validateLedgerVoid,
    reversePartnerDebitNote
);
router.put(
    "/partners/:partnerId/debit-notes/:id",
    requirePartnerLedgerWrite,
    validateLedgerEntryEdit,
    updatePartnerDebitNote
);
router.delete(
    "/partners/:partnerId/debit-notes/:id",
    requirePartnerLedgerWrite,
    validateLedgerVoid,
    deletePartnerDebitNote
);
router.patch(
    "/partners/:partnerId/debit-notes/:id/books",
    requirePartnerLedgerWrite,
    validateBooksTag,
    tagPartnerDebitNoteBooks
);
router.get("/partners/:partnerId/statement", validateLedgerTabQuery, getPartnerStatement);
router.get(
    "/partners/:partnerId/statement/export",
    validateLedgerTabQuery,
    exportPartnerStatement
);
router.get(
    "/partners/:partnerId/statement/pdf",
    validateLedgerTabQuery,
    exportPartnerStatementPdf
);

router.get("/payment-gateways", validatePaymentGatewayLedgerQuery, listPaymentGatewayLedger);
router.get(
    "/payment-gateways/:gatewayId",
    validateLedgerDetailQuery,
    getPaymentGatewayLedger
);
router.get(
    "/payment-gateways/:gatewayId/transactions",
    validateLedgerTabQuery,
    listPaymentGatewayTransactions
);
router.get(
    "/payment-gateways/:gatewayId/transactions/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportPaymentGatewayTransactions
);
router.get(
    "/payment-gateways/:gatewayId/settlements",
    validatePaymentGatewaySettlementQuery,
    listPaymentGatewaySettlements
);
router.get(
    "/payment-gateways/:gatewayId/received/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportPaymentGatewayReceipts
);
router.get(
    "/payment-gateways/:gatewayId/fees/export/:format",
    requireExportFormat,
    validateLedgerTabQuery,
    exportPaymentGatewayFees
);
router.get(
    "/payment-gateways/:gatewayId/settlements/suggestion",
    getPaymentGatewaySettlementSuggestion
);
router.post(
    "/payment-gateways/:gatewayId/settlements",
    requirePaymentGatewayLedgerWrite,
    validatePaymentGatewaySettlement,
    createPaymentGatewaySettlement
);
router.post(
    "/payment-gateways/:gatewayId/fees",
    requirePaymentGatewayLedgerWrite,
    validatePaymentGatewayFee,
    createPaymentGatewayFee
);
router.post(
    "/payment-gateways/:gatewayId/opening-balance",
    requirePaymentGatewayLedgerWrite,
    validateLedgerOpeningBalance,
    createPaymentGatewayOpeningBalance
);
router.patch(
    "/payment-gateways/:gatewayId/fees/:id/reverse",
    requirePaymentGatewayLedgerWrite,
    validateLedgerVoid,
    reversePaymentGatewayFee
);
router.patch(
    "/payment-gateways/:gatewayId/settlements/:id/reverse",
    requirePaymentGatewayLedgerWrite,
    validateLedgerVoid,
    reversePaymentGatewaySettlement
);
router.put(
    "/payment-gateways/:gatewayId/settlements/:id",
    requirePaymentGatewayLedgerWrite,
    validatePaymentGatewaySettlementEdit,
    updatePaymentGatewaySettlement
);
router.delete(
    "/payment-gateways/:gatewayId/settlements/:id",
    requirePaymentGatewayLedgerWrite,
    validateLedgerVoid,
    deletePaymentGatewaySettlement
);
router.patch(
    "/payment-gateways/:gatewayId/settlements/:id/books",
    requirePaymentGatewayLedgerWrite,
    validateBooksTag,
    tagPaymentGatewaySettlementBooks
);
router.put(
    "/payment-gateways/:gatewayId/fees/:id",
    requirePaymentGatewayLedgerWrite,
    validatePaymentGatewayFeeEdit,
    updatePaymentGatewayFee
);
router.delete(
    "/payment-gateways/:gatewayId/fees/:id",
    requirePaymentGatewayLedgerWrite,
    validateLedgerVoid,
    deletePaymentGatewayFee
);
router.patch(
    "/payment-gateways/:gatewayId/fees/:id/books",
    requirePaymentGatewayLedgerWrite,
    validateBooksTag,
    tagPaymentGatewayFeeBooks
);
router.put(
    "/payment-gateways/:gatewayId/opening-balance/:id",
    requirePaymentGatewayLedgerWrite,
    validateLedgerOpeningBalanceEdit,
    updatePaymentGatewayOpeningBalance
);
router.delete(
    "/payment-gateways/:gatewayId/opening-balance/:id",
    requirePaymentGatewayLedgerWrite,
    validateLedgerVoid,
    deletePaymentGatewayOpeningBalance
);
router.get(
    "/payment-gateways/:gatewayId/statement",
    validateLedgerTabQuery,
    getPaymentGatewayStatement
);
router.get(
    "/payment-gateways/:gatewayId/statement/export",
    validateLedgerTabQuery,
    exportPaymentGatewayStatement
);
router.get(
    "/payment-gateways/:gatewayId/statement/pdf",
    validateLedgerTabQuery,
    exportPaymentGatewayStatementPdf
);

module.exports = router;
