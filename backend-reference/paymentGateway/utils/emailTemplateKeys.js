'use strict';

// Registry of admin-managed email template identifiers for the `paymentGateway`
// microservice.
//
// IMPORTANT — this microservice is unusual: it's the platform's shared external-
// payment-gateway (Cashfree/CCAvenue) webhook processor. For most products, the SAME
// email is also sent by another microservice's own wallet-payment code path
// (travel/purchase/payment), forked here because a webhook landing in this MS can't
// call back into another microservice's code at runtime. Per explicit user decision,
// these duplicated templates are NOT given a new namespaced service/key — they reuse
// the EXACT SAME (service, key) the owning microservice already registered, so both
// microservices' resolver calls read the same shared row in `adminEmailTemplates`
// (one admin-edited template, two send sites). The owning microservice's own
// registry/files are never touched for this — this file only needs its own local
// copy of the same constant strings, since one microservice can't require() another's.
//
// Only genuinely paymentGateway-exclusive templates (no equivalent anywhere else)
// get a fresh new service/key here.
//
// Add one entry per email as it's migrated — anything not here keeps rendering
// locally, unchanged.
const EMAIL_TEMPLATE_SERVICES = {
    // ---- Reused from other microservices (see note above — do not treat as owned here) ----
    HIKE: 'HIKE',                       // reused from purchase MS
    GIFTCARD: 'GIFTCARD',               // reused from purchase MS
    SOFTWARE: 'SOFTWARE',               // reused from purchase MS
    EMAILDOMAIN: 'EMAILDOMAIN',         // reused from purchase MS
    ECOM: 'ECOM',                       // reused from purchase MS
    HOTEL: 'HOTEL',                     // reused from travel MS
    FLIGHT: 'FLIGHT',                   // reused from travel MS
    ESIM: 'ESIM',                       // reused from travel MS
    LOGISTICS: 'LOGISTICS',             // reused from travel MS
    BILL_PAYMENT: 'BILL_PAYMENT',       // reused from payment MS
    REFUND: 'REFUND',                   // reused from payment MS
    PAYMENT_LINK: 'PAYMENT_LINK',       // reused from payment MS

    // ---- New, paymentGateway-exclusive services (no reuse candidate elsewhere) ----
    WORKS: 'WORKS',                     // utils/emailTemplate/works.js, controllers/corporate/works.js
    SUBSCRIPTION: 'SUBSCRIPTION',        // utils/emailTemplates/subscription.js, controllers/corporate/subscription.js
    WHATSAPP: 'WHATSAPP',                // utils/emailTemplate/whatsAppForBusiness.js, controllers/corporate/whatsAppForBusiness.js
    WORKSPACE: 'WORKSPACE',              // utils/emailTemplate/workspace.js, controllers/corporate/workspace.js
    CARBON_FOOTPRINT: 'CARBON_FOOTPRINT', // utils/templatesForEmails.js, controllers/corporate/carbonFootprint.js
};

const EMAIL_TEMPLATE_KEYS = {
    // ---- Reused keys (identical string to the owning microservice's own registry) ----
    // HIKE — utils/emailTemplates/hike.js (generateHikePurchaseSuccessEmail),
    // controllers/corporate/hike.js. Owned by purchase MS (purchase/utils/emailTemplateKeys.js).
    HIKE_PURCHASE_SUCCESS: 'HIKE_PURCHASE_SUCCESS',
    // GIFTCARD — utils/emailTemplates.js (generateGiftCardPaymentSuccessEmail via the shared
    // sendGiftCardReceivedEmail helper, 2 call sites), controllers/corporate/giftCard.js.
    // Owned by purchase MS.
    GIFTCARD_RECEIVED: 'GIFTCARD_RECEIVED',
    // GIFTCARD — utils/emailTemplates.js (generateGiftCardPaymentSuccessEmailToCompany),
    // controllers/corporate/giftCard.js. Owned by purchase MS.
    GIFTCARD_COMPANY_NOTICE: 'GIFTCARD_COMPANY_NOTICE',
    // GIFTCARD — utils/emailTemplates/common.js (commonFailedTemplate),
    // controllers/corporate/giftCard.js. Owned by purchase MS.
    GIFTCARD_PAYMENT_FAILED: 'GIFTCARD_PAYMENT_FAILED',
    // SOFTWARE — utils/emailTemplates/softwares.js (generateSubscriptionSuccessEmail),
    // controllers/corporate/softwares.js. Owned by purchase MS.
    SOFTWARE_PURCHASE_SUCCESS: 'SOFTWARE_PURCHASE_SUCCESS',
    // SOFTWARE — utils/emailTemplates/softwares.js (generateSubscriptionSuccessEmailToVendor),
    // controllers/corporate/softwares.js. Owned by purchase MS.
    SOFTWARE_ORDER_VENDOR: 'SOFTWARE_ORDER_VENDOR',
    // SOFTWARE — utils/emailTemplates/softwares.js (generateSubscriptionSuccessEmailToInternals),
    // controllers/corporate/softwares.js. Owned by purchase MS.
    SOFTWARE_ORDER_INTERNAL: 'SOFTWARE_ORDER_INTERNAL',
    // SOFTWARE — utils/emailTemplates/officeSupplies.js (commonFailedTemplate — the only
    // live function in that file), controllers/corporate/softwares.js. Owned by purchase MS.
    SOFTWARE_PAYMENT_FAILED: 'SOFTWARE_PAYMENT_FAILED',
    // EMAILDOMAIN — utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmailToVendor),
    // controllers/corporate/software_subscriptions.js. Owned by purchase MS.
    EMAILDOMAIN_ORDER_VENDOR: 'EMAILDOMAIN_ORDER_VENDOR',
    // EMAILDOMAIN — utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmailToInternals),
    // controllers/corporate/software_subscriptions.js. Owned by purchase MS.
    EMAILDOMAIN_ORDER_INTERNAL: 'EMAILDOMAIN_ORDER_INTERNAL',
    // EMAILDOMAIN — utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmail),
    // controllers/corporate/software_subscriptions.js. Owned by purchase MS.
    EMAILDOMAIN_PURCHASE_SUCCESS: 'EMAILDOMAIN_PURCHASE_SUCCESS',
    // EMAILDOMAIN — utils/emailTemplates.js (commonFailedTemplate),
    // controllers/corporate/software_subscriptions.js. Owned by purchase MS.
    EMAILDOMAIN_PAYMENT_FAILED: 'EMAILDOMAIN_PAYMENT_FAILED',
    // ECOM — utils/emailTemplate/ecommerce.js (generatePaymentSuccessEmail),
    // controllers/corporate/ecommerce.js. Owned by purchase MS.
    ECOM_ORDER_SUCCESS: 'ECOM_ORDER_SUCCESS',
    // ECOM — utils/emailTemplate/ecommerce.js (commonFailedTemplate, ECOM's own separate copy),
    // controllers/corporate/ecommerce.js. Owned by purchase MS.
    ECOM_PAYMENT_FAILED: 'ECOM_PAYMENT_FAILED',
    // HOTEL — utils/emailTemplate/hotels.js (generateHotelTicketAndSendToMailNew),
    // controllers/corporate/hotels.js. Owned by travel MS.
    HOTEL_BOOKING_CONFIRMATION: 'HOTEL_BOOKING_CONFIRMATION',
    // FLIGHT — utils/emailTemplates/flight/flightConfirmationTemplate.js,
    // controllers/corporate/flight.js. Owned by travel MS.
    FLIGHT_CONFIRMATION: 'FLIGHT_CONFIRMATION',
    // FLIGHT — utils/emailTemplates/common.js (commonFlightbookingFailedTemplate),
    // controllers/corporate/flight.js (2 call sites, shared via one
    // resolveFlightBookingFailedEmail() helper). Owned by travel MS.
    FLIGHT_BOOKING_FAILED: 'FLIGHT_BOOKING_FAILED',
    // LOGISTICS — utils/emailTemplate/logistics.js (generatePaymentSuccessEmailLogisticsV3),
    // controllers/corporate/logisticsV3.js. Owned by travel MS.
    LOGISTICS_PAYMENT_SUCCESS_V3: 'LOGISTICS_PAYMENT_SUCCESS_V3',
    // LOGISTICS — utils/emailTemplates/common.js (commonFailedTemplate, shared with
    // ESIM_PAYMENT_FAILED on travel MS's side), controllers/corporate/logisticsV3.js.
    // Owned by travel MS.
    LOGISTICS_PAYMENT_FAILED: 'LOGISTICS_PAYMENT_FAILED',
    // BILL_PAYMENT — utils/emailTemplate/billpayments.js (generateMobilePaymentSuccessEmailBill),
    // controllers/corporate/challan.js, commonBillHandler.js, telecomPayments/prepaid.js.
    // Owned by payment MS.
    BILL_PAYMENT_SUCCESS: 'BILL_PAYMENT_SUCCESS',
    // BILL_PAYMENT — utils/emailTemplate/billpayments.js (commonFailedTemplateforBillPayments),
    // same 3 controllers as above. Owned by payment MS.
    BILL_PAYMENT_FAILED: 'BILL_PAYMENT_FAILED',
    // REFUND — utils/emailTemplates/common.js (refundInitiated), utils/{ccavenueGateway,
    // cashfreeGateway}.js. Owned by payment MS.
    REFUND_INITIATED: 'REFUND_INITIATED',
    // REFUND — utils/emailTemplates/common.js (refundFailure), utils/{ccavenueGateway,
    // cashfreeGateway,emailSender}.js. Owned by payment MS.
    REFUND_FAILED: 'REFUND_FAILED',
    REFUND_IN_PROGRESS: 'REFUND_IN_PROGRESS',
    REFUND_COMPLETED: 'REFUND_COMPLETED',
    REFUND_REJECTED: 'REFUND_REJECTED',
    // PAYMENT_LINK — utils/emailTemplates/paymentLink.js (generatePaymentLinkTemplate),
    // controllers/admin/paymentLinks.js (resendPaymentLink). Owned by payment MS.
    PAYMENT_LINK_GENERATED: 'PAYMENT_LINK_GENERATED',
    // ESIM — utils/emailTemplates/common.js (commonFailedTemplate), controllers/corporate/
    // eSIMV2.js and eSimTunz.js (2 call sites each). Owned by travel MS.
    ESIM_PAYMENT_FAILED: 'ESIM_PAYMENT_FAILED',

    // ---- New keys (no reuse candidate — paymentGateway owns these) ----
    // WORKS — AE has a real v2 design + resolver wired (Peko-AE/gateway's own
    // WORKS_PURCHASE_SUCCESS). utils/emailTemplate/works.js (worksPurchaseEmail),
    // controllers/corporate/works.js.
    WORKS_PURCHASE_SUCCESS: 'WORKS_PURCHASE_SUCCESS',
    // SUBSCRIPTION — AE has a real v2 design + resolver wired (Peko-AE/gateway's own
    // subscriptionIndividualSuccessEmail / resolveSubscriptionIndividualSuccessEmail).
    // utils/emailTemplates/subscription.js, controllers/corporate/subscription.js (exports.payment,
    // 1 call site covering both the initial-purchase and non-Peko+ upgrade branches).
    SUBSCRIPTION_INDIVIDUAL_SUCCESS: 'SUBSCRIPTION_INDIVIDUAL_SUCCESS',
    // SUBSCRIPTION — AE has a real v2 design + resolver wired (storagePurchaseSuccess /
    // resolveSubscriptionStoragePurchaseSuccessEmail). utils/emailTemplates/subscription.js,
    // shared by 3 call sites (addonPayment, subscriptionAddOnsPayment, addonWalletPayment) via one
    // resolveSubscriptionStoragePurchaseSuccessEmail() helper in the controller.
    SUBSCRIPTION_STORAGE_PURCHASE_SUCCESS: 'SUBSCRIPTION_STORAGE_PURCHASE_SUCCESS',
    // SUBSCRIPTION — AE has a real v2 design + resolver wired (subscriptionPekoPlusSuccessEmail /
    // resolveSubscriptionPekoPlusSuccessEmail). utils/emailTemplates/subscription.js,
    // controllers/corporate/subscription.js (exports.payment, Peko+ upgrade branch).
    SUBSCRIPTION_PEKO_PLUS_SUCCESS: 'SUBSCRIPTION_PEKO_PLUS_SUCCESS',
    // SUBSCRIPTION — design-only AE reference (payrollAddOnEmployeesSuccess in
    // Peko-AE/gateway/utils/emailTemplates/payroll.js) — AE itself never wired a resolver
    // for it either (its own controller call site is explicitly commented "Deferred...
    // left unmigrated per task scope"), so this key/design was newly invented here,
    // following AE's unused template as the visual reference per user sign-off. Grouped
    // under the SUBSCRIPTION service (not a new PAYROLL service) since it's structurally
    // just another one of subscription.js's add-on emails, alongside STORAGE above — and to
    // avoid confusion with the unrelated PAYROLL service already registered in
    // officeAndBusiness (the actual Payroll HR product's own templates). utils/emailTemplate/payroll.js
    // (payrollAddOnEmployeesSuccess), shared by 3 call sites (addonPayment, subscriptionAddOnsPayment,
    // addonWalletPayment) via one resolveSubscriptionPayrollAddonSuccessEmail() helper in the controller.
    SUBSCRIPTION_PAYROLL_ADDON_SUCCESS: 'SUBSCRIPTION_PAYROLL_ADDON_SUCCESS',
    // WHATSAPP — AE has a real v2 design + resolver wired (Peko-AE/gateway's own
    // whatsappForBusiness / resolveWhatsappConversationCreditsSuccessEmail).
    // utils/emailTemplate/whatsAppForBusiness.js, controllers/corporate/whatsAppForBusiness.js
    // (exports.payment, 1 call site).
    WHATSAPP_CONVERSATION_CREDITS_SUCCESS: 'WHATSAPP_CONVERSATION_CREDITS_SUCCESS',
    // WHATSAPP — AE has a real v2 design + resolver wired (commonFailedTemplate /
    // resolveWhatsappPaymentFailedEmail). controllers/corporate/whatsAppForBusiness.js
    // (botBuilderpayment, 1 call site).
    WHATSAPP_PAYMENT_FAILED: 'WHATSAPP_PAYMENT_FAILED',
    // WORKSPACE — AE has a real v2 design + resolver wired (Peko-AE/gateway's own
    // generatePaymentSuccessEmailWorkspaces / resolveGeneratePaymentSuccessEmailWorkspaces).
    // utils/emailTemplate/workspace.js, controllers/corporate/workspace.js (exports.payment, 1 call site).
    WORKSPACE_PAYMENT_SUCCESS: 'WORKSPACE_PAYMENT_SUCCESS',
    // WORKSPACE — AE has a real v2 design + resolver wired (workspaceReminder /
    // resolveWorkspaceReminder). utils/emailTemplate/workspace.js, controllers/corporate/workspace.js
    // (exports.payment, inside the scheduled reminder job callback — 1 call site).
    WORKSPACE_REMINDER: 'WORKSPACE_REMINDER',
    // CARBON_FOOTPRINT — AE has a real v2 design + resolver wired (Peko-AE/gateway's own
    // creditPurchaseMail / resolveCreditPurchaseEmail, dropping AE's 2 extra detail rows —
    // Service Provider, Carbon Credits — that IN's controller has no real data for).
    // utils/templatesForEmails.js (generatePaymentSuccessEmail), controllers/corporate/carbonFootprint.js
    // (exports.payment, 1 call site).
    CARBON_FOOTPRINT_CREDIT_PURCHASE: 'CARBON_FOOTPRINT_CREDIT_PURCHASE',
    // ESIM — AE has a real v2 design + resolver wired (esimPaymentFailedTemplate /
    // resolveEsimBuyPaymentFailedEmail). Grouped under the reused ESIM service (see
    // ESIM_PAYMENT_FAILED above) since it's the same product vertical, but this specific
    // key has no equivalent in travel MS's own registry — paymentGateway owns it.
    // utils/emailTemplates/common.js, controllers/corporate/eSIMV2.js + eSimTunz.js
    // (2 call sites each).
    ESIM_BUY_PAYMENT_FAILED: 'ESIM_BUY_PAYMENT_FAILED',
    // ESIM — AE has a real v2 design + resolver wired (esimTopUpTemplate /
    // resolveEsimTopUpEmail, `type: 'success'` branch). Same ESIM service, paymentGateway-owned
    // key. utils/emailTemplates/common.js, controllers/corporate/eSIMV2.js + eSimTunz.js.
    ESIM_TOPUP_SUCCESS: 'ESIM_TOPUP_SUCCESS',
    // ESIM — same as above, `type: 'fail'` branch.
    ESIM_TOPUP_FAILED: 'ESIM_TOPUP_FAILED',
    // ESIM — AE has a real v2 design + resolver wired (gateway's own eSimTunz.js
    // generateEsimBuySingleSuccessEmail / resolveEsimTunzBuySuccessEmail, exact same key
    // name). Same ESIM service, paymentGateway-owned key. This is the self-purchase
    // branch of eSimTunz.js's purchase-success email (controllers/corporate/eSimTunz.js,
    // 1 call site).
    ESIM_TUNZ_BUY_SUCCESS: 'ESIM_TUNZ_BUY_SUCCESS',
    // ESIM — no AE reference: AE's eSimTunz.js has no gift/recipient-purchase branch at
    // all, so this key/design was newly invented here. This is the recipient (gift)
    // branch of the same purchase-success email, sent to the recipient instead of the
    // purchaser (controllers/corporate/eSimTunz.js, 1 call site).
    ESIM_TUNZ_RECIPIENT_SUCCESS: 'ESIM_TUNZ_RECIPIENT_SUCCESS',
    // HOTEL — AE has a real v2 design + resolver wired (commonFailedTemplate /
    // resolveHotelPaymentFailedEmail). Grouped under the reused HOTEL service (see
    // HOTEL_BOOKING_CONFIRMATION above) but this specific key has no equivalent in travel
    // MS's own registry (travel MS has HOTEL_CANCELLED instead — a different concept) —
    // paymentGateway owns this key. controllers/corporate/hotels.js (1 call site).
    HOTEL_BOOKING_FAILED: 'HOTEL_BOOKING_FAILED',
};

module.exports = { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS };
