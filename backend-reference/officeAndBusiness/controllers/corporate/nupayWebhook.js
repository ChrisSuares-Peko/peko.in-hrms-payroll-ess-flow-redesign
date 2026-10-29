const asyncHandler = require('../../middlewares/async');
const { customLog } = require('../../utils/loggerHelper');
const { findOneVerificationRecordByReference } = require('../../models/use-cases/nupayVerificationRecord');
const { finalizeAadhaarVerificationV2 } = require('./verificationSuiteV2');

// Sample Nupay Aadhaar webhook payload:
// { status, statusCode, message, reference_id, uid, name, dob, pincode, gender, care_of, address,
//   split_address: { vtc, po, dist, state, subdist, country, pincode, street, house, landmark },
//   photoBase64, pdfUrl }
exports.handleNupayWebhook = asyncHandler(async (req, res) => {
    const LogTraceId = req?.LogTraceId || new Date().getTime();

    customLog(LogTraceId, 'info', {
        message: '[Nupay Aadhaar] Webhook received',
        body: { ...req.body, photoBase64: undefined },
    }, 'VENDOR');

    try {
        const nupayData = req.body;
        const { status, statusCode, message: vendorMessage, reference_id: referenceId } = nupayData || {};
        const referenceNumber = nupayData?.reference_number || referenceId;

        if (!referenceNumber) {
            customLog(LogTraceId, 'error', {
                message: '[Nupay Aadhaar] Webhook payload missing reference_id/reference_number',
            }, 'VENDOR');
            return res.status(200).json({ status: true, message: 'Webhook received successfully', responseCode: '000', data: {} });
        }

        customLog(LogTraceId, 'info', {
            message: '[Nupay Aadhaar] Webhook payload parsed',
            referenceNumber, status, statusCode, vendorMessage,
        }, 'VENDOR');

        const record = await findOneVerificationRecordByReference(referenceNumber);
        if (!record) {
            customLog(LogTraceId, 'error', {
                message: '[Nupay Aadhaar] No verification record found for webhook reference',
                referenceNumber,
            }, 'VENDOR');
            return res.status(200).json({ status: true, message: 'Webhook received successfully', responseCode: '000', data: {} });
        }

        // Idempotency: finalizeAadhaarVerificationV2 also checks this internally (record.status !==
        // "PENDING"), but logging it explicitly here surfaces a duplicate/retried webhook delivery
        // in the logs instead of it silently being a no-op.
        if (record.status !== 'PENDING') {
            customLog(LogTraceId, 'info', {
                message: '[Nupay Aadhaar] Webhook skipped — record already settled',
                referenceNumber, existingStatus: record.status,
            }, 'VENDOR');
            return res.status(200).json({ status: true, message: 'Already processed', responseCode: '000', data: {} });
        }

        const result = await finalizeAadhaarVerificationV2({ record, nupayData, LogTraceId });

        customLog(LogTraceId, 'info', {
            message: '[Nupay Aadhaar] Webhook processed',
            referenceNumber, result,
        }, 'VENDOR');
    } catch (error) {
        customLog(LogTraceId, 'error', {
            message: '[Nupay Aadhaar] ERROR from handleNupayWebhook',
            error: error?.message,
        }, 'VENDOR');
    }

    // Always ack 200 so the vendor doesn't retry - our own handling failures are logged above, not surfaced to the vendor.
    return res.status(200).json({
        status: true,
        message: 'Webhook received successfully',
        responseCode: '000',
        data: {},
    });
});
