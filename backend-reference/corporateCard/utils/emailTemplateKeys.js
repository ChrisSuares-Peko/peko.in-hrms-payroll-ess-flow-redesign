'use strict';

// Registry of admin-managed email template identifiers for the `corporateCard`
// microservice. Namespaced per-service (CORPORATECARD_*) rather than bare names,
// matching the convention every other migrated microservice uses.
//
// Add one entry per email as it's migrated — anything not here keeps rendering
// from its local template exactly as before.
const EMAIL_TEMPLATE_SERVICES = {
    CORPORATECARD_APPLICATION: 'CORPORATECARD_APPLICATION',
    CORPORATECARD_CARD_LIFECYCLE: 'CORPORATECARD_CARD_LIFECYCLE',
    CORPORATECARD_VENDOR: 'CORPORATECARD_VENDOR',
};

// utils/notificationJobEmails.js's pendingKycNoticeTemplate/walletBalanceReminderTemplate/
// weeklySpendDigestTemplate are not listed here yet — none has a matching Figma
// design (each checked and confirmed a real content/audience mismatch with the user
// rather than assumed), out of scope for this pass.
const EMAIL_TEMPLATE_KEYS = {
    // CORPORATECARD_APPLICATION — utils/kybStatusEmailTemplate.js
    KYB_APPROVED: 'KYB_APPROVED',
    KYB_REJECTED: 'KYB_REJECTED',
    // CORPORATECARD_CARD_LIFECYCLE — utils/cardTerminationEmailTemplate.js
    CARD_TERMINATION_COMPLETED: 'CARD_TERMINATION_COMPLETED',
    // CORPORATECARD_VENDOR — utils/vendorKybEmailTemplate.js
    VENDOR_KYB_UNDER_REVIEW: 'VENDOR_KYB_UNDER_REVIEW',
};

module.exports = { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS };
