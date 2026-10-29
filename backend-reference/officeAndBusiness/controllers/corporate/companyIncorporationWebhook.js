const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const { createNotification } = require('../../models/use-cases/notification');
const { updateApplicationStatus } = require('../../models/use-cases/companyIncorporation');
const companyIncorporation = require('../../models/entities/companyIncorporation');
const credential = require('../../models/entities/credential');
const { getVendorApplicationStatus } = require('../../utils/vendorGateway');
const { customLog } = require('../../utils/loggerHelper');
const crypto = require('crypto');

const ACCESS_KEY = 'company_incorporation';

const VENDOR_STATUS_MAP = {
    assigned: 'SUBMITTED',
    submitted: 'UNDER_REVIEW',
    closed: 'APPROVED',
    rejected: 'REJECTED',
};

const STATUS_NOTIFICATION = {
    SUBMITTED: {
        title: 'Company Incorporation — Submitted',
        brief: id => `Your application ${id} has been received and an operator has been assigned.`,
    },
    UNDER_REVIEW: {
        title: 'Company Incorporation — Under Review',
        brief: id => `Your application ${id} is now under review by the authority.`,
    },
    APPROVED: {
        title: 'Company Incorporation — Approved',
        brief: id => `Congratulations! Your incorporation application ${id} has been approved.`,
    },
    REJECTED: {
        title: 'Company Incorporation — Action Required',
        brief: id => `Your incorporation application ${id} could not be processed. Please contact support for details.`,
    },
};

exports.handleStatusUpdate = asyncHandler(async (req, res, next) => {
    try {
        customLog(req?.LogTraceId, 'info', {
            message: 'Company incorporation webhook received',
            body: req.body
        });

        const signatureHeader = req.headers['x-base93-signature'];

        const clientIP = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : undefined;

        const serviceDetails = await findServiceOperatorByAccessKey(ACCESS_KEY);
        if (serviceDetails?.error) {
            return next(new ErrorResponse('Webhook service unavailable', 503));
        }

        const secret = serviceDetails.vendor?.optional3;
        const whitelistedIPs = serviceDetails.vendor?.optional4;

        // ✅ IP whitelist (kept as-is)
        if (process.env.NODE_ENV === 'production' && whitelistedIPs) {
            const ipList = Array.isArray(whitelistedIPs) ? whitelistedIPs : [whitelistedIPs];
            if (!clientIP || !ipList.includes(clientIP)) {
                return next(new ErrorResponse('Access denied: IP address not whitelisted', 403));
            }
        }

        // ✅ HMAC validation
        if (!secret || !signatureHeader) {
            return next(new ErrorResponse('Missing signature', 401));
        }

        const [algorithm, ...rest] = signatureHeader.split('=');
        const receivedHmac = rest.join('=');

        if (algorithm !== 'sha256' || !receivedHmac) {
            return next(new ErrorResponse('Invalid signature format', 401));
        }

        const expectedHmac = crypto
            .createHmac('sha256', secret)
            .update(req.rawBody)
            .digest('hex');

        let isValid = false;

        try {
            if (receivedHmac.length === expectedHmac.length) {
                isValid = crypto.timingSafeEqual(
                    Buffer.from(receivedHmac, 'hex'),
                    Buffer.from(expectedHmac, 'hex')
                );
            }
        } catch (err) {
            customLog(req?.LogTraceId, "error", {
                message: "HMAC comparison failed",
                error: err.message
            }, "VENDOR");
        }

        // F-OAB-17: removed the re-serialized-JSON (===) Postman fallback; only the raw-body
        // HMAC above (constant-time) is accepted.
        if (!isValid) {
            customLog(req?.LogTraceId, "error", {
                message: "Webhook signature mismatch"
            }, "VENDOR");

            return next(new ErrorResponse('Invalid signature', 401));
        }

        // ✅ Updated payload mapping
        const {
            reference_id: vendorApplicationId,
            status: vendorStatus,
            message,
            stage
        } = req.body;

        if (!vendorApplicationId || !vendorStatus) {
            return next(new ErrorResponse('reference_id and status are required', 400));
        }

        customLog(req?.LogTraceId, 'info', {
            message: 'Webhook payload parsed',
            vendorApplicationId,
            vendorStatus,
            stage,
            messageText: message
        });

        // 'saved' = vendor acknowledged
        if (vendorStatus === 'saved') {
            customLog(req?.LogTraceId, 'info', {
                message: 'Vendor acknowledged application (saved)',
                vendorApplicationId
            });
            return res.status(200).json({
                status: true,
                message: 'Acknowledged',
                responseCode: '000',
                data: {}
            });
        }

        const ourStatus = VENDOR_STATUS_MAP[vendorStatus];
        if (!ourStatus) {
            customLog(req?.LogTraceId, 'error', {
                message: 'Unknown vendor status received',
                vendorStatus
            });
            return next(new ErrorResponse(`Unknown status: ${vendorStatus}`, 400));
        }

        const application = await companyIncorporation.findOne({
            where: { vendorApplicationId }
        });

        if (!application) {
            customLog(req?.LogTraceId, 'error', {
                message: 'Application not found for vendorApplicationId',
                vendorApplicationId
            });
            return next(new ErrorResponse('Application not found', 404));
        }

        const updateData = { status: ourStatus };

        if (ourStatus === 'APPROVED') {
            updateData.approvedAt = new Date();
        }

        // optional: store message if you want later
        if (message) {
            updateData.notes = message;
        }

        await updateApplicationStatus(application.applicationId, updateData);

        if (ourStatus === 'APPROVED' && application.vendorSetupId) {
            try {
                const apiUrl = serviceDetails.vendor?.apiUrl;
                const apiKey = serviceDetails.vendor?.optional1;
                if (apiUrl && apiKey) {
                    const stages = await getVendorApplicationStatus(apiUrl, apiKey, application.vendorSetupId);
                    const proposed = application.proposedNames || {};
                    const candidates = [proposed.firstChoice, proposed.secondChoice, proposed.thirdChoice].filter(Boolean);
                    let approvedName = null;

                    for (const stage of stages) {
                        const stageText = `${stage.title || ''} ${stage.description || ''}`.toLowerCase();
                        for (const candidate of candidates) {
                            if (stageText.includes(candidate.toLowerCase())) {
                                approvedName = candidate;
                                break;
                            }
                        }
                        if (approvedName) break;
                    }

                    if (!approvedName) approvedName = proposed.firstChoice;

                    if (approvedName) {
                        await application.update({ approvedCompanyName: approvedName });
                        await credential.update({ name: approvedName }, { where: { id: application.credentialId } });
                        customLog(req?.LogTraceId, 'info', {
                            message: 'Approved company name set and credential updated',
                            applicationId: application.applicationId,
                            approvedName,
                        });
                    }
                }
            } catch (nameErr) {
                customLog(req?.LogTraceId, 'info', {
                    message: 'Failed to set approved company name (non-fatal)',
                    error: nameErr.message,
                });
            }
        }

        const cred = await credential.findOne({
            where: { id: application.credentialId },
            attributes: ['username'],
        });

        if (cred && STATUS_NOTIFICATION[ourStatus]) {
            const notif = STATUS_NOTIFICATION[ourStatus];
            await createNotification({
                notificationTitle: notif.title,
                notificationBrief: notif.brief(application.applicationId),
                notificationTo: [cred.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            }).catch(err => {
                customLog(req?.LogTraceId, 'error', {
                    message: 'Notification failed',
                    err: err.message
                });
            });
        }

        customLog(req?.LogTraceId, 'info', {
            message: 'Application status updated via vendor webhook',
            applicationId: application.applicationId,
            vendorApplicationId,
            newStatus: ourStatus,
        });

        return res.status(200).json({
            status: true,
            message: 'Status updated successfully',
            responseCode: '000',
            data: {}
        });

    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Error in company incorporation webhook',
            error: error.message
        });
        return res.status(400).json({
            status: false,
            message: error?.message || 'Something went wrong.',
            responseCode: '001',
            data: {},
        });
    }
});
