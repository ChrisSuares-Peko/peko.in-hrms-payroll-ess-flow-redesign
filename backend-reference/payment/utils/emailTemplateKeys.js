'use strict';

// Registry of admin-managed email template identifiers for the `payment`
// microservice. Like `others`, payment covers several distinct business areas,
// so this uses multiple services rather than a single default — each resolve*
// call passes its own `service` explicitly. Matches AE's own payment registry's
// bare service names.
//
// Add one entry per email as it's migrated — anything not here keeps rendering
// from its local template exactly as before.
const EMAIL_TEMPLATE_SERVICES = {
    BILL_PAYMENT: 'BILL_PAYMENT',
    PAYMENT_LINK: 'PAYMENT_LINK',
    REFUND: 'REFUND',
    KYB: 'KYB',
    ESIM: 'ESIM',
    MFA: 'MFA',
};

const EMAIL_TEMPLATE_KEYS = {
    // BILL_PAYMENT — utils/emailTemplate/billpayments.js
    BILL_PAYMENT_FAILED: 'BILL_PAYMENT_FAILED',
    BILL_PAYMENT_SUCCESS: 'BILL_PAYMENT_SUCCESS',
    // PAYMENT_LINK — utils/emailTemplate/paymentLink.js
    PAYMENT_LINK_GENERATED: 'PAYMENT_LINK_GENERATED',
    // REFUND — utils/emailTemplates.js, controllers/admin/refundTransaction.js
    TRANSACTION_REFUND_REQUEST_OTP: 'TRANSACTION_REFUND_REQUEST_OTP',
    // REFUND — utils/emailTemplate/billpayments.js, utils/{ccavenueGateway,cashfreeGateway}.js
    REFUND_INITIATED: 'REFUND_INITIATED',
    // REFUND — same files as REFUND_INITIATED above. AE has a matching v2 design + resolver
    // wired (utils/emailTemplate/common.js's refundFailure, keys BANK_REFUND_FAILURE/
    // CARD_REFUND_FAILURE) — but AE's version notifies the corporate customer when a refund
    // *they* requested fails. IN's version is an internal ops alert sent to the "pekoWebsite"
    // settings email list when an admin-initiated refund's automated gateway call itself
    // throws — same underlying v2 design copied, IN's own internal-notice audience/content
    // kept unchanged (not switched to customer-facing).
    REFUND_FAILED: 'REFUND_FAILED',
    // KYB — utils/emailTemplates.js, controllers/admin/kybDetails.js
    KYB_DOC_UPDATE: 'KYB_DOC_UPDATE',
    KYB_DOC_REUPLOAD: 'KYB_DOC_REUPLOAD',
    KYB_DETAILS_COMPLETED: 'KYB_DETAILS_COMPLETED',
    // ESIM — utils/emailTemplate/esim.js, services/bulkPayment.js
    ESIM_BULK_BUY_SUCCESS: 'ESIM_BULK_BUY_SUCCESS',
    // MFA — utils/emailTemplate/mfa.js, configs/local_auth.js
    MFA_AUTH_CODE: 'MFA_AUTH_CODE',
};

module.exports = { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS };
