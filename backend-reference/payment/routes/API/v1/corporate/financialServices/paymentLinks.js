const express = require('express');
const router = express.Router();

const multer = require('multer');

const paymentLinks = require("../../../../../controllers/corporate/paymentLinks");
const nupayOnboarding = require("../../../../../controllers/corporate/paymentLinks/nupayOnboarding");
const nupayCollect = require("../../../../../controllers/corporate/paymentLinks/nupayCollect");
// F-PAY-07: VA load/unload routes disabled — import no longer used.
// const virtualAccount = require("../../../../../controllers/corporate/virtualAccount");
const verifyPaymentLinkOnboardingCompleted = require("../../../../../middlewares/verifyPaymentLinkOnboardingCompleted");
const {
  validateStep1,
  validatePanStep,
  validateBankStep,
  validateSendPhoneOtp,
  validateVerifyPhoneOtp,
  validateVerifyBank,
  validateStep2,
  validateCreatePaymentLink,
  validateCreateNupayCollect,
  validateCreateDynamicQr,
  validateCreateEnachMandate,
  validateExecuteEnachMandate,
  // validateSettlementRequest, // F-PAY-26: settlement route disabled
  validateGetTransactions,
  validateUpdateVirtualAccount,
} = require("../../../../../middlewares/validatePaymentLink");
const {
  validateVirtualAccountStatement,
} = require("../../../../../utils/queryValidation");

// ── Onboarding Routes (Open) ────────────────────────────────────────────────
router.get('/onboarding/bank-details/export/:type', paymentLinks.exportBankDetailsPdf);
router.get('/onboarding/profile-context', paymentLinks.getOnboardingProfileContext);
router.get('/onboarding/status', paymentLinks.getOnboardingStatus);
router.post('/onboarding/verify-bank', validateVerifyBank, paymentLinks.verifyBankNameAndIfsc);
router.post('/onboarding/step-1', validateStep1, paymentLinks.saveOnboardingStep1);
router.post('/onboarding/step-pan', validatePanStep, paymentLinks.saveOnboardingPanStep);
router.post('/onboarding/step-bank', validateBankStep, paymentLinks.saveOnboardingBankStep);
router.post('/onboarding/phone-otp/send', validateSendPhoneOtp, paymentLinks.sendPhoneOtp);
router.post('/onboarding/phone-otp/verify', validateVerifyPhoneOtp, paymentLinks.verifyPhoneOtp);
router.post('/onboarding/step-2', validateStep2, paymentLinks.saveOnboardingStep2);

// NuPay onboarding — docs are staged via upload-doc, then submit sends their URLs as JSON.
const nupayDocUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }).single('file');
router.get('/onboarding/nupay/field-spec', nupayOnboarding.getNupayFieldSpec);
router.post('/onboarding/nupay/verify-bank', nupayOnboarding.verifyNupayBank);
router.post('/onboarding/nupay/upload-doc', nupayDocUpload, nupayOnboarding.uploadNupayOnboardingDoc);
router.post('/onboarding/nupay/submit', nupayOnboarding.submitNupayOnboarding);

// ── Guarded Payment Links Routes ────────────────────────────────────────────
router.use(verifyPaymentLinkOnboardingCompleted);

router.post('/',validateCreatePaymentLink, paymentLinks.createPaymentLink);
// NuPay Collection 360 create-link (separate from the Decentro route above)
router.post('/nupay/collect', validateCreateNupayCollect, nupayCollect.createNupayCollectRequest);
router.post('/qr', validateCreateDynamicQr, paymentLinks.createDynamicQr);
router.post('/upi-collect-request', paymentLinks.issueCollectRequest);
router.post('/enach-mandate', validateCreateEnachMandate, paymentLinks.createEnachMandate);
router.get('/enach-mandate', paymentLinks.getEnachMandates);
router.get('/enach-mandate/:reference_id/status', paymentLinks.getEnachMandateStatus);
router.post('/enach-mandate/:reference_id/manage', paymentLinks.manageEnachMandate);
router.post(
  '/enach-mandate/:reference_id/execute',
  validateExecuteEnachMandate,
  paymentLinks.executeEnachMandatePayment
);
router.get('/enach-mandate/:reference_id/executions', paymentLinks.getEnachMandateExecutions);
router.get('/virtual-account/details', paymentLinks.getVirtualAccountDetails)
router.get('/virtual-account/balance', paymentLinks.getVirtualAccountBalance)
router.get('/virtual-account/statement', validateVirtualAccountStatement, paymentLinks.getVirtualAccountStatement)
router.get('/virtual-account/statement/export', validateVirtualAccountStatement, paymentLinks.exportVirtualAccountStatement)
router.put('/virtual-account', validateUpdateVirtualAccount, paymentLinks.updateVirtualAccount)
router.delete('/virtual-account', paymentLinks.deactivateVirtualAccount)
router.post('/virtual-account/update-balance', paymentLinks.loadUnloadVirtualAccount)

// F-PAY-07: VA load/unload is FE-orphaned (nothing navigates to it) and trusts a client-supplied
// virtualAccountNumber with an unlocked balance check (BOLA + double-spend) — disabled for safety (Decentro).
// router.post('/virtual-account/load', virtualAccount.loadFunds)
// router.post('/virtual-account/unload', virtualAccount.unloadFunds)
// router.get('/virtual-account/load-unload', virtualAccount.listLoadUnload)
// router.get('/virtual-account/load-unload/:id/status', virtualAccount.getLoadUnloadStatus)
// router.get('/virtual-account/load-unload/:id', virtualAccount.getLoadUnloadById)
router.get("/dashboard",paymentLinks.getDashboardData)
router.get("/transactions", validateGetTransactions, paymentLinks.getTransactions)
router.get("/transactions/export/:type", paymentLinks.exportTransactionsReport)
router.get("/transactions/invoice/export/:type", paymentLinks.exportInvoiceTransactionsReport)
router.get("/transactions/invoice/:invoiceId/pdf", paymentLinks.exportInvoicePdf)
router.get("/transactions/invoice/:id", paymentLinks.getInvoiceTransactionDetail)
router.get("/transactions/:id", paymentLinks.getTransactionDetail)
// F-PAY-26: settlement endpoints are FE-orphaned (nothing navigates to VirtualAccountStatement) — disabled for safety (Decentro money path).
// router.post("/settlement/request", validateSettlementRequest, paymentLinks.createSettlementRequest)
// router.get("/settlement/requests", paymentLinks.getSettlementRequests)


module.exports = router;
