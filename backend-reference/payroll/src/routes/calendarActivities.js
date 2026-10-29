const express = require("express");
const router = express.Router();
const { validateActivityCalenderSendEmail } = require("../utils/apiValidation");
const { getCalendarActivities, upCommingActivities, sentEmail } = require("../controller/calendarActivities")

// Get all calenderActivities for a specific corporateUser
router.get("/", getCalendarActivities)

// Get upcoming activities
router.get("/upcoming", upCommingActivities)

// Send email regading activity
router.post("/send-email", validateActivityCalenderSendEmail, sentEmail)

module.exports = router;
