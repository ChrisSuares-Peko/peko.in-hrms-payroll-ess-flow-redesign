'use strict';

// Registry of admin-managed email template identifiers for the `scheduler`
// microservice. EMAIL_TEMPLATE_SERVICES values must be namespaced per-microservice
// (never a bare generic name) since the shared adminEmailTemplates table is keyed on
// (service, key) across every Peko-IN microservice — a bare name risks two unrelated
// microservices colliding on the same row. Everything in scheduler uses one single
// service value, SCHEDULER; keys (globally unique constants below) are what
// distinguish individual templates within it.
//
// Add one entry per email as it's migrated — anything not here keeps rendering
// from its local template exactly as before.
const EMAIL_TEMPLATE_SERVICES = {
    SCHEDULER: 'SCHEDULER',
};

const EMAIL_TEMPLATE_KEYS = {
    // utils/email/emailTemplates/anniversary.js, services/anniversary.js
    ANNIVERSARY_1_TO_4_YEARS: 'ANNIVERSARY_1_TO_4_YEARS',
    ANNIVERSARY_4_PLUS_YEARS: 'ANNIVERSARY_4_PLUS_YEARS',
    // utils/email/emailTemplates/birthday.js, services/holiDay.js (sendBirthDayMails)
    EMPLOYEE_BIRTHDAY_WISH: 'EMPLOYEE_BIRTHDAY_WISH',
    // utils/email/emailTemplates/paySlipEmail.js, services/salary.js (emailPdfFile)
    PAYSLIP_EMAIL: 'PAYSLIP_EMAIL',
    // utils/email/emailTemplates/eSign.js, services/eSign.js
    ESIGN_REMINDER: 'ESIGN_REMINDER',
    // utils/email/emailTemplates/holidayAnnouncement.js, services/holiDay.js
    HOLIDAY_REMINDER: 'HOLIDAY_REMINDER',
    // utils/email/emailTemplates/invoice.js, services/{invoiceGuideline,invoicingV2Reminder}.js
    INVOICE_REMINDER: 'INVOICE_REMINDER',
    // utils/emailTemplates/invoicingV2.js, services/recurringInvoices.js
    INVOICE_PDF_SHARE: 'INVOICE_PDF_SHARE',
    // utils/emailTemplates.js, services/subscriptionPreRiminder.js
    SUBSCRIPTION_PRE_REMINDER: 'SUBSCRIPTION_PRE_REMINDER',
    // utils/emailTemplates.js, services/{subscriptionAutoRenewal,subscriptionGracePeriodRetry,whatsAppTriggerSubscriptionCharges,whatsAppSubscriptionAutoRenewal}.js
    SUBSCRIPTION_RENEWAL_FAILURE: 'SUBSCRIPTION_RENEWAL_FAILURE',
    // utils/emailTemplates.js, services/whatsAppSubscriptionAutoRenewal.js
    WHATSAPP_SUBSCRIPTION_SUCCESS: 'WHATSAPP_SUBSCRIPTION_SUCCESS',
    // utils/email/emailTemplates/billpayments.js, services/{prepaidRechargeStatus,bbpsAwaitedStatus}.js
    BILL_PAYMENT_SUCCESS: 'BILL_PAYMENT_SUCCESS',
    BILL_PAYMENT_FAILED: 'BILL_PAYMENT_FAILED',
    // utils/emailTemplates.js, services/subscriptionAutoRenewal.js
    SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
    // utils/email/emailTemplates/reportAdminTemplate.js, services/scheduleReports.js
    // (generateTransactionReportForAllUsers, generateTransactionReportForAllUsersAdmin —
    // 4 call sites across both, sharing one sendAdminReportEmail() helper). AE has a matching
    // v2-redesigned, resolver-wired reference, but AE's own resolve* wrapper lives inside
    // utils/emailer.js instead of a controller/service file — not copied here, since it
    // violates this project's resolver-placement rule; the resolver call lives in
    // scheduleReports.js instead, and emailer.js's emailWithExcelAdmin was simplified to just
    // take a pre-built `body` html string (matching its sibling send functions in the same
    // file) rather than building the template itself. AE's variable shape also splits
    // signups/customers (totalSignupsCorporates/totalSignupsCustomers/totalCustomers) — IN's
    // real data only ever has one totalSignups figure and no separate customer-login count,
    // so this key's admin body uses IN's real field set, not AE's.
    REPORT_ADMIN_TRANSACTION_SUMMARY: 'REPORT_ADMIN_TRANSACTION_SUMMARY',
    // utils/emailTemplates.js (generateTransactionReportEmailBody), services/scheduleReports.js
    // (transactionReport). Old pre-v2 design preserved as-is — AE has a matching design but
    // never redesigned it to v2 either, so there's no v2 reference to build against.
    TRANSACTION_REPORT_DATA_ATTACHED: 'TRANSACTION_REPORT_DATA_ATTACHED',
    // utils/emailTemplates.js (generateNoTransactionReportEmailBody), services/scheduleReports.js
    // (transactionReport, shared by 3 real callers — dailyReportScheduler/weeklyReportScheduler/
    // monthlyReportScheduler — that only differ by `timePhrase`; 3 more byte-identical copies
    // exist inside the dead cronTaskScheduler, not migrated since it's unreachable). Same
    // old-design-preserved rationale as TRANSACTION_REPORT_DATA_ATTACHED.
    TRANSACTION_REPORT_NO_DATA: 'TRANSACTION_REPORT_NO_DATA',
};

module.exports = { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS };
