const logger = require('./../utils/logger');

// Mask sensitive values before they reach the log transports (Logtail/Elastic/Loki).
// Keys are matched case-insensitively, ignoring _ and - so account_number / accountNumber both match.
const SENSITIVE_KEYS = new Set([
    'password', 'currentpassword', 'newpassword', 'confirmpassword', 'oldpassword',
    'otp', 'pin', 'cvv', 'mpin',
    'token', 'accesstoken', 'refreshtoken', 'idtoken', 'authorization', 'jwt',
    'secret', 'clientsecret', 'apikey', 'apisecret', 'privatekey',
    'aadhaar', 'aadhaarnumber', 'aadharnumber', 'pan', 'pannumber',
    'accountnumber', 'bankaccountnumber', 'ifsc', 'cardnumber', 'photobase64',
]);

const redactSensitive = (value, seen = new WeakSet()) => {
    if (Array.isArray(value)) return value.map((v) => redactSensitive(v, seen));
    if (value && typeof value === 'object') {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = SENSITIVE_KEYS.has(k.toLowerCase().replace(/[_-]/g, '')) ? '[REDACTED]' : redactSensitive(v, seen);
        }
        return out;
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
                    ...(req.method !== 'GET' ? { reqBody: redactSensitive(req.body) } : {}),
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