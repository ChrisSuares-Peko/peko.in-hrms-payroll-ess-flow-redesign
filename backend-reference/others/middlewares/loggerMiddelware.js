const logger = require('./../utils/logger');

    // F-OTH-27: denylist mask so OTP/password/PAN/bank/KYC-document fields never reach the
    // log stream, regardless of exact field name — a pattern match is more robust than an
    // exact-name list, since these fields show up under many different names across the
    // codebase (panNumber, aadhaarNumber, bankAccountNumber, ifscCode, otp, cvv, ...).
    const SENSITIVE_FIELD_PATTERN = /otp|password|pan|aadhaar|account.?no|ifsc|cvv|secret|token|base64|doc(ument)?$/i;

    const maskSensitiveFields = (value) => {
        if (Array.isArray(value)) return value.map(maskSensitiveFields);
        if (value && typeof value === 'object') {
            const masked = {};
            for (const key of Object.keys(value)) {
                masked[key] = SENSITIVE_FIELD_PATTERN.test(key)
                    ? '[REDACTED]'
                    : maskSensitiveFields(value[key]);
            }
            return masked;
        }
        return value;
    };

    const createLog = (req, res) => {
        try {
            if (req.method === 'OPTIONS') {
                return true;
            }

            const logLevel = res.statusCode >= 500 ? 'error' : 'info';

            return logger[logLevel]({
                request: {
                    httpMethod: req.method,
                    reqURL: req.originalUrl,
                    ...(req.method !== 'GET' ? { reqBody: maskSensitiveFields(req.body) } : {}),
                    pathParams: { ...req.params },
                    queryParams: { ...req.query },
                    clientIpAddress: req.headers['x-forwarded-for'] ||
                        req.connection?.remoteAddress ||
                        req?.ips,
                    deviceInfo: req.headers['user-agent'],
                    ...(req.headers.authorization ? { jwtToken: true } : {}),
                    ...(req.sessionId ? { sessionId: true } : {})
                },
                response: {
                    statusCode: res.statusCode,
                    statusMessage: res?.loggerMessage || res.statusMessage
                }
            },{ traceId: req?.LogTraceId });
        } catch (e) {
            return logger.error(e, { req });
        }
    };
    
    module.exports = createLog;