const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { updateOfferLetterStatus } = require("../controller/employee");
const { syncSalaryForEsignCallback } = require("../middleware/salarySync");

// Statuses officeAndBusiness reports for a signing request; PENDING/EMAIL_CHANGED are
// only ever set by payroll itself.
const CALLBACK_STATUSES = ["SIGNED", "REJECTED"];

const secretMatches = (received, secret) => {
    const a = Buffer.from(String(received || ""));
    const b = Buffer.from(secret);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Called by officeAndBusiness — not a corporate-user-authenticated route, so it
// checks a shared secret instead of the normal JWT flow. Fails closed if unset.
function verifyEsignCallbackSecret(req, res, next) {
    const secret = process.env.ESIGN_CALLBACK_SECRET;
    if (!secret || !secretMatches(req.headers["x-esign-callback-secret"], secret)) {
        return res.status(401).json({ status: false, responseCode: "001", message: "Unauthorized", data: {} });
    }
    next();
}

function validateEsignCallbackBody(req, res, next) {
    const { status, eSignId, signedDocumentUrl } = req.body || {};
    if (!CALLBACK_STATUSES.includes(status) || typeof eSignId !== "string" || !eSignId
        || (signedDocumentUrl !== undefined && typeof signedDocumentUrl !== "string")) {
        return res.status(400).json({ status: false, responseCode: "001", message: "Invalid callback payload", data: {} });
    }
    next();
}

router.put("/employee/:employeeId/offer-letter-status", verifyEsignCallbackSecret, validateEsignCallbackBody, syncSalaryForEsignCallback, updateOfferLetterStatus);

module.exports = router;
