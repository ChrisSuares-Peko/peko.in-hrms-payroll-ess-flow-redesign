'use strict';

const CTRLPAY_METHOD = {
    getOnboardingStatus: 'onboarding.get_onboarding_status',
    validatePartnerCode: 'onboarding.validate_partner_code',
    fetchConsentText: 'onboarding.fetch_consent_text',
    recordWalletConsent: 'onboarding.record_wallet_consent',
    searchPanAndMobile: 'onboarding.ckyc_search_pan_and_mobile',
    initiateCkycOtp: 'onboarding.ckyc_initiate_otp',
    validateCkycOtp: 'onboarding.ckyc_validate_otp',
    submitForVerification: 'onboarding.submit_for_verification',
    getVpa: 'onboarding.get_vpa',
    getBusinessDocuments: 'osv.get_business_documents',
    getApplicationUploadUrl: 's3.get_application_presigned_upload_url',
    getBusinessDocumentUploadUrl: 's3.get_business_documents_presigned_upload_url',
    markDocumentNotUploaded: 's3.mark_document_not_uploaded',
    fillOsvAddress: 'user.fill_osv_address',
    getCustomerName: 'user.get_customer_name',
    getVirtualAccount: 'user.get_virtual_account_details',
    sendPhoneOtp: 'phone_verification.send_phone_verification_otp',
    verifyPhoneOtp: 'phone_verification.verify_phone_otp',
    getAccountBalance: 'spending_transaction.get_account_balance',
    addSenderAccounts: 'whitelist_bank_accounts.update_whitelisted_sender_bank_accounts',
    listSenderAccounts: 'whitelist_bank_accounts.get_whitelisted_sender_bank_accounts',
    removeSenderAccount: 'whitelist_bank_accounts.delete_whitelisted_sender_bank_account',
    listTransactions: 'transaction.get_all_ctrl_pay_transaction',
    searchTransactions: 'transaction.search_ctrl_pay_transaction',
};

const CTRLPAY_METHOD_PATH = '/api/method/boomerang_frappe_service.gateway.';

const CTRLPAY_CUSTOMER_TYPE = 'Indian Business';

const CTRLPAY_SERVICE_LABEL = 'CTRLPay';

const CTRLPAY_ACCESS_KEY = 'ctrl_pay';

const CTRLPAY_SUCCESS = 'SUCCESS';

const CTRLPAY_APPLICATION_FILE_NAMES = ['pan_card', 'ovd_of_ubo', 'ovd_of_ubo_back'];

const CTRLPAY_DOCUMENT_CONTENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];

const CTRLPAY_WEB_OVD_TYPES = ['PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'NREGA_JOB_CARD', 'NPR_LETTER'];

const CTRLPAY_TRANSACTION_STATUS = {
    TRANSACTION_SUCCESS: 'Completed',
    TRANSACTION_PENDING: 'Pending',
    TRANSACTION_INITIATED: 'Initiated',
    TRANSACTION_FAILED: 'Failed',
};

const CTRLPAY_TRANSACTION_KIND = {
    'Loading Transaction': 'Load',
    'Redeeming Transaction': 'Spend',
};

const CTRLPAY_TRANSACTION_METHODS = ['UPI', 'WALLET', 'LOAD_VIA_UPI', 'LOAD_VIA_AXIS'];

const CTRLPAY_LIMITS = {
    maxDocumentBytes: 10 * 1024 * 1024,
    maxSenderAccounts: 5,
    maxCkycOtpResends: 2,
    phoneOtpCooldownSeconds: 30,
    oauthStateTtlSeconds: 600,
    tokenRefreshWindowSeconds: 60,
    refreshLockMs: 10000,
    requestTimeoutMs: 30000,
    uploadTimeoutMs: 60000,
    maxExportRows: 5000,
    maxSearchRows: 200,
};

const CTRLPAY_MESSAGES = {
    generic: 'Something went wrong. If the issue persists, please contact support at reach@peko.one',
    unavailable: 'CTRLPay is temporarily unavailable. Please try again in a few minutes.',
    ownerOnly: 'Only the account owner can manage the CTRLPay wallet.',
    notConnected: 'Sign in to CTRLPay to continue.',
    reconnectRequired: 'Your CTRLPay sign-in has ended. Sign in to CTRLPay again to continue.',
    signInExpired: 'This sign-in has expired. Please start again from the CTRLPay page.',
    signInFailed: 'We could not complete the CTRLPay sign-in. Please try again.',
    accountLinkedElsewhere: 'This CTRLPay account is already linked to another Peko account.',
    consentMissing: 'Please accept the consent before verifying the PAN.',
    consentRejected: 'The consent could not be recorded. Refresh the page and try again.',
    panLocked: 'The PAN can no longer be changed for this application.',
    stageMismatch: 'Your application has moved on. Refresh the page to see the latest status.',
    rateLimited: 'Too many attempts. Please wait a while and try again.',
    ckycInvalidOtp: 'That code is not right. Please check it and try again.',
    ckycOtpExpired: 'This code has expired. Request a new one.',
    ckycResendLimit: 'You have used all the code resends for this verification.',
    phoneOtpCooldown: 'Please wait a few seconds before requesting another code.',
    phoneOtpInvalid: 'That code is not right or has expired. Please try again.',
    documentType: 'Only PDF, JPG, PNG or TIFF files can be uploaded.',
    documentSize: 'Files must be 10 MB or smaller.',
    documentContent: 'The file does not match its type. Please upload the original PDF or image.',
    documentUnknown: 'This document is not on your checklist.',
    documentVerified: 'A verified document cannot be removed.',
    documentUploadFailed: 'The upload did not go through. Please try again.',
    documentsIncomplete: 'Upload every required document before submitting.',
    ovdTypeRequired: 'Choose the type of identity document.',
    pincodeInvalid: 'Enter a valid 6-digit PIN code.',
    walletNotReady: 'Your wallet is not ready yet.',
    senderDuplicate: 'This bank account is already whitelisted.',
    senderLimit: 'You can whitelist up to 5 bank accounts.',
    senderRejected: 'This bank account could not be whitelisted. Check the details and try again.',
    senderNotFound: 'This bank account is not on your list.',
    exportTooLarge: 'Too many transactions for one download. Choose a shorter date range.',
    statementRange: 'Choose a date range of up to one year, with the start date before the end date.',
};

module.exports = {
    CTRLPAY_METHOD,
    CTRLPAY_METHOD_PATH,
    CTRLPAY_CUSTOMER_TYPE,
    CTRLPAY_SERVICE_LABEL,
    CTRLPAY_ACCESS_KEY,
    CTRLPAY_SUCCESS,
    CTRLPAY_APPLICATION_FILE_NAMES,
    CTRLPAY_DOCUMENT_CONTENT_TYPES,
    CTRLPAY_WEB_OVD_TYPES,
    CTRLPAY_TRANSACTION_STATUS,
    CTRLPAY_TRANSACTION_KIND,
    CTRLPAY_TRANSACTION_METHODS,
    CTRLPAY_LIMITS,
    CTRLPAY_MESSAGES,
};
