'use strict';

const auth = require('../../services/ctrlPayAuth');
const documents = require('../../services/ctrlPayDocuments');
const onboarding = require('../../services/ctrlPayOnboarding');
const wallet = require('../../services/ctrlPayWallet');
const { ctrlPayHandler, sendCtrlPayData } = require('../../utils/ctrlPay/errors');

const context = (req) => ({ user: req.user, logTraceId: req.LogTraceId });

const respondWith = (operation, input = () => ({})) =>
    ctrlPayHandler(async (req, res) => {
        sendCtrlPayData(res, await operation({ ...context(req), ...input(req) }));
    });

exports.startSignIn = respondWith(auth.startSignIn);
exports.completeSignIn = respondWith(auth.completeSignIn, (req) => req.body);
exports.disconnect = respondWith(auth.disconnect);

exports.getStatus = respondWith(onboarding.getStatus);
exports.getConsent = respondWith(onboarding.getConsent);
exports.recordConsent = respondWith(onboarding.recordConsent, (req) => req.body);
exports.searchPan = respondWith(onboarding.searchPan, (req) => req.body);
exports.sendCkycOtp = respondWith(onboarding.sendCkycOtp);
exports.resendCkycOtp = respondWith(onboarding.resendCkycOtp);
exports.verifyCkycOtp = respondWith(onboarding.verifyCkycOtp, (req) => req.body);
exports.sendPhoneOtp = respondWith(onboarding.sendPhoneOtp);
exports.verifyPhoneOtp = respondWith(onboarding.verifyPhoneOtp, (req) => req.body);
exports.enterDashboard = respondWith(onboarding.enterDashboard);

exports.getDocuments = respondWith(documents.getDocuments);
exports.uploadDocument = respondWith(documents.uploadDocument, (req) => req.body);
exports.withdrawDocument = respondWith(documents.withdrawDocument, (req) => ({ fileName: req.params.fileName }));
exports.submitApplication = respondWith(documents.submitApplication, (req) => req.body);

exports.getWalletOverview = respondWith(wallet.getOverview);
exports.getVirtualAccount = respondWith(wallet.getVirtualAccount);
exports.listSenderAccounts = respondWith(wallet.listSenderAccounts);
exports.addSenderAccount = respondWith(wallet.addSenderAccount, (req) => req.body);
exports.removeSenderAccount = respondWith(wallet.removeSenderAccount, (req) => ({
    accountNumber: req.params.accountNumber,
}));
exports.listTransactions = respondWith(wallet.listTransactions, (req) => ({ filters: req.query }));
exports.exportTransactions = respondWith(wallet.exportTransactions, (req) => ({ filters: req.query }));
exports.getStatement = respondWith(wallet.getStatement, (req) => req.query);
exports.getProfile = respondWith(wallet.getProfile);
