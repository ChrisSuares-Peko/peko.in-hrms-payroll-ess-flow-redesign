'use strict';

// Registry of admin-managed email template identifiers for the `others` microservice.
//
// Like `users`, `others` covers several distinct business areas, so this registry
// uses multiple services rather than a single default — each resolve* call passes
// its own `service` explicitly.
//
// A template is identified by `service` + `key` (the unique index on
// `adminEmailTemplates`, shared across every microservice), so both halves live here
// rather than being spelled out at each send site. Keys are explicit constants —
// never derived from a subject line, function name, file name or route.
//
// IMPORTANT: `adminEmailTemplates` is one shared table across all microservices.
// Bare service names, matching Peko-AE's convention exactly — including AE's own
// `others` grouping, which has no AUTH service at all (its OTP-related keys live
// under PROFILE/ORDERS instead). Matching that means `others` and `users` never
// share a bare name here, unlike an earlier version of this file.
const EMAIL_TEMPLATE_SERVICES = {
    SYSTEM_USER: 'SYSTEM_USER',
    PROFILE: 'PROFILE',
    ORDERS: 'ORDERS',
    HOTEL: 'HOTEL',
    PACKAGE: 'PACKAGE',
    WORKSPACES: 'WORKSPACES',
    BENEFICIARY: 'BENEFICIARY',
};

// service: SYSTEM_USER — utils/templatesForEmails.js (setNewPasswordTemplate)
// service: PROFILE     — utils/emailTemplate/profile.js, referral.js (matching AE's
//                         own others grouping, which files its referral email under
//                         PROFILE too, not a separate service)
// service: ORDERS      — others/controllers/admin/order.js
// service: HOTEL       — utils/emailTemplate/hotels.js
// service: PACKAGE     — utils/emailTemplate/package.js, controllers/admin/package.js
// service: WORKSPACES  — utils/emailTemplate/workspaces.js, controllers/admin/workspaces.js
// service: BENEFICIARY — utils/emailTemplate/beneficiary.js, controllers/corporate/beneficiary.js
const EMAIL_TEMPLATE_KEYS = {
    // SYSTEM_USER
    SET_NEW_PASSWORD: 'REDACTED',
    // PROFILE
    // OTP_MFA_LOGIN and OTP_VERIFICATION_COMMON both migrate the same JS function
    // (commonEmailOtpVerification) but render genuinely different Figma designs —
    // OTP_MFA_LOGIN is the personalized "MFA Code" design used only for the login-MFA
    // flow (others/configs/local_auth.js). Kept as a separate key deliberately.
    OTP_MFA_LOGIN: 'OTP_MFA_LOGIN',
    PROFILE_RESET_PASSWORD_SUCCESS: 'REDACTED',
    BANK_ACCOUNT_ADDED_SUCCESS: 'BANK_ACCOUNT_ADDED_SUCCESS',
    BANK_ACCOUNT_UPDATE_SUCCESS: 'BANK_ACCOUNT_UPDATE_SUCCESS',
    BANK_ACCOUNT_DELETED_SUCCESS: 'BANK_ACCOUNT_DELETED_SUCCESS',
    BANK_ACCOUNT_VERIFICATION_OTP: 'BANK_ACCOUNT_VERIFICATION_OTP',
    PROFILE_UPDATE_SUCCESS: 'PROFILE_UPDATE_SUCCESS',
    PROFILE_UPDATE_OTP: 'PROFILE_UPDATE_OTP',
    ADDRESS_ADDED_SUCCESS: 'ADDRESS_ADDED_SUCCESS',
    ADDRESS_UPDATE_SUCCESS: 'ADDRESS_UPDATE_SUCCESS',
    ADDRESS_DELETED_SUCCESS: 'ADDRESS_DELETED_SUCCESS',
    ADDRESS_VERIFICATION_OTP: 'ADDRESS_VERIFICATION_OTP',
    REFERRAL_INVITE: 'REFERRAL_INVITE',
    // ORDERS — the generic OTP design used for order-refund OTP, distinct from
    // OTP_MFA_LOGIN's personalized design above.
    OTP_VERIFICATION_COMMON: 'OTP_VERIFICATION_COMMON',
    // HOTEL
    HOTEL_BOOKING_CONFIRMATION_EMAIL: 'HOTEL_BOOKING_CONFIRMATION_EMAIL',
    // PACKAGE — AE has a real resolve* wrapper for this exact template, but AE never gave it a
    // v2 redesign either (old pre-v2 design preserved as-is on both sides). AE's own wrapper
    // passes raw old/new price values instead of a pre-rendered conditional-rows blob — not
    // copied here, since it would break admin-editing whenever only one price actually changed
    // (see the empty-value-triggers-fallback rule); `priceRows` is built as one HTML blob at
    // the call site instead. 2 pre-existing bugs directly inside this exact template body were
    // fixed as part of this same rewrite (not a separate, unrelated fix): hardcoded `AED`
    // (should always have been ₹/INR) and a leftover UAE support phone number with no IN
    // equivalent anywhere in this codebase (removed to match every other IN template's
    // email-only support-contact convention, not replaced with a guessed number).
    PACKAGE_PRICE_UPDATE: 'PACKAGE_PRICE_UPDATE',
    // WORKSPACES — AE has a real resolve* wrapper for this exact template, but AE never gave it
    // a v2 redesign either (old pre-v2 design preserved as-is on both sides, matching
    // PACKAGE_PRICE_UPDATE's situation). Uses emailer.emailWithMultipleAttachment — the
    // attachment handling is untouched by this migration, only the HTML body is resolver-wired.
    WORKSPACE_DOCUMENT_FROM_ADMIN: 'WORKSPACE_DOCUMENT_FROM_ADMIN',
    // BENEFICIARY — AE has a real v2 design + resolve* wrapper for this exact template, but
    // AE's design is a bespoke 576px "Inter" OTP-box card copied from AE's own `users` MS
    // sign-up OTP, which conflicts with every other OTP email already migrated in this MS
    // (all use IN's own 680px v2Header/v2Footer + buildOtpBoxesHtml pattern). Per explicit
    // user decision, redesigned to match IN's own established OTP pattern instead of AE's
    // reference design — see profile.js's updateBankDetailsOTP/addressOTP for the identical
    // structure this follows. The old design's "call us at +971 45401266" line was dropped
    // (not replaced with a guessed IN number), matching the fact that none of the 3 existing
    // v2 OTP templates in this MS have a contact-us line in the body at all.
    BENEFICIARY_OTP: 'BENEFICIARY_OTP',
};

module.exports = { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS };
