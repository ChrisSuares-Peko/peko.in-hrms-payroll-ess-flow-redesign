const express = require("express");

const router = express.Router({ mergeParams: true });
const { resendBookingEmail } = require("../../../../controllers/corporate/resendBookingEmail");

// Unified resend booking-confirmation email for all services (hotel, airline, …).
router.post("/resend-email", resendBookingEmail);

module.exports = router;
