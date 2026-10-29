'use strict';

// Registry of admin-managed email template identifiers for the `travel`
// microservice. Bare per-area service names, matching AE's own travel registry
// exactly (confirmed no literal (service, key) collision risk as long as keys stay
// globally unique — the only tradeoff is the admin panel's service filter not being
// able to tell two microservices apart if they ever pick the same bare service name).
//
// Add one entry per email as it's migrated — anything not here keeps rendering
// from its local template exactly as before.
const EMAIL_TEMPLATE_SERVICES = {
    FLIGHT: 'FLIGHT',
    HOTEL: 'HOTEL',
    ESIM: 'ESIM',
    LOGISTICS: 'LOGISTICS',
    // Bare name matching users MS's own AUTH service and the general project convention
    // (login/auth-related emails) - travel's own local corporate-login MFA flow, unrelated
    // to any of the 4 booking verticals above.
    AUTH: 'AUTH',
};

const EMAIL_TEMPLATE_KEYS = {
    // utils/emailTemplates/flights/flightConfirmationTemplate.js, controllers/corporate/airline.js
    FLIGHT_CONFIRMATION: 'FLIGHT_CONFIRMATION',
    // utils/emailTemplates/flights/cancellationMailTemplate.js, controllers/corporate/airline.js
    FLIGHT_CANCELLATION_MAIL: 'FLIGHT_CANCELLATION_MAIL',
    // utils/emailTemplates/flights/flightCancellationOTPTemplate.js, controllers/corporate/airline.js
    FLIGHT_CANCELLATION_OTP: 'FLIGHT_CANCELLATION_OTP',
    // utils/emailTemplates/common.js (commonFlightbookingFailedTemplate), controllers/corporate/airline.js
    FLIGHT_BOOKING_FAILED: 'FLIGHT_BOOKING_FAILED',
    // utils/emailTemplates/hotel/hotelTicketPDF.js (generateHotelTicketAndSendToMailNew), controllers/corporate/hotel.js
    HOTEL_BOOKING_CONFIRMATION: 'HOTEL_BOOKING_CONFIRMATION',
    // utils/emailTemplates/hotel/hotelTicketPDF.js (HotelBookingCancelledEmailTemplate), controllers/corporate/hotel.js
    HOTEL_CANCELLED: 'HOTEL_CANCELLED',
    // utils/emailTemplates/eSim.js (generateEsimSuccessEmail), controllers/corporate/eSIM.js
    ESIM_PAYMENT_SUCCESS: 'ESIM_PAYMENT_SUCCESS',
    // utils/emailTemplates/common.js (commonFailedTemplate, shared with LOGISTICS_PAYMENT_FAILED),
    // controllers/corporate/eSIM.js
    ESIM_PAYMENT_FAILED: 'ESIM_PAYMENT_FAILED',
    // utils/emailTemplates/common.js (commonFailedTemplate, shared with ESIM_PAYMENT_FAILED),
    // controllers/corporate/logistics_V3.js
    LOGISTICS_PAYMENT_FAILED: 'LOGISTICS_PAYMENT_FAILED',
    // utils/emailTemplates/logistics.js (generatePaymentSuccessEmailLogisticsV3), controllers/corporate/logistics_V3.js
    LOGISTICS_PAYMENT_SUCCESS_V3: 'LOGISTICS_PAYMENT_SUCCESS_V3',
    // utils/emailTemplates/logistics.js (generatePaymentSuccessEmailReturnLogisticsV3), controllers/corporate/logistics_V3.js
    LOGISTICS_RETURN_PAYMENT_SUCCESS_V3: 'LOGISTICS_RETURN_PAYMENT_SUCCESS_V3',
    // utils/emailTemplates/logistics.js (generateReturnCompletionSuccessEmailLogisticsV3), controllers/corporate/logistics_V3.js
    LOGISTICS_RETURN_COMPLETION_SUCCESS_V3: 'LOGISTICS_RETURN_COMPLETION_SUCCESS_V3',
    // utils/emailTemplates/logistics.js (generateShipmentCancelAdminInformEmailLogisticsV3), controllers/corporate/logistics_V3.js
    LOGISTICS_SHIPMENT_CANCEL_ADMIN_INFORM_V3: 'LOGISTICS_SHIPMENT_CANCEL_ADMIN_INFORM_V3',
    // utils/templatesForEmails.js (commonEmailOtpVerification), configs/local_auth.js
    OTP_MFA_LOGIN: 'OTP_MFA_LOGIN',
    // utils/emailTemplates/common.js (emailOTPTemaplte), controllers/corporate/hotel.js (getOtpCancel)
    HOTEL_CANCELLATION_OTP: 'HOTEL_CANCELLATION_OTP',
};

module.exports = { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS };
