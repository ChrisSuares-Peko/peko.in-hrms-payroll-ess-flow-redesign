const logger = require('./../utils/logger');

// ONDC callbacks arrive constantly and on_search carries whole catalogs in the
// body, so they get no per-request log unless they fail (5xx).
const SKIP_INFO_LOG_PREFIXES = ['/api/v1/webhook/ondc'];

    const createLog = (req, res) => {
        try {
            if (req.method === 'OPTIONS') {
                return true;
            }

            const logLevel = res.statusCode >= 500 ? 'error' : 'info';

            if (logLevel === 'info' && SKIP_INFO_LOG_PREFIXES.some(prefix => req.originalUrl?.startsWith(prefix))) {
                return true;
            }

            return logger[logLevel]({
                request: {
                    httpMethod: req.method,
                    reqURL: req.originalUrl,
                    ...(req.method !== 'GET' ? { reqBody: { ...req.body } } : {}),
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