'use strict';

// Registry of admin-managed email template identifiers.
//
// A template is identified by `service` + `key` (the unique index on
// `adminEmailTemplates`), so both halves live here rather than being spelled out at
// each send site. Keys are explicit constants — never derived from a subject line,
// function name, file name or route.
//
// `service` must match the value the template was saved under in the admin panel; a
// mismatch reads as "template not found" and the send quietly uses the local template.
// purchase has no single dominant vertical (office-supplies ecommerce, gift cards,
// Hike eSIM/data plans, software marketplace, business-email domains and B2B
// procurement all live in this microservice), so — like travel — every resolve*
// wrapper here must pass its own `service` from EMAIL_TEMPLATE_SERVICES explicitly.
// Bare per-area service names matching AE's own purchase registry exactly.
// EMAIL_TEMPLATE_SERVICE only exists so resolveEmailTemplate has a same-shaped default
// parameter; it should not be relied on.
const EMAIL_TEMPLATE_SERVICE = 'ECOM';

const EMAIL_TEMPLATE_SERVICES = {
    ECOM: 'ECOM',               // office-supplies ecommerce (orders, cancellations, returns)
    GIFTCARD: 'GIFTCARD',       // corporate gift card purchases
    HIKE: 'HIKE',               // Hike eSIM/data plan purchases
    SOFTWARE: 'SOFTWARE',       // software marketplace subscriptions
    EMAILDOMAIN: 'EMAILDOMAIN', // business email domain subscriptions
    PROCURE: 'PROCURE',         // B2B procurement — RFQs, proposals, purchase orders
    // Namespaced (not bare "REFUND") because `payment` MS already owns a bare REFUND service
    // with its own, differently-shaped REFUND_INITIATED key — same key name, incompatible
    // fields. Reusing bare REFUND here would collide on the shared (service, key, partnerId)
    // uniqueness constraint. Matches the project's established "namespace when a bare name
    // would actually collide" convention (see officeAndBusiness's OTHERS_PROFILE/USERS_AUTH).
    PURCHASE_REFUND: 'PURCHASE_REFUND', // gift-card/software-subscription payment-gateway refund notices
};

// Add one entry per email as it is migrated. An email with no entry here keeps
// rendering from its local template exactly as before.
const EMAIL_TEMPLATE_KEYS = {
    // service: ECOM
    // utils/emailTemplate/ecommerce.js (generatePaymentSuccessEmail), controllers/corporate/ecommerce.js
    ECOM_ORDER_SUCCESS: 'ECOM_ORDER_SUCCESS',
    // utils/emailTemplate/ecommerce.js (commonFailedTemplate, ECOM's own separate copy —
    // distinct from utils/emailTemplate/common.js's shared copy used by HIKE/GIFTCARD/EMAILDOMAIN
    // and from softwares.js's own copy used by SOFTWARE), controllers/corporate/ecommerce.js
    ECOM_PAYMENT_FAILED: 'ECOM_PAYMENT_FAILED',
    // utils/emailTemplate/ecommerce.js (orderCancelConfirmationTemplet), controllers/corporate/ecommerce.js
    ECOM_ORDER_CANCEL_CONFIRMATION: 'ECOM_ORDER_CANCEL_CONFIRMATION',
    // utils/emailTemplate/ecommerce.js (emailOrderCancelRejectedTemplate), controllers/admin/ecomCancelAndRefunds.js
    ECOM_ORDER_CANCEL_REJECTED: 'ECOM_ORDER_CANCEL_REJECTED',
    // utils/emailTemplate/ecommerce.js (emailOrderCancelTemplate), controllers/admin/ecomCancelAndRefunds.js
    ECOM_ORDER_CANCELLED: 'ECOM_ORDER_CANCELLED',
    // utils/templatesForEmails.js (orderCancellFromSellerTemplet — the REAL live copy;
    // utils/emailTemplate/ecommerce.js and utils/emailTemplates.js each have a dead/shadowed
    // duplicate of this same name, never required by any controller), controllers/admin/ecomOrders.js
    ECOM_ORDER_CANCELLED_BY_SELLER: 'ECOM_ORDER_CANCELLED_BY_SELLER',
    // utils/templatesForEmails.js (orderStatusChangeTemplate — the REAL live copy;
    // utils/emailTemplate/ecommerce.js and utils/emailTemplates.js each have a dead/shadowed
    // duplicate). Admin body deliberately omits the product list/pricing breakdown —
    // matches AE's own real resolveOrderStatusChangeTemplate, which only exposes
    // orderId/status/name/date/trackLink/surcharge as flat scalars, not the product array.
    // controllers/admin/ecomOrders.js (3 call sites -> sendOrderStatusChangeEmail helper)
    ECOM_ORDER_STATUS_CHANGE: 'ECOM_ORDER_STATUS_CHANGE',
    // utils/emailTemplate/ecommerce.js (emailOrderReturnRejectedTemplate), controllers/admin/ecomReturnAndRefund.js
    ECOM_RETURN_REJECTED: 'ECOM_RETURN_REJECTED',
    // utils/emailTemplate/ecommerce.js (emailOrderReturnCompletedTemplate), controllers/admin/ecomReturnAndRefund.js
    ECOM_RETURN_COMPLETED: 'ECOM_RETURN_COMPLETED',
    // utils/emailTemplate/ecommerce.js (emailOrderReturnInitiatedTemplate — the rich,
    // params-based design; distinct from ECOM_RETURN_INITIATED_NOTICE below despite the
    // near-identical name), controllers/admin/ecomReturnAndRefund.js
    ECOM_RETURN_INITIATED: 'ECOM_RETURN_INITIATED',
    // utils/emailTemplate/ecommerce.js (emailOrderReturnIntiated — the simple name/orderId/date
    // design, matching AE's own distinctly-named function of the same (typo'd) name),
    // controllers/corporate/ecommerce.js
    ECOM_RETURN_INITIATED_NOTICE: 'ECOM_RETURN_INITIATED_NOTICE',
    // utils/emailTemplates.js (emailCancelOTPTemaplte). Old pre-v2 design preserved as-is —
    // AE's own migration of this exact template did NOT redesign it either, just wrapped the
    // existing HTML in a resolver (confirmed by reading AE's live code). Body copy has a
    // pre-existing grammatical quirk ("process,${message}." reads oddly given the message
    // passed at the call site) inherited unchanged from IN's real current production template —
    // reported, not fixed, per the project's out-of-scope-bugs rule.
    // controllers/corporate/ecommerce.js
    ECOM_CANCEL_OTP: 'ECOM_CANCEL_OTP',
    // NEW dedicated function utils/templatesForEmails.js (refundRequestOTPTemplate), matching
    // AE's real v2-redesigned reference exactly (per-digit OTP boxes, fixed Peko branding, no
    // templateDetails). Only 1 of IN's 3 commonEmailOtpVerification call sites maps to an AE
    // key — confirmed directly from AE's own controllers (only ecomReturnAndRefund.js requires
    // resolveRefundRequestOTPTemplate); the other 2 call sites (admin/order.js,
    // admin/ecomCancelAndRefunds.js) have no AE reference design and are intentionally left
    // unmigrated, still calling the old shared commonEmailOtpVerification directly.
    // controllers/admin/ecomReturnAndRefund.js
    ECOM_RETURN_REFUND_OTP: 'ECOM_RETURN_REFUND_OTP',

    // service: HIKE
    // utils/emailTemplate/hike.js (generateHikePurchaseSuccessEmail), controllers/corporate/hike.js
    HIKE_PURCHASE_SUCCESS: 'HIKE_PURCHASE_SUCCESS',
    // utils/emailTemplate/common.js (commonFailedTemplate, shared with GIFTCARD_PAYMENT_FAILED etc.), controllers/corporate/hike.js
    HIKE_PAYMENT_FAILED: 'HIKE_PAYMENT_FAILED',

    // service: GIFTCARD
    // utils/emailTemplates.js (generateGiftCardPaymentSuccessEmail), controllers/corporate/giftCard.js
    // (sendGiftCardReceivedEmail helper, 2 call sites)
    GIFTCARD_RECEIVED: 'GIFTCARD_RECEIVED',
    // utils/emailTemplates.js (generateGiftCardPaymentSuccessEmailToCompany), controllers/corporate/giftCard.js
    GIFTCARD_COMPANY_NOTICE: 'GIFTCARD_COMPANY_NOTICE',
    // utils/emailTemplate/common.js (commonFailedTemplate, shared with HIKE_PAYMENT_FAILED), controllers/corporate/giftCard.js
    GIFTCARD_PAYMENT_FAILED: 'GIFTCARD_PAYMENT_FAILED',

    // service: SOFTWARE
    // utils/emailTemplate/softwares.js (generateSubscriptionSuccessEmail), controllers/corporate/softwares.js
    SOFTWARE_PURCHASE_SUCCESS: 'SOFTWARE_PURCHASE_SUCCESS',
    // utils/emailTemplate/softwares.js (generateSubscriptionSuccessEmailToVendor), controllers/corporate/softwares.js
    SOFTWARE_ORDER_VENDOR: 'SOFTWARE_ORDER_VENDOR',
    // utils/emailTemplate/softwares.js (generateSubscriptionSuccessEmailToInternals), controllers/corporate/softwares.js
    SOFTWARE_ORDER_INTERNAL: 'SOFTWARE_ORDER_INTERNAL',
    // utils/emailTemplate/softwares.js (commonFailedTemplate, own local copy — distinct from
    // the shared one in utils/emailTemplate/common.js), controllers/corporate/softwares.js
    SOFTWARE_PAYMENT_FAILED: 'SOFTWARE_PAYMENT_FAILED',

    // service: EMAILDOMAIN
    // utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmailToVendor), controllers/corporate/software_subscriptions.js
    EMAILDOMAIN_ORDER_VENDOR: 'EMAILDOMAIN_ORDER_VENDOR',
    // utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmailToInternals), controllers/corporate/software_subscriptions.js
    EMAILDOMAIN_ORDER_INTERNAL: 'EMAILDOMAIN_ORDER_INTERNAL',
    // utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmail), controllers/corporate/software_subscriptions.js
    EMAILDOMAIN_PURCHASE_SUCCESS: 'EMAILDOMAIN_PURCHASE_SUCCESS',
    // utils/emailTemplate/common.js (commonFailedTemplate — the MAIN shared copy, same one
    // used by HIKE_PAYMENT_FAILED/GIFTCARD_PAYMENT_FAILED — NOT softwares.js's own local copy
    // used by SOFTWARE_PAYMENT_FAILED; software_subscriptions.js imports from common.js
    // directly), controllers/corporate/software_subscriptions.js
    EMAILDOMAIN_PAYMENT_FAILED: 'EMAILDOMAIN_PAYMENT_FAILED',

    // service: PROCURE
    // utils/emailTemplate/rfqTemplate.js (rfqInviteTemplate), controllers/corporate/procure/rfqController.js
    // (3 call sites -> sendRfqInviteEmails/sendEmailsToExternalInvites/sendRfqInviteEmailsToAddresses,
    // each already its own named helper; all resolve the same key)
    PROCURE_RFQ_INVITE: 'PROCURE_RFQ_INVITE',
    // utils/emailTemplate/rfqTemplate.js (rfqReminderTemplate), controllers/corporate/procure/rfqController.js (sendReminder)
    PROCURE_RFQ_REMINDER: 'PROCURE_RFQ_REMINDER',
    // utils/emailTemplate/rfqTemplate.js (proposalReceivedTemplate), controllers/public/rfqInviteController.js (submitByToken)
    PROCURE_PROPOSAL_RECEIVED: 'PROCURE_PROPOSAL_RECEIVED',
    // utils/emailTemplate/rfqTemplate.js (proposalUpdatedTemplate), controllers/public/rfqInviteController.js (updateByToken)
    PROCURE_PROPOSAL_UPDATED: 'PROCURE_PROPOSAL_UPDATED',
    // utils/emailTemplate/rfqTemplate.js (poAcknowledgedTemplate), controllers/public/poInviteController.js (acknowledgeByToken)
    PROCURE_PO_ACKNOWLEDGED: 'PROCURE_PO_ACKNOWLEDGED',
    // utils/emailTemplate/poIssuedTemplate.js (poIssuedTemplate), controllers/corporate/procure/purchaseOrder.js (send).
    // Note: `initiator`/`corporate` objects built by these controllers never carry
    // branding/website/logo/socials fields (confirmed identical in AE's own real controllers) —
    // procurement emails always use fixed Peko branding, no per-partner white-labeling.
    PROCURE_PO_ISSUED: 'PROCURE_PO_ISSUED',

    // service: PURCHASE_REFUND (namespaced — bare "REFUND" already belongs to `payment` MS
    // with an incompatible REFUND_INITIATED key shape; see the service comment above)
    // utils/emailTemplate/common.js (refundFailure). No AE resolve* wrapper exists for this
    // template (AE never wired it into its own admin-editable system either) — this key/service
    // pairing and its variable list are new, not copied from an AE precedent. ONE shared key
    // reused across all 3 real call sites (confirmed by explicit user sign-off, since they
    // currently render identical HTML despite 3 different subjects/audiences):
    // utils/cashFreeGateway.js's paymentRefundFailureEmailInternal (subject "Refund Failed", to
    // the internal admin address), utils/emailSender.js's leanRefundFailureEmail (subject "Bank
    // refund Failure", to the corporate user) and paymentGateWayRefundFailureEmail (subject "Card
    // refund Failure", to the corporate user) — the latter two share one call site each within
    // emailSender.js.
    REFUND_FAILED: 'REFUND_FAILED',
    // utils/emailTemplate/common.js (refundInitiated). No AE reference exists at all for this
    // template (Peko-AE's purchase MS has no Cashfree gateway/this flow whatsoever) — built as a
    // net-new v2 design mirroring REFUND_FAILED's shape (success badge instead of reject badge),
    // per explicit user sign-off. Single call site: utils/cashFreeGateway.js's
    // paymentRefundInitiatedEmailInternal (subject "Refund Initiated", to the corporate user).
    REFUND_INITIATED: 'REFUND_INITIATED',
};

module.exports = { EMAIL_TEMPLATE_SERVICE, EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS };
