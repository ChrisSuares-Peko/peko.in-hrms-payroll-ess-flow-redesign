const asyncHandler = require('../../middlewares/async');
const { findOne: findOneServiceOperator } = require('../../models/use-cases/serviceOperator');
const ErrorResponse = require('../../utils/error-response');
const { updateVisaOrderWebhookStatus, updateVisaDocumentStatus, findVisaOrderByOrderNumber } = require('../../models/use-cases/visa');
const { customLog } = require('../../utils/loggerHelper');
const emailer = require('../../utils/emailer');
const { visaStatusUpdateTemplate } = require('../../utils/emailTemplates/visa/visaStatusUpdateTemplate');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { createNotification } = require('../../models/use-cases/notification');
const { uploadFileToS3 } = require('../../utils/s3');
const operatorsData = require('../../utils/operatorsData.json');

const accessKey = operatorsData.visa.accessKey;

// Maps vendor's human-readable application_status strings to our internal enum codes.
// Add entries here as the vendor introduces new status values.
const VENDOR_STATUS_TO_INTERNAL = {
    // Human-readable statuses
    'Application not submitted to embassy': 'DOCS_UNDER_REVIEW',
    'Application submitted to embassy':     'EMBASSY_SUBMISSION',
    'Visa approved':                        'VISA_ISSUED',
    'Visa rejected':                        'VISA_REJECTED',
    'Visa stamped':                         'VISA_STAMPED',
    'Visa delivered':                       'VISA_DELIVERED',
    'Under review':                         'UNDER_REVIEW',
    'Processing':                           'PROCESSING',
    // E-Visa specific status codes from VisaOS
    'OPS-DONE':                             'DOCS_UNDER_REVIEW',
    'VERIFIED':                             'DOCS_UNDER_REVIEW',
    'IN-PROCESS-WITH-IMMIGRATION':          'PROCESSING',
    'VISA-APPROVED':                        'VISA_ISSUED',
    'VISA-UPLOADED':                        'VISA_ISSUED',
    'VISA-REJECTED':                        'VISA_REJECTED',
    'REJECTED-VISA-UPLOADED':              'VISA_REJECTED',
    // Observed in live logs — early-stage, form-fill, and QC statuses.
    // Vendor's real progression: SAVED -> SUBMITTED -> VERIFIED -> QC-DONE ->
    // FORM-FILLED -> IN-PROCESS-WITH-IMMIGRATION -> VISA-APPROVED (or QC-FAILED
    // if document review fails).
    'SAVED':                                'NEW',
    'SUBMITTED':                            'DOCS_UNDER_REVIEW',
    'QC-DONE':                              'PROCESSING',
    'FORM-FILLED':                          'PROCESSING',
    'QC-FAILED':                            'DOCS_REJECTED',
    'REJECTED':                             'VISA_REJECTED',
};

const EMAIL_TRIGGER_STATUSES = ['UNDER_REVIEW', 'VISA_STAMPED', 'VISA_DELIVERED', 'VISA_ISSUED', 'VISA_REJECTED', 'DOCS_REJECTED'];

function detectDocumentFormat(base64String) {
    if (!base64String || !base64String.startsWith('data:')) return 'pdf';
    const match = base64String.match(/^data:([^;]+);base64,/);
    if (!match) return 'pdf';
    const mime = match[1];
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    return 'pdf';
}

function stripBase64Prefix(base64String) {
    if (base64String && base64String.startsWith('data:')) {
        return base64String.replace(/^data:[^;]+;base64,/, '');
    }
    return base64String;
}

exports.updateVisaStatus = asyncHandler(async (req, res, next) => {
    try {
        const LogTraceId = req?.LogTraceId || new Date().getTime();

        customLog(LogTraceId, 'info', { body: req.body, message: 'Visa WEBHOOK CALL RECEIVED' }, 'VENDOR');

        //---------Auth Starts----------------------
        const apiWebhookKey = req.headers['api_key'];
        const clientIP = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : undefined;

        const serviceOperatorData = await findOneServiceOperator({ accessKey });
        const vendorWebHookApiKey = serviceOperatorData?.vendor?.optional3;
        const whitelistedIPs = serviceOperatorData?.vendor?.optional4;

        if (process.env.NODE_ENV === 'production') {
            if (!clientIP || !whitelistedIPs?.includes(clientIP)) {
                return next(new ErrorResponse('Access denied: IP address not whitelisted', 400));
            }
            if (vendorWebHookApiKey && vendorWebHookApiKey !== apiWebhookKey) {
                return next(new ErrorResponse('Invalid api key', 400));
            }
        }
        //---------Auth ends----------------------

        const { order_number, application_status } = req.body;

        if (!order_number || !application_status) {
            return next(new ErrorResponse('order_number and application_status are required', 400));
        }

        const internalStatus = VENDOR_STATUS_TO_INTERNAL[application_status] || application_status;

        const updatedOrder = await updateVisaOrderWebhookStatus({
            orderNumber: order_number,
            applicationStatus: internalStatus,
        });

        if (!updatedOrder) {
            return next(new ErrorResponse('Visa order not found', 404));
        }

        // Notifications for all status changes
        const username = updatedOrder?.credential?.username;
        if (username) {
            createNotification({
                notificationTitle: 'Visa Application Update',
                notificationBrief: `Your visa application (${order_number}) status has been updated to: ${application_status}.`,
                notificationTo: [username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            });
        }

        // Email for key statuses
        if (EMAIL_TRIGGER_STATUSES.includes(internalStatus)) {
            (async () => {
                try {
                    const to = updatedOrder?.credential?.email;
                    if (!to) return;

                    const registeredBy = updatedOrder?.credential?.registeredBy;
                    const templateDetails = await fetchPartnerDetails(registeredBy);

                    const body = visaStatusUpdateTemplate({
                        userName: updatedOrder?.credential?.name || updatedOrder?.credential?.username,
                        orderNumber: order_number,
                        status: internalStatus,
                        destination: updatedOrder?.destination,
                        productName: updatedOrder?.productName,
                    }, templateDetails);

                    emailer.email(to, 'Visa Application Status Update – Peko', body, () => {});
                } catch (emailErr) {
                    customLog(LogTraceId, 'error', { message: 'visa webhook: email send failed', error: emailErr });
                }
            })();
        }

        return res.status(200).json({
            status: true,
            message: 'Success',
            responseCode: '000',
            data: {},
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error?.message || error, message: 'ERROR from updateVisaStatus' }, 'VENDOR');

        return res.status(400).json({
            status: false,
            message: error?.message || 'Something went wrong.',
            responseCode: '001',
            data: {},
        });
    }
});

// Handles 3 document webhook scenarios from VisaOS, distinguished by payload shape:
//   1. document_data present       → Upload Document Webhook (base64 → S3)
//   2. document_rejection_reasons  → Document Status Webhook (rejection review)
//   3. neither                     → Uploaded Document Webhook (notification only)
exports.updateVisaDocumentStatus = asyncHandler(async (req, res, next) => {
    try {
        const LogTraceId = req?.LogTraceId || new Date().getTime();

        customLog(LogTraceId, 'info', {
            body: { ...req.body, document_data: req.body.document_data ? '[REDACTED]' : undefined },
            message: 'Visa DOCUMENT STATUS WEBHOOK RECEIVED',
        }, 'VENDOR');

        //---------Auth Starts----------------------
        const apiWebhookKey = req.headers['api_key'];
        const clientIP = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : undefined;

        const serviceOperatorData = await findOneServiceOperator({ accessKey });
        const vendorWebHookApiKey = serviceOperatorData?.vendor?.optional3;
        const whitelistedIPs = serviceOperatorData?.vendor?.optional4;

        if (process.env.NODE_ENV === 'production') {
            if (!clientIP || !whitelistedIPs?.includes(clientIP)) {
                return next(new ErrorResponse('Access denied: IP address not whitelisted', 400));
            }
            if (vendorWebHookApiKey && vendorWebHookApiKey !== apiWebhookKey) {
                return next(new ErrorResponse('Invalid api key', 400));
            }
        }
        //---------Auth ends----------------------

        const { order_number, application_id, document_code, document_rejection_reasons, document_data, application_status } = req.body;

        // Batch/unknown payloads with no order_number (e.g. applicants array payloads) — ack and skip
        if (!order_number) {
            customLog(LogTraceId, 'info', { message: 'Visa document webhook: no order_number, skipping' }, 'VENDOR');
            return res.status(200).json({ status: true, message: 'Success', responseCode: '000', data: {} });
        }

        // Some payloads carry application_status instead of document_code — route as status update
        if (application_status && !document_code) {
            const internalStatus = VENDOR_STATUS_TO_INTERNAL[application_status] || application_status;
            const updatedOrder = await updateVisaOrderWebhookStatus({ orderNumber: order_number, applicationStatus: internalStatus });
            if (!updatedOrder) return next(new ErrorResponse('Visa order not found', 404));
            const username = updatedOrder?.credential?.username;
            if (username) {
                createNotification({
                    notificationTitle: 'Visa Application Update',
                    notificationBrief: `Your visa application (${order_number}) status has been updated to: ${application_status}.`,
                    notificationTo: [username],
                    notificationCategory: 'CORPORATE',
                    notificationBy: 'ADMIN',
                });
            }
            return res.status(200).json({ status: true, message: 'Success', responseCode: '000', data: {} });
        }

        // Payloads with order_number but no document_code and no application_status — ack and skip
        if (!document_code) {
            customLog(LogTraceId, 'info', { message: 'Visa document webhook: no document_code, skipping' }, 'VENDOR');
            return res.status(200).json({ status: true, message: 'Success', responseCode: '000', data: {} });
        }

        let documentEntry;
        let notificationTitle;
        let notificationBrief;

        if (document_data) {
            // Scenario 3: Upload Document Webhook — vendor sends base64 document (visa copy, invoice, etc.)
            // Pre-check order existence before uploading to S3 to avoid orphaned files.
            const existingOrder = await findVisaOrderByOrderNumber(order_number);
            if (!existingOrder) {
                return next(new ErrorResponse('Visa order not found', 404));
            }

            const format = detectDocumentFormat(document_data);
            const rawBase64 = stripBase64Prefix(document_data);
            const s3Url = await uploadFileToS3(rawBase64, 'visa/vendor-documents', format);

            documentEntry = {
                document_code,
                application_id: application_id || null,
                status: 'UPLOADED',
                s3Url,
                uploadedAt: new Date().toISOString(),
            };
            notificationTitle = 'Visa Document Ready';
            notificationBrief = `A document (${document_code}) is now available for your visa application (${order_number}).`;

        } else if (document_rejection_reasons) {
            // Scenario 1: Document Status Webhook — vendor sends rejection reasons for a specific document
            const rejectionReasons = Array.isArray(document_rejection_reasons) ? document_rejection_reasons : [];
            documentEntry = {
                document_code,
                application_id: application_id || null,
                document_rejection_reasons: rejectionReasons,
                status: rejectionReasons.length > 0 ? 'REJECTED' : 'PENDING',
            };
            notificationTitle = 'Visa Document Review Update';
            notificationBrief = `Your visa application documents (${order_number}) have been reviewed. Please check the status.`;

        } else {
            // Scenario 2: Uploaded Document Webhook — vendor notifies that a document (e.g. invoice) was added
            documentEntry = {
                document_code,
                application_id: application_id || null,
                status: 'UPLOADED',
                notifiedAt: new Date().toISOString(),
            };
            notificationTitle = 'Visa Document Added';
            notificationBrief = `A document (${document_code}) has been added to your visa application (${order_number}).`;
        }

        const updatedOrder = await updateVisaDocumentStatus({ orderNumber: order_number, documents: [documentEntry] });

        if (!updatedOrder) {
            return next(new ErrorResponse('Visa order not found', 404));
        }

        const username = updatedOrder?.credential?.username;
        if (username) {
            createNotification({
                notificationTitle,
                notificationBrief,
                notificationTo: [username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Success',
            responseCode: '000',
            data: {},
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error?.message || error, message: 'ERROR from updateVisaDocumentStatus' }, 'VENDOR');

        return res.status(400).json({
            status: false,
            message: error?.message || 'Something went wrong.',
            responseCode: '001',
            data: {},
        });
    }
});
