const crypto = require('crypto');

const asyncHandler = require('./async');
const ErrorResponse = require('../utils/error-response');
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');
const { customLog } = require('../utils/loggerHelper');

// Shared-secret guard for IndiaFilings vendor webhooks (business registration,
// govt services). The vendor is configured to send the secret in this header; we
// constant-time compare it against optional5 on the service record. Fails closed.
const WEBHOOK_SECRET_HEADER = 'x-webhook-secret';

const secretsMatch = (provided, expected) => {
    const a = Buffer.from(String(provided || ''));
    const b = Buffer.from(String(expected || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// accessKey -> the service-operator record holding the webhook secret (optional5).
module.exports = accessKey =>
    asyncHandler(async (req, res, next) => {
        const provided = req.headers[WEBHOOK_SECRET_HEADER];
        const service = await findServiceOperatorByAccessKey(accessKey);
        const secret = service?.vendor?.optional5;

        if (!secret) {
            customLog(req?.LogTraceId, 'error', {
                message: '[ifWebhookAuth] webhook secret not configured',
                accessKey,
            });
            return next(new ErrorResponse('Webhook not configured', 503));
        }

        if (!provided || !secretsMatch(provided, secret)) {
            customLog(req?.LogTraceId, 'error', {
                message: '[ifWebhookAuth] rejected: bad or missing secret',
                clientIP: req.headers['x-forwarded-for']
                    ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
                    : null,
            });
            return next(new ErrorResponse('Unauthorized', 401));
        }

        return next();
    });
