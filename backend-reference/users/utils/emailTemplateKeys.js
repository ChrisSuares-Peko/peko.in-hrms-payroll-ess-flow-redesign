'use strict';

// Registry of admin-managed email template identifiers for the `users` microservice.
//
// A template is identified by `service` + `key` (the unique index on
// `adminEmailTemplates`), so both halves live here rather than being spelled out at
// each send site. Keys are explicit constants — never derived from a subject line,
// function name, file name or route.
//
// Add one entry per email as it is migrated. An email with no entry here keeps
// rendering from its local template exactly as before.
// One bare default service, matching Peko-AE's own users registry exactly (AE has
// no PASSWORD/SUBCORPORATE_USER/ESS_PORTAL split — everything is AUTH).
const EMAIL_TEMPLATE_SERVICE = 'AUTH';

const EMAIL_TEMPLATE_KEYS = {
    // AUTH
    SIGNUP_OTP: 'SIGNUP_OTP',
    CORPORATE_ACCOUNT_CREATED: 'CORPORATE_ACCOUNT_CREATED',
    OTP_VERIFICATION: 'OTP_VERIFICATION',
    EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
    // PASSWORD
    RESET_PASSWORD: 'REDACTED',
    RESET_PASSWORD_SUCCESS: 'REDACTED',
    SET_PASSWORD: 'REDACTED',
    SET_NEW_PASSWORD: 'REDACTED',
    // SUBCORPORATE_USER
    SUBCORPORATE_WELCOME: 'SUBCORPORATE_WELCOME',
    SUBCORPORATE_ACCESS_UPDATED: 'SUBCORPORATE_ACCESS_UPDATED',
    SUBCORPORATE_ACCESS_DISABLED: 'SUBCORPORATE_ACCESS_DISABLED',
    // ESS_PORTAL
    ESS_WELCOME: 'ESS_WELCOME',
    ESS_EMAIL_CHANGED: 'ESS_EMAIL_CHANGED',
    // SUBSCRIPTION
    SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
};

module.exports = { EMAIL_TEMPLATE_SERVICE, EMAIL_TEMPLATE_KEYS };
