const express = require('express');
const router = express.Router({ mergeParams: true });

const controller = require('../../../../controllers/corporate/ctrlPay');
const { CTRLPAY_MESSAGES, CTRLPAY_SERVICE_LABEL } = require('../../../../constants/ctrlPay');
const { requireCorporateOwner } = require('../../../../middlewares/requireCorporateOwner');
const { verifyUser } = require('../../../../middlewares/verifySubCorporate');
const {
    validateCtrlPayConsent,
    validateCtrlPayDocumentParams,
    validateCtrlPayDocumentUpload,
    validateCtrlPayOtp,
    validateCtrlPayPanSearch,
    validateCtrlPaySenderAccount,
    validateCtrlPaySenderAccountParams,
    validateCtrlPaySignInCallback,
    validateCtrlPayStatement,
    validateCtrlPaySubmit,
    validateCtrlPayTransactionFilters,
} = require('../../../../validations/ctrlPay');

router.use(requireCorporateOwner(CTRLPAY_MESSAGES.ownerOnly));
router.use(verifyUser(CTRLPAY_SERVICE_LABEL));

router.post('/auth/start', controller.startSignIn);
router.post('/auth/callback', validateCtrlPaySignInCallback, controller.completeSignIn);
router.post('/auth/disconnect', controller.disconnect);

router.get('/status', controller.getStatus);
router.get('/onboarding/consent', controller.getConsent);
router.post('/onboarding/consent', validateCtrlPayConsent, controller.recordConsent);
router.post('/onboarding/pan-search', validateCtrlPayPanSearch, controller.searchPan);
router.post('/onboarding/ckyc-otp', controller.sendCkycOtp);
router.post('/onboarding/ckyc-otp/resend', controller.resendCkycOtp);
router.post('/onboarding/ckyc-otp/verify', validateCtrlPayOtp, controller.verifyCkycOtp);
router.get('/onboarding/documents', controller.getDocuments);
router.post('/onboarding/documents', validateCtrlPayDocumentUpload, controller.uploadDocument);
router.delete('/onboarding/documents/:fileName', validateCtrlPayDocumentParams, controller.withdrawDocument);
router.post('/onboarding/submit', validateCtrlPaySubmit, controller.submitApplication);
router.post('/onboarding/phone-otp', controller.sendPhoneOtp);
router.post('/onboarding/phone-otp/verify', validateCtrlPayOtp, controller.verifyPhoneOtp);
router.post('/onboarding/enter-dashboard', controller.enterDashboard);

router.get('/wallet/overview', controller.getWalletOverview);
router.get('/wallet/virtual-account', controller.getVirtualAccount);
router.get('/wallet/sender-accounts', controller.listSenderAccounts);
router.post('/wallet/sender-accounts', validateCtrlPaySenderAccount, controller.addSenderAccount);
router.delete(
    '/wallet/sender-accounts/:accountNumber',
    validateCtrlPaySenderAccountParams,
    controller.removeSenderAccount
);
router.get('/wallet/transactions', validateCtrlPayTransactionFilters, controller.listTransactions);
router.get('/wallet/transactions/export', validateCtrlPayTransactionFilters, controller.exportTransactions);
router.get('/wallet/statement', validateCtrlPayStatement, controller.getStatement);
router.get('/wallet/profile', controller.getProfile);

module.exports = router;
