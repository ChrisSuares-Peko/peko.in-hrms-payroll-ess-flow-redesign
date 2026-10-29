'use strict';

// Registry of admin-managed email template identifiers owned by officeAndBusiness.
// A template is identified by `service` + `key` (the unique index on
// adminEmailTemplates, shared by every microservice). Add one entry per email as
// it's migrated — anything not here keeps rendering locally.
//
// officeAndBusiness spans many business areas, so each resolve* call passes its own
// service from EMAIL_TEMPLATE_SERVICES. Services/keys below are derived from IN's
// own live flows only (FE route + mounted BE route); dead-in-IN flows (attestation,
// corporate tax registration, quik links, OAB MFA) are deliberately absent.
// Bare service names may be shared with other microservices (e.g. `others` also uses
// WORKSPACES) — keys must stay globally unique across all microservices.
const EMAIL_TEMPLATE_SERVICE = 'INVOICING';

const EMAIL_TEMPLATE_SERVICES = {
    INVOICING: 'INVOICING',
    ESIGN: 'ESIGN',
    WORKS: 'WORKS',
    WORKSPACES: 'WORKSPACES',
    WHATSAPP: 'WHATSAPP',
    PEKO_CONNECT: 'PEKO_CONNECT',
    CARBON_FOOTPRINT: 'CARBON_FOOTPRINT',
    DOMAIN_HOSTING: 'DOMAIN_HOSTING',
    COMPLIANCE: 'COMPLIANCE',
    GLOBAL_BUSINESS_SETUP: 'GLOBAL_BUSINESS_SETUP',
    BUSINESS_REGISTRATION: 'BUSINESS_REGISTRATION',
};

const EMAIL_TEMPLATE_KEYS = {
    // INVOICING — utils/emailTemplates/{invoicingV2,documentEmailTemplate,paymentReceiptTemplate,invoice,KYBTemplate}.js
    INVOICE_GENERATED: 'INVOICE_GENERATED',
    QUOTATION_SHARE: 'QUOTATION_SHARE',
    PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
    RECURRING_SCHEDULE_CREATED: 'RECURRING_SCHEDULE_CREATED',
    INVOICE_GUIDELINE_REMINDER: 'INVOICE_GUIDELINE_REMINDER',
    // payment MS owns PAYMENT_LINK/PAYMENT_LINK_GENERATED — these are the invoicing
    // payment links (controllers/corporate/paymentLinks.js), named distinctly.
    INVOICE_PAYMENT_LINK_CREATED: 'INVOICE_PAYMENT_LINK_CREATED',
    INVOICE_PAYMENT_LINK_PAID: 'INVOICE_PAYMENT_LINK_PAID',
    COLLECTOR_KYB_APPROVED: 'COLLECTOR_KYB_APPROVED',
    COLLECTOR_KYB_REJECTED: 'COLLECTOR_KYB_REJECTED',
    // ESIGN — services/eSign.js, utils/eSignCompletedTemplate.js (scheduler owns ESIGN_REMINDER)
    ESIGN_COMPLETED: 'ESIGN_COMPLETED',
    // WORKS — controllers/corporate/works.js, utils/emailTemplates/works.js
    WORKS_PURCHASE_SUCCESS: 'WORKS_PURCHASE_SUCCESS',
    WORKS_PAYMENT_FAILED: 'WORKS_PAYMENT_FAILED',
    // WORKSPACES ("Office Address" in IN FE) — controllers/corporate/workspace.js
    WORKSPACE_BOOKING_SUCCESS: 'WORKSPACE_BOOKING_SUCCESS',
    WORKSPACE_RENEWAL_REMINDER: 'WORKSPACE_RENEWAL_REMINDER',
    WORKSPACE_PAYMENT_FAILED: 'WORKSPACE_PAYMENT_FAILED',
    // WHATSAPP — controllers/corporate/whatsAppForBusiness.js
    WHATSAPP_PAYMENT_SUCCESS: 'WHATSAPP_PAYMENT_SUCCESS',
    WHATSAPP_PAYMENT_FAILED: 'WHATSAPP_PAYMENT_FAILED',
    WABA_PROFILE_UPDATED: 'WABA_PROFILE_UPDATED',
    BOT_BUILDER_ADDON_ADMIN_NOTICE: 'BOT_BUILDER_ADDON_ADMIN_NOTICE',
    SHOPIFY_INTEGRATION_ADDON_ADMIN_NOTICE: 'SHOPIFY_INTEGRATION_ADDON_ADMIN_NOTICE',
    // PEKO_CONNECT — controllers/corporate/peko_connect.js
    CONNECTION_REQUEST: 'CONNECTION_REQUEST',
    // CARBON_FOOTPRINT — controllers/corporate/carbonFootprint.js
    CARBON_CREDIT_PURCHASE_SUCCESS: 'CARBON_CREDIT_PURCHASE_SUCCESS',
    CARBON_FOOTPRINT_PAYMENT_FAILED: 'CARBON_FOOTPRINT_PAYMENT_FAILED',
    // DOMAIN_HOSTING — controllers/{corporate,admin}/domainAndHosting.js
    DOMAIN_HOSTING_PURCHASE_SUCCESS: 'DOMAIN_HOSTING_PURCHASE_SUCCESS',
    DOMAIN_HOSTING_PAYMENT_FAILED: 'DOMAIN_HOSTING_PAYMENT_FAILED',
    DOMAIN_HOSTING_REFUND_INITIATED: 'DOMAIN_HOSTING_REFUND_INITIATED',
    // COMPLIANCE — controllers/{corporate,admin}/compliance.js
    COMPLIANCE_APPLICATION_RECEIVED: 'COMPLIANCE_APPLICATION_RECEIVED',
    COMPLIANCE_DOCUMENTS_SUBMITTED: 'COMPLIANCE_DOCUMENTS_SUBMITTED',
    COMPLIANCE_STATUS_UPDATE: 'COMPLIANCE_STATUS_UPDATE',
    // GLOBAL_BUSINESS_SETUP — controllers/admin/globalBusinessSetup.js
    GBS_NAME_APPROVED: 'GBS_NAME_APPROVED',
    GBS_SHAREHOLDER_VERIFIED: 'GBS_SHAREHOLDER_VERIFIED',
    GBS_COMPLETED: 'GBS_COMPLETED',
    GBS_DELAYED: 'GBS_DELAYED',
    GBS_REJECTED: 'GBS_REJECTED',
    // BUSINESS_REGISTRATION — controllers/corporate/businessRegistration.js
    BUSINESS_REGISTRATION_APPLICATION_SUBMITTED: 'BUSINESS_REGISTRATION_APPLICATION_SUBMITTED',
};

// Static mirror powering the admin panel's Service/Key/Variables endpoints — no DB
// lookups, manually kept in sync with each microservice's own registry + call
// sites (same pattern as Peko-AE). Only lists keys with a live resolveEmailTemplate
// call site; a registered-but-unwired key stays out until it's actually migrated.
// Update this alongside the owning registry and call site.
const EMAIL_TEMPLATE_KEYS_BY_SERVICE = {
    // service: INVOICING — officeAndBusiness owns and resolves these locally.
    // controllers/corporate/{invoicingV2,invoiceRecurring,invoiceGuideline,paymentLinks}.js,
    // controllers/admin/collectorKyb.js, utils/emailTemplates/{invoicingV2,documentEmailTemplate,
    // paymentReceiptTemplate,invoice,KYBTemplate}.js. Amounts are pre-formatted with ₹;
    // INVOICE_GUIDELINE_REMINDER's `body` is the user-authored reminder text as one HTML blob.
    INVOICING: {
        emailTemplateKeys: {
            // contactLine = "email or phone" pre-rendered; corporatePhone is '-' when absent.
            INVOICE_GENERATED: {
                variables: {
                    customerName: '', invoiceNumber: '', invoiceDate: '', dueDate: '',
                    amountDue: '', corporateName: '', corporateEmail: '', corporatePhone: '', contactLine: '',
                    docLabel: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            QUOTATION_SHARE: {
                variables: {
                    quotationNumber: '', customerName: '', quotationDate: '', validUntil: '',
                    totalAmount: '', companyName: '', acceptUrl: '', rejectUrl: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            PAYMENT_RECEIPT: {
                variables: {
                    receiptNo: '', paymentDate: '', amount: '', invoiceNumber: '',
                    customerName: '', billerName: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            RECURRING_SCHEDULE_CREATED: {
                variables: {
                    startDate: '', frequency: '', endCondition: '', status: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            INVOICE_GUIDELINE_REMINDER: {
                variables: {
                    body: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // Payment links + collector KYB — controllers/corporate/paymentLinks.js,
            // controllers/admin/collectorKyb.js. `amount` is raw (no ₹ sign), expiryHours already
            // converted from minutes, rejectReasonHtml is a pre-rendered box.
            INVOICE_PAYMENT_LINK_CREATED: {
                variables: {
                    amount: '', link: '', corporateName: '', referenceId: '', expiryHours: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            INVOICE_PAYMENT_LINK_PAID: {
                variables: {
                    name: '', amount: '', date: '', referenceId: '', customerName: '', customerMobile: '', customerEmail: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            COLLECTOR_KYB_APPROVED: {
                variables: {
                    name: '', loginUrl: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            COLLECTOR_KYB_REJECTED: {
                variables: {
                    name: '', rejectReasonHtml: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: COMPLIANCE — controllers/corporate/compliance.js, controllers/admin/compliance.js,
    // utils/emailTemplates/compliance.js. statusMessageHtml is the pre-rendered per-status
    // sentence (admin templates can't branch); remarks is '-' when empty.
    COMPLIANCE: {
        emailTemplateKeys: {
            COMPLIANCE_APPLICATION_RECEIVED: {
                variables: {
                    name: '', complianceId: '', complianceType: '', title: '', status: '', statusLabel: '',
                    actionUrl: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            COMPLIANCE_DOCUMENTS_SUBMITTED: {
                variables: {
                    name: '', complianceId: '', complianceType: '', title: '', status: '', statusLabel: '',
                    actionUrl: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            COMPLIANCE_STATUS_UPDATE: {
                variables: {
                    name: '', complianceId: '', complianceType: '', title: '', status: '', statusLabel: '',
                    statusMessageHtml: '', remarks: '', actionUrl: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: CARBON_FOOTPRINT — controllers/corporate/carbonFootprint.js, utils/emailTemplates/carbonFootprint.js
    CARBON_FOOTPRINT: {
        emailTemplateKeys: {
            CARBON_CREDIT_PURCHASE_SUCCESS: {
                variables: {
                    name: '', transactionId: '', amount: '', purchasedOn: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            CARBON_FOOTPRINT_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', url: '', failedOn: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: DOMAIN_HOSTING — controllers/corporate/domainAndHosting.js, controllers/admin/domainAndHosting.js,
    // utils/emailTemplates/domainAndHosting.js. itemsHtml / refundDetailsHtml are pre-rendered detail rows.
    DOMAIN_HOSTING: {
        emailTemplateKeys: {
            DOMAIN_HOSTING_PURCHASE_SUCCESS: {
                variables: {
                    name: '', transactionId: '', amount: '', purchasedOn: '', itemsHtml: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            DOMAIN_HOSTING_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', url: '', failedOn: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            DOMAIN_HOSTING_REFUND_INITIATED: {
                variables: {
                    name: '', amount: '', transactionId: '', serviceType: '', refundDetailsHtml: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: GLOBAL_BUSINESS_SETUP — controllers/admin/globalBusinessSetup.js, utils/emailTemplates/globalBusinessSetup.js.
    // url = dashboard URL for NAME_APPROVED / SHAREHOLDER_VERIFIED, application view-details URL otherwise.
    GLOBAL_BUSINESS_SETUP: {
        emailTemplateKeys: {
            GBS_NAME_APPROVED: {
                variables: {
                    name: '', proposedName: '', url: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            GBS_SHAREHOLDER_VERIFIED: {
                variables: {
                    name: '', url: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            GBS_COMPLETED: {
                variables: {
                    name: '', url: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            GBS_DELAYED: {
                variables: {
                    name: '', url: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            GBS_REJECTED: {
                variables: {
                    name: '', url: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: WHATSAPP — controllers/corporate/whatsAppForBusiness.js, utils/emailTemplates/whatsappForBusiness.js.
    // BOT_BUILDER_ADDON_ADMIN_NOTICE is an internal Peko-admin notice (default Peko identity).
    WHATSAPP: {
        emailTemplateKeys: {
            WHATSAPP_PAYMENT_SUCCESS: {
                variables: {
                    name: '', transactionId: '', serviceName: '', amount: '', surcharge: '', dateTime: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            WHATSAPP_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', url: '', failedOn: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            WABA_PROFILE_UPDATED: {
                variables: {
                    name: '', planActivatedOn: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            BOT_BUILDER_ADDON_ADMIN_NOTICE: {
                variables: {
                    corporateName: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            SHOPIFY_INTEGRATION_ADDON_ADMIN_NOTICE: {
                variables: {
                    corporateName: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: WORKS — controllers/corporate/works.js, utils/emailTemplates/works.js.
    // amount / planPrice arrive ₹-prefixed and en-IN formatted.
    WORKS: {
        emailTemplateKeys: {
            WORKS_PURCHASE_SUCCESS: {
                variables: {
                    name: '', amount: '', transactionId: '', orderDate: '', workName: '', planName: '', planPrice: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            WORKS_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', url: '', failedOn: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: PEKO_CONNECT — controllers/corporate/peko_connect.js, utils/emailTemplates/peko_connect.js
    PEKO_CONNECT: {
        emailTemplateKeys: {
            CONNECTION_REQUEST: {
                variables: {
                    name: '', corporateName: '', contact: '', email: '', requirement: '', message: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: BUSINESS_REGISTRATION — controllers/corporate/businessRegistration.js,
    // utils/emailTemplates/businessRegistration.js. detailsHtml is a pre-rendered blob of the
    // Application ID / Entity Type / Proposed Name / Status rows.
    BUSINESS_REGISTRATION: {
        emailTemplateKeys: {
            BUSINESS_REGISTRATION_APPLICATION_SUBMITTED: {
                variables: {
                    name: '', applicationId: '', entityLabel: '', proposedName: '', trackUrl: '',
                    detailsHtml: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: ESIGN — services/eSign.js (emailEsignComplete), utils/eSignCompletedTemplate.js.
    // Resolves the real reseller partner via the eSign doc's own credentialId ->
    // credential.registeredBy -> fetchPartnerDetails, falling back to partnerLogos()
    // only when the doc has no credential on it.
    // (ESIGN_REMINDER is owned by the scheduler MS under SCHEDULER.)
    ESIGN: {
        emailTemplateKeys: {
            ESIGN_COMPLETED: {
                variables: {
                    documentName: '', documentUrl: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: AUTH — bare name shared by two microservices (users, travel); no runtime
    // collision since the unique DB constraint is (service, key, partnerId) and the keys
    // below are globally distinct — this block just merges both for the admin-panel mirror.
    // users/utils/emailTemplateKeys.js, matches AE's bare AUTH exactly.
    // SUBCORPORATE_WELCOME/EMAIL_VERIFICATION omitted — deferred, no call site.
    AUTH: {
        emailTemplateKeys: {
            SIGNUP_OTP: { variables: { title: '', branding: '', otpHtml: '', headerHtml: '', footerHtml: '' } },
            CORPORATE_ACCOUNT_CREATED: {
                variables: { name: '', userName: '', email: '', branding: '', portalUrl: '', headerHtml: '', footerHtml: '' },
            },
            OTP_VERIFICATION: { variables: { name: '', branding: '', otpHtml: '', headerHtml: '', footerHtml: '' } },
            RESET_PASSWORD: { variables: { name: '', resetUrl: '', branding: '', headerHtml: '', footerHtml: '' } },
            RESET_PASSWORD_SUCCESS: {
                variables: {
                    name: '', email: '', username: '', passwordHeading: '', changedOrSet: '',
                    branding: '', headerHtml: '', footerHtml: '',
                },
            },
            SET_PASSWORD: {
                variables: { name: '', url: '', branding: '', signupIntro: '', headerHtml: '', footerHtml: '' },
            },
            SET_NEW_PASSWORD: {
                variables: { username: '', resetUrl: '', message: '', branding: '', headerHtml: '', footerHtml: '' },
            },
            SUBCORPORATE_ACCESS_UPDATED: {
                variables: { name: '', email: '', branding: '', servicesHtml: '', headerHtml: '', footerHtml: '' },
            },
            SUBCORPORATE_ACCESS_DISABLED: { variables: { name: '', branding: '', headerHtml: '', footerHtml: '' } },
            ESS_WELCOME: {
                variables: { employeeName: '', branding: '', actionHtml: '', headerHtml: '', footerHtml: '' },
            },
            ESS_EMAIL_CHANGED: {
                variables: { employeeName: '', oldEmail: '', newEmail: '', branding: '', headerHtml: '', footerHtml: '' },
            },
            // travel/utils/templatesForEmails.js (commonEmailOtpVerification),
            // travel/configs/local_auth.js. Matches others MS's own OTP_MFA_LOGIN design
            // exactly (same purpose - corporate-user MFA login code) - reused rather than a
            // new Figma design since it's the same email for a different microservice.
            OTP_MFA_LOGIN: {
                variables: { otpBoxesHtml: '', username: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: SYSTEM_USER — others/models/use-cases/systemUser.js
    SYSTEM_USER: {
        emailTemplateKeys: {
            SET_NEW_PASSWORD: {
                variables: { username: '', resetUrl: '', message: '', branding: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: PROFILE — others/controllers/admin/credential.js, others/controllers/admin/corporateUser.js
    PROFILE: {
        emailTemplateKeys: {
            OTP_MFA_LOGIN: { variables: { otpBoxesHtml: '', username: '', headerHtml: '', footerHtml: '' } },
            PROFILE_RESET_PASSWORD_SUCCESS: {
                variables: { name: '', accountNumberClause: '', branding: '', headerHtml: '', footerHtml: '' },
            },
            BANK_ACCOUNT_ADDED_SUCCESS: { variables: { username: '', branding: '', headerHtml: '', footerHtml: '' } },
            BANK_ACCOUNT_UPDATE_SUCCESS: { variables: { username: '', branding: '', headerHtml: '', footerHtml: '' } },
            BANK_ACCOUNT_DELETED_SUCCESS: { variables: { username: '', branding: '', headerHtml: '', footerHtml: '' } },
            BANK_ACCOUNT_VERIFICATION_OTP: {
                variables: { username: '', operation: '', otpBoxesHtml: '', branding: '', headerHtml: '', footerHtml: '' },
            },
            PROFILE_UPDATE_SUCCESS: { variables: { username: '', branding: '', headerHtml: '', footerHtml: '' } },
            PROFILE_UPDATE_OTP: {
                variables: { username: '', otpBoxesHtml: '', branding: '', headerHtml: '', footerHtml: '' },
            },
            ADDRESS_ADDED_SUCCESS: { variables: { username: '', branding: '', headerHtml: '', footerHtml: '' } },
            ADDRESS_UPDATE_SUCCESS: { variables: { username: '', branding: '', headerHtml: '', footerHtml: '' } },
            ADDRESS_DELETED_SUCCESS: { variables: { username: '', branding: '', headerHtml: '', footerHtml: '' } },
            ADDRESS_VERIFICATION_OTP: {
                variables: { username: '', operation: '', otpBoxesHtml: '', branding: '', headerHtml: '', footerHtml: '' },
            },
            REFERRAL_INVITE: { variables: { referralLink: '', branding: '', headerHtml: '', footerHtml: '' } },
        },
    },
    // service: ORDERS — others/controllers/admin/order.js
    ORDERS: {
        emailTemplateKeys: {
            OTP_VERIFICATION_COMMON: { variables: { otpBoxesHtml: '', headerHtml: '', footerHtml: '' } },
        },
    },
    // service: HOTEL — bare name shared by two microservices (others, travel); no runtime
    // collision since the unique DB constraint is (service, key, partnerId) and the keys
    // below are globally distinct — this block just merges both for the admin-panel mirror.
    HOTEL: {
        emailTemplateKeys: {
            // others/controllers/admin/hotels.js
            HOTEL_BOOKING_CONFIRMATION_EMAIL: {
                variables: {
                    name: '', hotelName: '', hotelAddress: '', hotelImageUrl: '',
                    checkInDateFormatted: '', checkInTimeFormatted: '', checkOutDateFormatted: '', checkOutTimeFormatted: '',
                    hotelAdultCount: '', hotelChildCount: '', nights: '', nightsLabel: '', hotelRoomCount: '',
                    guestName: '', guestType: '', manageBookingUrl: '', branding: '', headerHtml: '', footerHtml: '',
                },
            },
            // travel/utils/emailTemplates/hotel/hotelTicketPDF.js (generateHotelTicketAndSendToMailNew),
            // travel/controllers/corporate/hotel.js (generateAttachmentAndSendEmailAndNotification)
            HOTEL_BOOKING_CONFIRMATION: {
                variables: {
                    user: '', hotelName: '', address: '', bookingReferenceId: '',
                    checkInDate: '', checkInTime: '', checkOutDate: '', checkOutTime: '',
                    hotelAdultCount: '', hotelChildCount: '', nightsText: '', hotelRoomCount: '',
                    mainGuestLabel: '', hotelImageUrl: '', manageBookingUrl: '', branding: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // travel/utils/emailTemplates/hotel/hotelTicketPDF.js (HotelBookingCancelledEmailTemplate),
            // travel/controllers/corporate/hotel.js (3 call sites, one shared helper:
            // sendHotelBookingCancelledEmail) - previously a dead/broken send (the function this
            // migration replaces was imported but never defined, so it threw at runtime).
            HOTEL_CANCELLED: {
                variables: {
                    userName: '', hotelName: '', hotelAddress: '', roomsText: '', nightsText: '',
                    guestCountText: '', checkInDateText: '', checkOutDateText: '', mainGuestName: '',
                    branding: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates/common.js (emailOTPTemaplte),
            // controllers/corporate/hotel.js (getOtpCancel). Reuses the same per-digit
            // OTP-box design/copy pattern as FLIGHT_CANCELLATION_OTP (no Figma design exists
            // for this one specifically - confirmed with the user before building).
            HOTEL_CANCELLATION_OTP: {
                variables: { name: '', otpBoxesHtml: '', branding: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: PAYROLL — payroll (Mongo-backed, resolved via HTTP through
    // controllers/corporate/emailTemplates.js, not a local Sequelize registry).
    PAYROLL: {
        emailTemplateKeys: {
            DOCUMENT_REQUEST_FULFILLED: { variables: { name: '', company: '', headerHtml: '', footerHtml: '' } },
            REIMBURSEMENT_PROCESSED: {
                variables: { employeeName: '', reimbursementReason: '', amount: '', processedDate: '', headerHtml: '', footerHtml: '' },
            },
            ANNOUNCEMENT: {
                variables: { fullName: '', details: '', hrManagerName: '', headerHtml: '', footerHtml: '' },
            },
            LEAVE_SUBMISSION: { variables: { employeeName: '', start: '', end: '', headerHtml: '', footerHtml: '' } },
            LEAVE_RESUBMISSION: {
                variables: { employeeName: '', start: '', end: '', hrManagerName: '', headerHtml: '', footerHtml: '' },
            },
            EMPLOYEE_WELCOME: {
                variables: { employeeName: '', organizationName: '', heroImage: '', headerHtml: '', footerHtml: '' },
            },
            PAYSLIP_EMAIL: {
                variables: { monthName: '', companyName: '', employeeName: '', hrManagerName: '', year: '', headerHtml: '', footerHtml: '' },
            },
            ANNIVERSARY_1_TO_4_YEARS: {
                variables: {
                    employeeName: '', companyName: '', experience: '', companyLogo: '', text: '',
                    heroImage: '', headerHtml: '', footerHtml: '',
                },
            },
            ANNIVERSARY_4_PLUS_YEARS: {
                variables: { employeeName: '', companyName: '', experience: '', companyLogo: '', text: '', heroImage: '', headerHtml: '', footerHtml: '' },
            },
            BIRTHDAY: { variables: { name: '', dateOfBirth: '', today: '', heroImage: '', headerHtml: '', footerHtml: '' } },
            HOLIDAY_REMINDER: {
                variables: { formattedStartDate: '', title: '', hrManagerName: '', headerHtml: '', footerHtml: '' },
            },
            REIMBURSEMENT_REQUEST_TO_CORPORATE: {
                variables: { adminName: '', employeeName: '', reason: '', amount: '', reviewUrl: '', headerHtml: '', footerHtml: '' },
            },
            REIMBURSEMENT_REQUEST_TO_EMPLOYEE: {
                variables: { employeeName: '', reason: '', amount: '', viewUrl: '', headerHtml: '', footerHtml: '' },
            },
            REIMBURSEMENT_DECISION_PROCESSED: {
                variables: { employeeName: '', organizationName: '', detailLinesHtml: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            REIMBURSEMENT_DECISION_REJECTED: {
                variables: { employeeName: '', organizationName: '', detailLinesHtml: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            LEAVE_STATUS_UPDATE: {
                variables: { name: '', company: '', headline: '', leaveType: '', period: '', days: '', notes: '', headerHtml: '', footerHtml: '' },
            },
            LEAVE_REQUEST_TO_CORPORATE: {
                variables: { adminName: '', employeeName: '', leaveType: '', start: '', end: '', reason: '', reviewUrl: '', headerHtml: '', footerHtml: '' },
            },
            LEAVE_REQUEST_TO_EMPLOYEE: {
                variables: {
                    employeeName: '', leaveType: '', start: '', end: '', reason: '', leaveCount: '',
                    halfDaySelection: '', hasSupportingDoc: '', viewUrl: '', headerHtml: '', footerHtml: '',
                },
            },
            OVERTIME_STATUS_UPDATE: {
                variables: { employeeName: '', organizationName: '', requestStatus: '', overtimeDateLine: '', detailLinesHtml: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            OVERTIME_REQUEST_TO_CORPORATE: {
                variables: { adminName: '', employeeName: '', overtimeDate: '', overtimeHours: '', reason: '', reviewUrl: '', headerHtml: '', footerHtml: '' },
            },
            DISPUTE_RECEIVED: {
                variables: { employeeName: '', organizationName: '', disputeSubject: '', disputeReason: '', disputeDate: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            DISPUTE_RAISED_TO_CORPORATE: {
                variables: { adminName: '', employeeName: '', disputeDate: '', disputeReason: '', reviewUrl: '', headerHtml: '', footerHtml: '' },
            },
            DOCUMENT_REQUEST_TO_CORPORATE: {
                variables: { adminName: '', employeeName: '', documentType: '', reviewUrl: '', headerHtml: '', footerHtml: '' },
            },
            DOCUMENT_UPLOADED: {
                variables: { employeeName: '', organizationName: '', documentType: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            EMPLOYEE_ADDED_TO_PAYROLL: {
                variables: { adminName: '', employeeName: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            EMPLOYEE_OFFBOARDED: {
                variables: { adminName: '', employeeName: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            PROFILE_UPDATE_APPROVED: {
                variables: { employeeName: '', organizationName: '', detailLinesHtml: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            SALARY_APPROVED: {
                variables: { adminName: '', forPeriod: '', branding: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            COMPANY_INFO_UPDATED: {
                variables: { adminName: '', branding: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            LEAVE_SETTINGS_UPDATED: {
                variables: { adminName: '', branding: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            ATTENDANCE_SETTINGS_UPDATED: {
                variables: { adminName: '', branding: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            ONBOARDING_DOCUMENTS_UPDATED: {
                variables: { adminName: '', branding: '', ctaUrl: '', headerHtml: '', footerHtml: '' },
            },
            ASSET_ADDED_TO_INVENTORY: {
                variables: { adminName: '', assetName: '', assetId: '', assetCategory: '', headerHtml: '', footerHtml: '' },
            },
            ASSET_ASSIGNED_TO_EMPLOYEE: {
                variables: { companyName: '', employeeName: '', assetName: '', assetId: '', assignedDate: '', headerHtml: '', footerHtml: '' },
            },
            ASSET_DECOMMISSIONED: {
                variables: { adminName: '', assetName: '', assetId: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: BILL_PAYMENT — payment/controllers/corporate/{commonBillHandler,challan,telecomPayments/prepaid}.js
    BILL_PAYMENT: {
        emailTemplateKeys: {
            BILL_PAYMENT_FAILED: {
                variables: { serviceType: '', account: '', serviceProvider: '', name: '', branding: '', website: '', logo: '', headerHtml: '', footerHtml: '' },
            },
            BILL_PAYMENT_SUCCESS: {
                variables: { serviceType: '', name: '', branding: '', website: '', loginUrl: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: PAYMENT_LINK — payment/controllers/admin/paymentLink.js
    PAYMENT_LINK: {
        emailTemplateKeys: {
            PAYMENT_LINK_GENERATED: {
                variables: { amount: '', link: '', contactPerson: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: REFUND — payment/controllers/admin/refundTransaction.js, payment/utils/{ccavenueGateway,cashfreeGateway}.js
    REFUND: {
        emailTemplateKeys: {
            TRANSACTION_REFUND_REQUEST_OTP: {
                variables: { name: '', otp: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            REFUND_INITIATED: {
                variables: { name: '', amount: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // AE has a matching v2 design + resolver wired (common.js's refundFailure, keys
            // BANK_REFUND_FAILURE/CARD_REFUND_FAILURE) — but for the corporate customer when
            // their own refund request fails. IN's version is an internal ops alert sent to the
            // "pekoWebsite" settings email list when an admin-initiated refund's automated
            // gateway call itself throws — same v2 design copied, IN's own internal-notice
            // audience/content kept unchanged.
            REFUND_FAILED: {
                variables: { name: '', amount: '', transactionId: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: ESIM — bare name shared by two microservices (payment, travel); no runtime
    // collision since the unique DB constraint is (service, key, partnerId) and the keys
    // below are globally distinct — this block just merges both for the admin-panel mirror.
    ESIM: {
        emailTemplateKeys: {
            // payment/services/bulkPayment.js
            ESIM_BULK_BUY_SUCCESS: {
                variables: {
                    transactionId: '', amount: '', quantity: '', packageName: '', heading: '',
                    nameOfOperator: '', name: '', branding: '', website: '',
                    activationNoteHtml: '', qrCodeHtml: '', headerHtml: '', footerHtml: '',
                },
            },
            // travel/utils/emailTemplates/eSim.js (generateEsimSuccessEmail),
            // travel/controllers/corporate/eSIM.js. Covers both real variants (fresh SIM
            // purchase and a data top-up on an existing eSIM) - only the fields shared by both
            // variants are admin-editable; the type-specific block (Network+package+quantity+
            // QR+install-guide for SIM, or Network+validity+data for TOPUP) stays JS-fallback-
            // only, same as the flight-itinerary loops - confirmed with the user rather than
            // guessed, since AE's own registry lists both variants' fields together without
            // resolving this (an empty variable used in the admin body kills the whole
            // template, and quantity/validity/data are each empty for one variant).
            ESIM_PAYMENT_SUCCESS: {
                variables: {
                    heading: '', introText: '', placedOn: '', transactionId: '', amount: '',
                    packageName: '', branding: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates/common.js (commonFailedTemplate - shared generic failure
            // template, also wired for LOGISTICS_PAYMENT_FAILED under the LOGISTICS service),
            // travel/controllers/corporate/eSIM.js
            ESIM_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', paymentDate: '', baseUrl: '', branding: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // paymentGateway/controllers/corporate/eSimTunz.js, paymentGateway/utils/emailTemplates/eSim.js
            // (generateEsimBuySingleSuccessEmail) — self-purchase branch.
            ESIM_TUNZ_BUY_SUCCESS: {
                variables: {
                    transactionId: '', amount: '', quantity: '', esimIds: '', packageName: '', heading: '', nameOfOperator: '',
                    branding: '', website: '', logo: '', headerHtml: '', footerHtml: '',
                },
            },
            // paymentGateway/controllers/corporate/eSimTunz.js, paymentGateway/utils/emailTemplates/eSim.js
            // (generateEsimRecipientEmail) — gift/recipient-purchase branch. No AE reference design;
            // newly invented key/variables.
            ESIM_TUNZ_RECIPIENT_SUCCESS: {
                variables: {
                    recipientName: '', purchaserName: '', transactionId: '', packageName: '', nameOfOperator: '',
                    branding: '', website: '', logo: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: LOGISTICS — travel/controllers/corporate/logistics_V3.js
    LOGISTICS: {
        emailTemplateKeys: {
            // utils/emailTemplates/common.js (commonFailedTemplate - same shared function as
            // ESIM_PAYMENT_FAILED under the ESIM service)
            LOGISTICS_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', paymentDate: '', baseUrl: '', branding: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates/logistics.js (generatePaymentSuccessEmailLogisticsV3)
            LOGISTICS_PAYMENT_SUCCESS_V3: {
                variables: {
                    name: '', corporateTxnId: '', from: '', to: '', senderName: '',
                    senderAddressLine: '', senderCity: '', senderCountryName: '', senderPostCode: '',
                    senderMobile: '', receiverName: '', receiverAddressLine: '', receiverCity: '',
                    receiverCountryName: '', receiverPostCode: '', receiverMobile: '', totalAmount: '',
                    branding: '', baseUrl: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates/logistics.js (generatePaymentSuccessEmailReturnLogisticsV3)
            LOGISTICS_RETURN_PAYMENT_SUCCESS_V3: {
                variables: {
                    name: '', corporateTxnId: '', deliveredTxnId: '', requestedOn: '', branding: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates/logistics.js (generateReturnCompletionSuccessEmailLogisticsV3)
            LOGISTICS_RETURN_COMPLETION_SUCCESS_V3: {
                variables: {
                    name: '', corporateTxnId: '', requestedOn: '', completionDate: '',
                    returnTransactionId: '', branding: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates/logistics.js (generateShipmentCancelAdminInformEmailLogisticsV3)
            // - internal admin-notification email (Shiprocket webhook), not sent to the customer.
            LOGISTICS_SHIPMENT_CANCEL_ADMIN_INFORM_V3: {
                variables: {
                    orderId: '', requestedOn: '', branding: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: MFA — payment/configs/local_auth.js
    MFA: {
        emailTemplateKeys: {
            MFA_AUTH_CODE: {
                variables: { username: '', otp: '', otpExpiryMinutes: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: KYB — payment/controllers/admin/kybDetails.js
    KYB: {
        emailTemplateKeys: {
            KYB_DOC_UPDATE: {
                variables: { name: '', status: '', remarks: '', kybLink: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            KYB_DOC_REUPLOAD: {
                variables: { name: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            KYB_DETAILS_COMPLETED: {
                variables: { name: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: SCHEDULER — every scheduler MS template shares one service value (not split
    // by area) since EMAIL_TEMPLATE_SERVICES must be namespaced per-microservice, not bare;
    // keys below (globally unique constants in scheduler/utils/emailTemplateKeys.js) are what
    // distinguish individual templates within it.
    SCHEDULER: {
        emailTemplateKeys: {
            // scheduler/services/anniversary.js
            ANNIVERSARY_1_TO_4_YEARS: {
                variables: { employeeName: '', companyName: '', experience: '', text: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            ANNIVERSARY_4_PLUS_YEARS: {
                variables: { employeeName: '', companyName: '', experience: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // scheduler/services/holiDay.js (sendBirthDayMails)
            EMPLOYEE_BIRTHDAY_WISH: {
                variables: { name: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // scheduler/services/salary.js (emailPdfFile)
            PAYSLIP_EMAIL: {
                variables: {
                    monthName: '', companyName: '', employeeName: '', hrManagerName: '', year: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // scheduler/services/eSign.js
            ESIGN_REMINDER: {
                variables: { userName: '', documentName: '', date: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // scheduler/services/holiDay.js
            HOLIDAY_REMINDER: {
                variables: { title: '', start: '', hrManagerName: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // scheduler/services/{invoiceGuideline,invoicingV2Reminder}.js
            INVOICE_REMINDER: {
                variables: { bodyData: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // scheduler/services/recurringInvoices.js
            INVOICE_PDF_SHARE: {
                variables: {
                    docLabel: '', customerName: '', invoiceNumber: '', invoiceDate: '', dueDate: '',
                    amountDue: '', corporateName: '', corporateEmail: '', currencySymbol: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // scheduler/services/subscriptionPreRiminder.js
            SUBSCRIPTION_PRE_REMINDER: {
                variables: {
                    heading: '', name: '', bodyText: '', packageName: '', billingLabel: '',
                    renewalAmountHtml: '', dateLabel: '', endDate: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // scheduler/services/{subscriptionAutoRenewal,subscriptionGracePeriodRetry,whatsAppTriggerSubscriptionCharges,whatsAppSubscriptionAutoRenewal}.js
            SUBSCRIPTION_RENEWAL_FAILURE: {
                variables: {
                    name: '', packageName: '', billingType: '', payableAmount: '',
                    formattedDate: '', failedReason: '', loginUrl: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // scheduler/services/whatsAppSubscriptionAutoRenewal.js
            WHATSAPP_SUBSCRIPTION_SUCCESS: {
                variables: {
                    name: '', packageName: '', billingType: '', amountPaid: '',
                    transactionId: '', nextBillingDate: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // scheduler/services/{prepaidRechargeStatus,bbpsAwaitedStatus}.js
            BILL_PAYMENT_SUCCESS: {
                variables: { serviceType: '', name: '', loginUrl: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            BILL_PAYMENT_FAILED: {
                variables: { serviceType: '', account: '', serviceProvider: '', name: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // scheduler/services/subscriptionAutoRenewal.js
            SUBSCRIPTION_CANCELLED: {
                variables: { corporateName: '', packageName: '', accessLineHtml: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // scheduler/utils/email/emailTemplates/reportAdminTemplate.js,
            // scheduler/services/scheduleReports.js. IN's real field set (no
            // totalSignupsCorporates/totalSignupsCustomers/totalCustomers split, unlike AE).
            REPORT_ADMIN_TRANSACTION_SUMMARY: {
                variables: {
                    countOfloggedinCorporates: '', totalTransactions: '', totalSignups: '',
                    totalRevenue: '', totalPendingTickets: '', emailBody: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // scheduler/utils/emailTemplates.js (generateTransactionReportEmailBody),
            // scheduler/services/scheduleReports.js (transactionReport). Old pre-v2 plain-
            // paragraph design preserved as-is — no headerHtml/footerHtml slots, matches AE's
            // own unmigrated equivalent.
            TRANSACTION_REPORT_DATA_ATTACHED: {
                variables: { type: '', accountNameSuffix: '' },
            },
            // scheduler/utils/emailTemplates.js (generateNoTransactionReportEmailBody),
            // scheduler/services/scheduleReports.js (transactionReport, shared by
            // dailyReportScheduler/weeklyReportScheduler/monthlyReportScheduler).
            TRANSACTION_REPORT_NO_DATA: {
                variables: { timePhrase: '' },
            },
        },
    },
    // service: FLIGHT — travel/controllers/corporate/airline.js
    FLIGHT: {
        emailTemplateKeys: {
            FLIGHT_CONFIRMATION: {
                variables: { userName: '', branding: '', website: '', baseUrl: '', headerHtml: '', footerHtml: '' },
            },
            // travel/controllers/corporate/airline.js (handleAirCancellationByApi) — internal
            // notification to Peko's own vendor-support team, not the customer.
            FLIGHT_CANCELLATION_MAIL: {
                variables: {
                    customerName: '', flightBookingId: '', requestDate: '', reasonForCancellation: '',
                    airlineLocator: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            FLIGHT_CANCELLATION_OTP: {
                variables: { name: '', otp: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
            // utils/emailTemplates/common.js (commonFlightbookingFailedTemplate), 2 call sites
            // in controllers/corporate/airline.js (payment() — payment-gateway and wallet-only paths)
            FLIGHT_BOOKING_FAILED: {
                variables: { name: '', branding: '', website: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: ECOM — purchase/controllers/corporate/ecommerce.js, admin/ecomCancelAndRefunds.js,
    // admin/ecomOrders.js, admin/ecomReturnAndRefund.js
    ECOM: {
        emailTemplateKeys: {
            // utils/emailTemplate/ecommerce.js (generatePaymentSuccessEmail). Product line-item
            // table is JS-fallback-only (dynamic-length, same convention as travel's
            // FLIGHT_CONFIRMATION itinerary loop) — matches AE's own real migration, which
            // doesn't expose it as a placeholder either.
            ECOM_ORDER_SUCCESS: {
                variables: {
                    name: '', transactionId: '', deliveryAddress: '', phoneNumber: '',
                    itemCount: '', subtotal: '', shipping: '', orderTotal: '', branding: '',
                    website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (commonFailedTemplate — ECOM's own separate
            // copy, distinct from utils/emailTemplate/common.js's shared copy used by
            // HIKE/GIFTCARD/EMAILDOMAIN and from softwares.js's own copy used by SOFTWARE)
            ECOM_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', retryUrl: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (orderCancelConfirmationTemplet)
            ECOM_ORDER_CANCEL_CONFIRMATION: {
                variables: {
                    name: '', orderId: '', date: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (emailOrderCancelRejectedTemplate)
            ECOM_ORDER_CANCEL_REJECTED: {
                variables: {
                    name: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (emailOrderCancelTemplate)
            ECOM_ORDER_CANCELLED: {
                variables: {
                    name: '', orderId: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/templatesForEmails.js (orderCancellFromSellerTemplet — the REAL live copy;
            // utils/emailTemplate/ecommerce.js and utils/emailTemplates.js each have a
            // dead/shadowed duplicate of this same name, never required by any controller)
            ECOM_ORDER_CANCELLED_BY_SELLER: {
                variables: {
                    name: '', orderId: '', date: '', trackLink: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/templatesForEmails.js (orderStatusChangeTemplate — the REAL live copy).
            // Admin body deliberately omits the product list/pricing breakdown — matches AE's
            // own real resolveOrderStatusChangeTemplate, which only exposes these flat scalars
            // too. trackButtonBlock is a pre-rendered blob (never a raw ${trackLink}
            // placeholder) so the template still resolves when there's no tracking link yet.
            ECOM_ORDER_STATUS_CHANGE: {
                variables: {
                    orderId: '', status: '', name: '', orderDate: '', deliveryDate: '',
                    trackButtonBlock: '', surcharge: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (emailOrderReturnRejectedTemplate) — single flat
            // params object spread (name/orderId/placedOn/productName/quantity/totalPrice/
            // shipping/grandTotal), a single returned item per order, not a dynamic list.
            ECOM_RETURN_REJECTED: {
                variables: {
                    name: '', orderId: '', placedOn: '', productName: '', quantity: '',
                    totalPrice: '', shipping: '', grandTotal: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (emailOrderReturnCompletedTemplate) — same flat
            // params shape as ECOM_RETURN_REJECTED plus address/mobile/remarks/unitPrice.
            ECOM_RETURN_COMPLETED: {
                variables: {
                    name: '', orderId: '', placedOn: '', address: '', mobile: '', remarks: '',
                    productName: '', unitPrice: '', quantity: '', totalPrice: '', shipping: '',
                    grandTotal: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (emailOrderReturnInitiatedTemplate — the rich,
            // params-based design; distinct from ECOM_RETURN_INITIATED_NOTICE below despite the
            // near-identical name) — same flat params shape as ECOM_RETURN_COMPLETED plus
            // returnPickUpDate.
            ECOM_RETURN_INITIATED: {
                variables: {
                    name: '', orderId: '', placedOn: '', address: '', returnPickUpDate: '',
                    mobile: '', remarks: '', productName: '', unitPrice: '', quantity: '',
                    totalPrice: '', shipping: '', grandTotal: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/ecommerce.js (emailOrderReturnIntiated — the simple
            // name/orderId/date design, matching AE's own distinctly-named function of the
            // same (typo'd) name)
            ECOM_RETURN_INITIATED_NOTICE: {
                variables: {
                    name: '', orderId: '', date: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates.js (emailCancelOTPTemaplte). Old pre-v2 design preserved
            // as-is — AE's own migration of this exact template didn't redesign it either.
            ECOM_CANCEL_OTP: {
                variables: { name: '', otp: '', message: '', branding: '' },
            },
            // NEW dedicated function utils/templatesForEmails.js (refundRequestOTPTemplate),
            // matching AE's real v2-redesigned reference (per-digit OTP boxes, fixed Peko
            // branding, no templateDetails/header-footer). Only 1 of IN's 3
            // commonEmailOtpVerification call sites maps to an AE key (admin/order.js and
            // admin/ecomCancelAndRefunds.js have no AE reference design and stay unmigrated).
            ECOM_RETURN_REFUND_OTP: {
                variables: { name: '', otp: '' },
            },
        },
    },
    // service: HIKE — purchase/controllers/corporate/hike.js
    HIKE: {
        emailTemplateKeys: {
            // utils/emailTemplate/hike.js (generateHikePurchaseSuccessEmail). Dynamic-length
            // item list (selectedHikes) is JS-fallback-only, same convention as travel's
            // FLIGHT_CONFIRMATION itinerary loop — never exposed as an admin placeholder.
            HIKE_PURCHASE_SUCCESS: {
                variables: {
                    name: '', transactionId: '', amount: '', surcharge: '', branding: '',
                    website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/common.js (commonFailedTemplate — shared generic failure
            // template, also used by GIFTCARD_PAYMENT_FAILED under the GIFTCARD service)
            HIKE_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', retryUrl: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: GIFTCARD — purchase/controllers/corporate/giftCard.js
    GIFTCARD: {
        emailTemplateKeys: {
            // utils/emailTemplates.js (generateGiftCardPaymentSuccessEmail) — sent to the gift
            // card RECIPIENT, not the buyer. messageBlock is a pre-rendered blob (never a raw
            // ${message} placeholder) so an admin-published template can still resolve when
            // the sender left no personal note — the common case, not the exception.
            GIFTCARD_RECEIVED: {
                variables: {
                    name: '', senderName: '', messageBlock: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplates.js (generateGiftCardPaymentSuccessEmailToCompany) — sent to
            // the buyer's own confirmation email, despite the "ToCompany" name (matches AE's
            // own naming). cardImageBlock is a pre-rendered blob for the same reason as
            // messageBlock above.
            GIFTCARD_COMPANY_NOTICE: {
                variables: {
                    name: '', serviceProvider: '', cardName: '', cardImageBlock: '',
                    amountPayable: '', cardQuantity: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/common.js (commonFailedTemplate — same shared function as
            // HIKE_PAYMENT_FAILED under the HIKE service)
            GIFTCARD_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', retryUrl: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: SOFTWARE — purchase/controllers/corporate/softwares.js
    SOFTWARE: {
        emailTemplateKeys: {
            // utils/emailTemplate/softwares.js (generateSubscriptionSuccessEmail). Plan-card
            // section (monthly price breakdown, product image) is JS-fallback-only, matching
            // AE's own real, working migration — AE's resolver doesn't expose those either.
            SOFTWARE_PURCHASE_SUCCESS: {
                variables: {
                    name: '', transactionId: '', amount: '', softwareName: '', planName: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/softwares.js (generateSubscriptionSuccessEmailToVendor) —
            // internal notification to the software vendor, not the customer. softwareName/
            // monthly-price fields are JS-fallback-only here too (AE's own migration doesn't
            // expose them for this specific email either).
            SOFTWARE_ORDER_VENDOR: {
                variables: {
                    name: '', orderId: '', customerName: '', emailId: '', contactNo: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/softwares.js (generateSubscriptionSuccessEmailToInternals) —
            // internal notification to Peko's own team. softwareName is JS-fallback-only here
            // (matches AE's own migration - even the admin-published heading stays generic).
            SOFTWARE_ORDER_INTERNAL: {
                variables: {
                    name: '', transactionId: '', amount: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/softwares.js (commonFailedTemplate — its own separate copy,
            // distinct from the shared one in utils/emailTemplate/common.js used by
            // HIKE_PAYMENT_FAILED/GIFTCARD_PAYMENT_FAILED and, it turns out, also by
            // EMAILDOMAIN_PAYMENT_FAILED below — NOT by this SOFTWARE copy)
            SOFTWARE_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', retryUrl: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: EMAILDOMAIN — purchase/controllers/corporate/software_subscriptions.js
    EMAILDOMAIN: {
        emailTemplateKeys: {
            // utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmailToVendor) —
            // internal notification to the plan vendor, not the customer.
            EMAILDOMAIN_ORDER_VENDOR: {
                variables: {
                    name: '', orderId: '', customerName: '', emailId: '', contactNo: '',
                    softwareName: '', priceText: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmailToInternals) —
            // internal notification to Peko's own team.
            EMAILDOMAIN_ORDER_INTERNAL: {
                variables: {
                    name: '', transactionId: '', amount: '', softwareName: '', priceText: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/emailDomain.js (generateEmailDomainSuccessEmail). Plan-card
            // section (product image, price) is JS-fallback-only, matching AE's own real,
            // working migration — AE's resolver doesn't expose softwareName/price for this
            // one either.
            EMAILDOMAIN_PURCHASE_SUCCESS: {
                variables: {
                    name: '', transactionId: '', amount: '', billingType: '', branding: '',
                    website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/common.js (commonFailedTemplate — the MAIN shared copy,
            // same one used by HIKE_PAYMENT_FAILED/GIFTCARD_PAYMENT_FAILED — NOT
            // SOFTWARE_PAYMENT_FAILED's own separate softwares.js copy)
            EMAILDOMAIN_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', retryUrl: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: PROCURE — purchase/controllers/corporate/procure/rfqController.js,
    // purchase/controllers/public/rfqInviteController.js, purchase/controllers/public/poInviteController.js,
    // purchase/controllers/corporate/procure/purchaseOrder.js. `initiator`/`corporate` objects never carry
    // branding/website/logo/socials in either IN or AE's real controllers — procurement emails always use
    // fixed Peko branding, no per-partner white-labeling.
    PROCURE: {
        emailTemplateKeys: {
            // utils/emailTemplate/rfqTemplate.js (rfqInviteTemplate). Line items/terms/buyer-notes/CTA
            // link are JS-fallback-only (structurally variable, not flat scalars) — matches AE's own
            // resolveRfqInviteTemplate, which only exposes the fields below.
            PROCURE_RFQ_INVITE: {
                variables: {
                    rfqRefNumber: '', rfqTitle: '', vendorName: '', initiatorName: '',
                    initiatorCompany: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/rfqTemplate.js (rfqReminderTemplate)
            PROCURE_RFQ_REMINDER: {
                variables: {
                    rfqRefNumber: '', rfqTitle: '', vendorName: '', initiatorName: '',
                    initiatorCompany: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/rfqTemplate.js (proposalReceivedTemplate). Payment terms/delivery/
            // validity/quoted-amount formatting and the review link stay JS-fallback-only.
            PROCURE_PROPOSAL_RECEIVED: {
                variables: {
                    rfqRefNumber: '', rfqTitle: '', vendorName: '', buyerName: '',
                    proposedAmount: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/rfqTemplate.js (proposalUpdatedTemplate). Delta %/color/arrow
            // computation between previousAmount and the new proposedAmount stays JS-fallback-only.
            PROCURE_PROPOSAL_UPDATED: {
                variables: {
                    rfqRefNumber: '', rfqTitle: '', vendorName: '', buyerName: '',
                    proposedAmount: '', previousAmount: '', previousPaymentTerms: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/rfqTemplate.js (poAcknowledgedTemplate)
            PROCURE_PO_ACKNOWLEDGED: {
                variables: {
                    poNumber: '', vendorName: '', buyerName: '', invoiceNumber: '',
                    invoiceAmount: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/poIssuedTemplate.js (poIssuedTemplate). Line-item table (dynamic
            // length) and the acknowledge-link CTA stay JS-fallback-only.
            PROCURE_PO_ISSUED: {
                variables: {
                    poNumber: '', rfqTitle: '', buyerName: '', vendorName: '', initiatorName: '',
                    buyerEmail: '', buyerPhone: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: PURCHASE_REFUND — purchase/utils/cashFreeGateway.js, purchase/utils/emailSender.js.
    // Namespaced (not bare "REFUND") because `payment` MS already owns a bare REFUND service with
    // its own, differently-shaped REFUND_INITIATED key (see the REFUND block above) — reusing
    // bare REFUND here would collide on the shared (service, key, partnerId) uniqueness
    // constraint.
    PURCHASE_REFUND: {
        emailTemplateKeys: {
            // utils/emailTemplate/common.js (refundFailure). No AE resolve* wrapper exists for
            // this template at all (AE never wired it into its own admin-editable system either)
            // — this key and its variable list are new, not copied from an AE precedent. ONE
            // shared key reused across all 3 real call sites (paymentRefundFailureEmailInternal
            // in cashFreeGateway.js — admin-notice "Refund Failed"; leanRefundFailureEmail and
            // paymentGateWayRefundFailureEmail in emailSender.js — customer-facing "Bank refund
            // Failure"/"Card refund Failure") per explicit user sign-off, since all 3 currently
            // render identical HTML despite the different subjects/audiences.
            REFUND_FAILED: {
                variables: {
                    name: '', amount: '', transactionId: '', branding: '', website: '',
                    headerHtml: '', footerHtml: '',
                },
            },
            // utils/emailTemplate/common.js (refundInitiated). No AE reference exists at all for
            // this template (Peko-AE's purchase MS has no Cashfree gateway/this flow whatsoever)
            // — built as a net-new v2 design mirroring REFUND_FAILED's shape (success badge
            // instead of reject badge), per explicit user sign-off. Single call site:
            // cashFreeGateway.js's paymentRefundInitiatedEmailInternal ("Refund Initiated").
            REFUND_INITIATED: {
                variables: {
                    name: '', amount: '', transactionId: '', serviceProvider: '', typeOfService: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: PACKAGE — others/utils/emailTemplate/package.js, controllers/admin/package.js.
    // AE has a real resolve* wrapper for this exact template, but AE never gave it a v2 redesign
    // either (old pre-v2 design preserved as-is on both sides). `priceRows` is a pre-rendered
    // blob (the changed-price table row(s), never a raw old/new value pair) built at the call
    // site — AE's own wrapper passes raw values instead, which is not copied here since it would
    // break admin-editing whenever only one of monthly/annually actually changed.
    PACKAGE: {
        emailTemplateKeys: {
            PACKAGE_PRICE_UPDATE: {
                variables: { username: '', packageName: '', date: '', priceRows: '', branding: '', logo: '', copyrightYear: '' },
            },
        },
    },
    // service: WORKSPACES — others/utils/emailTemplate/workspaces.js, controllers/admin/workspaces.js.
    // AE has a real resolve* wrapper for this exact template, but AE never gave it a v2 redesign
    // either (old pre-v2 design preserved as-is on both sides, matching PACKAGE's situation).
    // Uses emailer.emailWithMultipleAttachment — the attachment handling is untouched by this
    // migration, only the HTML body is resolver-wired. `highlights` is a pre-rendered blob
    // (newline-split plan highlights joined with <br>) built at the call site, same reason as
    // PACKAGE's priceRows — the resolver can't run a JS conditional/loop inside stored HTML.
    //
    // Bare name shared with officeAndBusiness ("Office Address" in IN FE) —
    // controllers/corporate/workspace.js, utils/emailTemplates/workspace.js — whose keys are
    // merged into this same block. orderDetailsHtml is one pre-rendered table (Transaction ID,
    // Total price, Plan, Plan price, Plan details, Workspace name/price/address).
    WORKSPACES: {
        emailTemplateKeys: {
            // others MS
            WORKSPACE_DOCUMENT_FROM_ADMIN: {
                variables: {
                    name: '', content: '', planName: '', highlights: '', price: '', billingCycle: '',
                    branding: '', logo: '', copyrightYear: '',
                },
            },
            // officeAndBusiness MS
            WORKSPACE_BOOKING_SUCCESS: {
                variables: {
                    name: '', transactionId: '', amount: '', planName: '', orderDetailsHtml: '',
                    branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            WORKSPACE_RENEWAL_REMINDER: {
                variables: {
                    name: '', url: '', expiryDate: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
            WORKSPACE_PAYMENT_FAILED: {
                variables: {
                    name: '', serviceName: '', url: '', failedOn: '', branding: '', website: '', headerHtml: '', footerHtml: '',
                },
            },
        },
    },
    // service: BENEFICIARY — others/utils/emailTemplate/beneficiary.js,
    // controllers/corporate/beneficiary.js. Redesigned to IN's own established v2 OTP
    // pattern instead of copying AE's real reference design (a bespoke 576px "Inter"
    // OTP-box card) — explicit user decision, so this matches PROFILE's own
    // BANK_ACCOUNT_VERIFICATION_OTP/PROFILE_UPDATE_OTP shape exactly.
    BENEFICIARY: {
        emailTemplateKeys: {
            BENEFICIARY_OTP: {
                variables: { username: '', action: '', otpBoxesHtml: '', branding: '', headerHtml: '', footerHtml: '' },
            },
        },
    },
    // service: CORPORATECARD_VENDOR — corporateCard/utils/vendorKybEmailTemplate.js,
    // services/vendorKybReviewEmail.js. Not white-labeled (always sent as Peko, not a
    // partner brand), so no headerHtml/footerHtml/branding slots — detailsHtml/
    // reviewActionsHtml/documentsHtml are pre-rendered blobs built at the call site,
    // same reason as WORKSPACES's highlights (no loop/conditional inside stored HTML).
    CORPORATECARD_VENDOR: {
        emailTemplateKeys: {
            VENDOR_KYB_UNDER_REVIEW: {
                variables: {
                    recipientName: '', companyName: '', detailsHtml: '', reviewActionsHtml: '',
                    documentsHeadingHtml: '', documentsHtml: '',
                },
            },
        },
    },
    // service: CORPORATECARD_CARD_LIFECYCLE — corporateCard/utils/cardTerminationEmailTemplate.js,
    // controllers/systemUser/cardTermination.js. Not white-labeled, no headerHtml/footerHtml.
    CORPORATECARD_CARD_LIFECYCLE: {
        emailTemplateKeys: {
            CARD_TERMINATION_COMPLETED: {
                variables: { name: '', cardLast4Clause: '' },
            },
        },
    },
    // service: CORPORATECARD_APPLICATION — corporateCard/utils/kybStatusEmailTemplate.js,
    // controllers/systemUser/corporateCardApplication.js. Not white-labeled, no
    // headerHtml/footerHtml. fundingAccountHtml/reasonsBlockHtml are pre-rendered
    // blobs built at the call site (no loop/conditional inside stored HTML).
    CORPORATECARD_APPLICATION: {
        emailTemplateKeys: {
            KYB_APPROVED: {
                variables: { name: '', fundingAccountHtml: '', referenceClauseHtml: '' },
            },
            KYB_REJECTED: {
                variables: { name: '', reasonsBlockHtml: '' },
            },
        },
    },
};

module.exports = { EMAIL_TEMPLATE_SERVICE, EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_KEYS_BY_SERVICE };
